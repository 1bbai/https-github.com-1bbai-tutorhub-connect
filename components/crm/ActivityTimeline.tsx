'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  MessageSquare,
  Settings,
  Plus,
  ChevronDown,
  Clock,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials, formatRelativeTime, formatDateTime } from '@/lib/utils'
import type { ActivityType, ActivityDirection } from '@/types/database'
import type { ActivityWithUser } from '@/lib/crm/activity-logger'

// ─────────────────────────────────────────────
// Activity type config
// ─────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  call: {
    icon: Phone,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    label: 'Call',
  },
  email: {
    icon: Mail,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    label: 'Email',
  },
  meeting: {
    icon: Calendar,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/40',
    label: 'Meeting',
  },
  note: {
    icon: FileText,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    label: 'Note',
  },
  task: {
    icon: CheckSquare,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/40',
    label: 'Task',
  },
  sms: {
    icon: MessageSquare,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/40',
    label: 'SMS',
  },
  system: {
    icon: Settings,
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    label: 'System',
  },
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface ActivityTimelineProps {
  contactId: string
  initialActivities: ActivityWithUser[]
  currentUserId: string
  dealId?: string
}

// ─────────────────────────────────────────────
// ActivityTimeline
// ─────────────────────────────────────────────

const PAGE_SIZE = 20

export function ActivityTimeline({
  contactId,
  initialActivities,
  currentUserId,
  dealId,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityWithUser[]>(initialActivities)
  const [showForm, setShowForm] = useState(false)
  const [offset, setOffset] = useState(initialActivities.length)
  const [hasMore, setHasMore] = useState(initialActivities.length === PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)

  // ── Realtime subscription ────────────────────
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`activities:${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_activities',
          filter: `contact_id=eq.${contactId}`,
        },
        async (payload) => {
          // Fetch the full activity with user info
          const { data } = await supabase
            .from('crm_activities')
            .select(`
              *,
              created_by_user:users!crm_activities_created_by_fkey(id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setActivities((prev) => [data as unknown as ActivityWithUser, ...prev])
            setOffset((o) => o + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contactId])

  // ── Load more ────────────────────────────────
  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/crm/contacts/${contactId}/activities?offset=${offset}&limit=${PAGE_SIZE}${dealId ? `&dealId=${dealId}` : ''}`
      )
      if (!res.ok) throw new Error()
      const data: ActivityWithUser[] = await res.json()
      setActivities((prev) => [...prev, ...data])
      setOffset((o) => o + data.length)
      setHasMore(data.length === PAGE_SIZE)
    } catch {
      toast.error('Failed to load more activities')
    } finally {
      setLoadingMore(false)
    }
  }, [contactId, offset, dealId])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Activity</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Activity
              <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(['note', 'call', 'email', 'meeting'] as ActivityType[]).map((type) => {
              const cfg = ACTIVITY_CONFIG[type]
              const Icon = cfg.icon
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setShowForm(true)}
                  className="gap-2"
                >
                  <Icon className={cn('w-4 h-4', cfg.color)} />
                  Log {cfg.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Inline Add Form */}
      {showForm && (
        <AddActivityForm
          contactId={contactId}
          currentUserId={currentUserId}
          dealId={dealId}
          onSaved={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setShowForm(true)}
          >
            Log the first activity
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

          <div className="space-y-0">
            {activities.map((activity, idx) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={idx === activities.length - 1}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-4 pl-8">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                )}
                Load older activities
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// ActivityItem
// ─────────────────────────────────────────────

function ActivityItem({
  activity,
  isLast,
}: {
  activity: ActivityWithUser
  isLast: boolean
}) {
  const cfg = ACTIVITY_CONFIG[activity.type as ActivityType] ?? ACTIVITY_CONFIG.system
  const Icon = cfg.icon

  return (
    <div className={cn('flex gap-4 pb-5', isLast && 'pb-0')}>
      {/* Icon bubble */}
      <div className="relative z-10 shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            cfg.bgColor
          )}
        >
          <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {activity.created_by_user && (
              <div className="flex items-center gap-1.5">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[9px] bg-muted">
                    {getInitials(activity.created_by_user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {activity.created_by_user.full_name}
                </span>
              </div>
            )}
            {activity.direction && (
              <span className="text-xs text-muted-foreground/60 capitalize">
                · {activity.direction}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span title={formatDateTime(activity.occurred_at)}>
              {formatRelativeTime(activity.occurred_at)}
            </span>
          </div>
        </div>

        <p className="font-medium text-sm text-foreground mt-1">{activity.subject}</p>
        {activity.body && (
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
            {activity.body}
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// AddActivityForm
// ─────────────────────────────────────────────

interface AddActivityFormProps {
  contactId: string
  currentUserId: string
  dealId?: string
  onSaved: () => void
  onCancel: () => void
}

type FormType = 'note' | 'call' | 'email' | 'meeting'

function AddActivityForm({
  contactId,
  currentUserId,
  dealId,
  onSaved,
  onCancel,
}: AddActivityFormProps) {
  const [type, setType] = useState<FormType>('note')
  const [subject, setSubject] = useState('Note')
  const [body, setBody] = useState('')
  const [direction, setDirection] = useState<ActivityDirection>('outbound')
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 16)
  )
  const [loading, setLoading] = useState(false)

  function handleTypeChange(t: FormType) {
    setType(t)
    if (t === 'note') setSubject('Note')
    else if (t === 'call') setSubject('Phone call')
    else if (t === 'email') setSubject('Email')
    else if (t === 'meeting') setSubject('Meeting')
  }

  async function handleSave() {
    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/crm/contacts/${contactId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject,
          body: body || null,
          direction: ['call', 'email', 'sms'].includes(type) ? direction : null,
          dealId: dealId ?? null,
          createdBy: currentUserId,
          occurredAt: new Date(occurredAt).toISOString(),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      toast.success('Activity logged')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log activity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ml-12 mb-6 p-4 rounded-lg border border-border bg-card shadow-sm">
      <Tabs value={type} onValueChange={(v) => handleTypeChange(v as FormType)}>
        <TabsList className="h-8 mb-4">
          {(['note', 'call', 'email', 'meeting'] as FormType[]).map((t) => (
            <TabsTrigger key={t} value={t} className="text-xs capitalize h-7">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-8 text-sm mt-1"
            placeholder="Subject"
          />
        </div>

        <div>
          <Label className="text-xs">Details</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="text-sm mt-1 resize-none"
            placeholder={
              type === 'note' ? 'Write your note…' : 'Add details…'
            }
          />
        </div>

        <div className="flex items-center gap-3">
          {['call', 'email', 'sms'].includes(type) && (
            <div className="flex-1">
              <Label className="text-xs">Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as ActivityDirection)}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1">
            <Label className="text-xs">Date & Time</Label>
            <Input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
