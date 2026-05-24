'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { HeadphonesIcon, Plus, ArrowLeft, Send, Loader2, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/shared/EmptyState'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskComment, TaskServiceCategory, TaskStatus } from '@/types/database'

interface CommentWithAuthor extends TaskComment {
  author: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface SupportThreadProps {
  initialTasks: Task[]
  clientId: string
}

const statusStyle: Record<TaskStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  awaiting_client: { label: 'Awaiting You', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const categoryLabel: Record<TaskServiceCategory, string> = {
  virtual_office: 'Virtual Office',
  loan_assistance: 'Loan Assistance',
  business_registration: 'Business Registration',
  room: 'Room',
  general: 'General',
}

// ─── New Request Dialog ────────────────────────────────────────────────────────

function NewRequestDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (task: Task) => void
}) {
  const [subject, setSubject] = React.useState('')
  const [category, setCategory] = React.useState<TaskServiceCategory>('general')
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  function reset() {
    setSubject('')
    setCategory('general')
    setDescription('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in the subject and description.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/support/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: subject.trim(), description: description.trim(), category }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create request')
      }
      const data = await res.json()
      toast.success('Support request submitted!')
      onCreated(data.task)
      onOpenChange(false)
      reset()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (!v) reset() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Support Request</DialogTitle>
          <DialogDescription>
            Describe your issue and our team will get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Brief description of your issue..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TaskServiceCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="virtual_office">Virtual Office</SelectItem>
                <SelectItem value="loan_assistance">Loan Assistance</SelectItem>
                <SelectItem value="business_registration">Business Registration</SelectItem>
                <SelectItem value="room">Meeting Room</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please provide as much detail as possible..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attachment" className="text-muted-foreground">
              Attachment (optional)
            </Label>
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input id="attachment" type="file" className="text-sm" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Request Detail ────────────────────────────────────────────────────────────

function RequestDetail({
  task,
  clientId,
  onBack,
}: {
  task: Task
  clientId: string
  onBack: () => void
}) {
  const [comments, setComments] = React.useState<CommentWithAuthor[]>([])
  const [loadingComments, setLoadingComments] = React.useState(true)
  const [replyText, setReplyText] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchComments()

    // Realtime subscription
    const channel = supabase
      .channel(`task-comments-${task.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${task.id}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [task.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function fetchComments() {
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/support/requests/${task.id}/comments`)
      if (!res.ok) throw new Error('Failed to fetch comments')
      const data = await res.json()
      setComments(data.comments ?? [])
    } catch {
      // silently fail for realtime updates
    } finally {
      setLoadingComments(false)
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/requests/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to send reply')
      }
      setReplyText('')
      await fetchComments()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const status = statusStyle[task.status] ?? { label: task.status, className: 'bg-gray-100 text-gray-600 border-gray-200' }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 h-8 gap-1.5 text-xs" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Requests
        </Button>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-foreground leading-tight">{task.title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {task.service_category && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                {categoryLabel[task.service_category] ?? task.service_category}
              </span>
            )}
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Created {formatRelativeTime(task.created_at)}
        </p>
      </div>

      {/* Description */}
      {task.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1.5">Description</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Comment Thread */}
      <div className="flex-1 space-y-3">
        <p className="text-sm font-semibold text-foreground">Conversation</p>
        {loadingComments ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading messages...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No messages yet. Send a reply below to start the conversation.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {comments.map((comment) => {
              const isClient = comment.author_id === clientId
              const initials = getInitials(comment.author?.full_name ?? 'Staff')
              return (
                <div
                  key={comment.id}
                  className={cn('flex gap-2.5', isClient ? 'flex-row-reverse' : 'flex-row')}
                >
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    isClient ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {isClient ? 'You'[0] : initials}
                  </div>
                  <div className={cn('max-w-[75%] space-y-1', isClient ? 'items-end' : 'items-start')}>
                    <div className={cn(
                      'flex items-center gap-2 text-xs',
                      isClient ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      <span className="font-medium text-foreground">
                        {isClient ? 'You' : comment.author?.full_name ?? 'Staff'}
                      </span>
                      <span className="text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
                    </div>
                    <div className={cn(
                      'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      isClient
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    )}>
                      {comment.body}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Reply Box */}
      <form onSubmit={handleSendReply} className="flex gap-2 items-end pt-2 border-t border-border">
        <Textarea
          placeholder="Type a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={2}
          className="flex-1 min-h-0 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (!sending && replyText.trim()) {
                const syntheticEvent = { preventDefault: () => {} } as React.FormEvent
                handleSendReply(syntheticEvent)
              }
            }
          }}
        />
        <Button type="submit" size="sm" disabled={sending || !replyText.trim()} className="h-9 px-3">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function SupportThread({ initialTasks, clientId }: SupportThreadProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)
  const [newRequestOpen, setNewRequestOpen] = React.useState(false)

  function handleTaskCreated(task: Task) {
    setTasks((prev) => [task, ...prev])
    setSelectedTask(task)
  }

  if (selectedTask) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Support</h2>
        <RequestDetail
          task={selectedTask}
          clientId={clientId}
          onBack={() => setSelectedTask(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Support Requests</h2>
        <Button size="sm" onClick={() => setNewRequestOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={HeadphonesIcon}
          title="No support requests"
          description="Have a question or need help? Submit a support request and our team will assist you."
          action={{ label: 'New Request', onClick: () => setNewRequestOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const status = statusStyle[task.status] ?? { label: task.status, className: 'bg-gray-100 text-gray-600 border-gray-200' }
            return (
              <Card
                key={task.id}
                className="hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.service_category && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                          {categoryLabel[task.service_category]}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(task.updated_at)}
                      </span>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${status.className}`}>
                    {status.label}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <NewRequestDialog
        open={newRequestOpen}
        onOpenChange={setNewRequestOpen}
        onCreated={handleTaskCreated}
      />
    </div>
  )
}
