'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, isPast, isToday } from 'date-fns'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import {
  LayoutGrid,
  List,
  Plus,
  Filter,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import type {
  TaskWithUsers,
  User,
  TaskStatus,
  TaskPriority,
  TaskServiceCategory,
} from '@/types/database'
import { cn } from '@/lib/utils'

interface TaskBoardProps {
  initialTasks: TaskWithUsers[]
  staff: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]
  clients: Pick<User, 'id' | 'full_name' | 'company_name' | 'email'>[]
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'open', label: 'Open', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'awaiting_client', label: 'Awaiting Client', color: 'bg-yellow-50 dark:bg-yellow-950/30' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-50 dark:bg-emerald-950/30' },
]

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; badge: string; dot: string }> = {
  urgent: {
    label: 'Urgent',
    badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
    dot: 'bg-red-500',
  },
  high: {
    label: 'High',
    badge: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  low: {
    label: 'Low',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_progress: { label: 'In Progress', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  awaiting_client: { label: 'Awaiting Client', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  completed: { label: 'Completed', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', badge: 'bg-muted text-muted-foreground border-border' },
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium', cfg.badge)}>
      {cfg.label}
    </Badge>
  )
}

function TaskCard({
  task,
  onClick,
  dragHandleProps,
  draggableProps,
  innerRef,
}: {
  task: TaskWithUsers
  onClick: () => void
  dragHandleProps: object
  draggableProps: object
  innerRef: (el: HTMLElement | null) => void
}) {
  const isOverdue =
    task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
  const isDueToday = task.due_date && isToday(new Date(task.due_date))

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 shadow-soft cursor-pointer hover:border-primary/40 hover:shadow-medium transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.client && (
        <p className="text-xs text-muted-foreground mb-2 truncate">
          {task.client.full_name}
          {task.client.company_name && ` · ${task.client.company_name}`}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        {task.assignee ? (
          <Avatar className="w-5 h-5">
            <AvatarImage src={task.assignee.avatar_url ?? undefined} />
            <AvatarFallback className="text-[9px]">
              {task.assignee.full_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-[10px] text-muted-foreground">Unassigned</span>
        )}

        {task.due_date && (
          <span
            className={cn(
              'text-[10px] font-medium',
              isOverdue
                ? 'text-red-600 dark:text-red-400'
                : isDueToday
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-muted-foreground'
            )}
          >
            {isOverdue && '! '}
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}

export function TaskBoard({
  initialTasks,
  staff,
  clients,
}: TaskBoardProps) {
  const router = useRouter()
  const supabase = createClient()

  const [tasks, setTasks] = useState<TaskWithUsers[]>(initialTasks)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  // Filters
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [filterClient, setFilterClient] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    client_id: '',
    service_category: '' as TaskServiceCategory | '',
    assigned_to: '',
    priority: 'medium' as TaskPriority,
    due_date: '',
  })

  // Detail panel
  const [selectedTask, setSelectedTask] = useState<TaskWithUsers | null>(null)
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [taskComments, setTaskComments] = useState<
    { id: string; body: string; author: { full_name: string; avatar_url: string | null }; created_at: string }[]
  >([])

  // Filter tasks
  const filtered = tasks.filter((t) => {
    if (filterAssignee !== 'all' && t.assigned_to !== filterAssignee) return false
    if (filterClient !== 'all' && t.client_id !== filterClient) return false
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    return true
  })

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filtered.filter((t) => t.status === col.id)
    return acc
  }, {} as Record<TaskStatus, TaskWithUsers[]>)

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return
    const taskId = result.draggableId
    const newStatus = result.destination.droppableId as TaskStatus

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      toast.error('Failed to update task status')
      setTasks(initialTasks)
    }
  }

  async function handleCreateTask() {
    if (!newTask.title.trim()) {
      toast.error('Title is required')
      return
    }
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          client_id: newTask.client_id || null,
          service_category:
            (newTask.service_category as TaskServiceCategory) || null,
          assigned_to: newTask.assigned_to || null,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          status: 'open',
        })
        .select(`
          id, title, description, client_id, assigned_to, created_by, service_category,
          priority, status, due_date, created_at, updated_at,
          client:users!tasks_client_id_fkey(id, full_name, email, company_name),
          assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
          creator:users!tasks_created_by_fkey(id, full_name)
        `)
        .single()

      if (error) throw error
      setTasks((prev) => [data as unknown as TaskWithUsers, ...prev])
      toast.success('Task created')
      setCreateOpen(false)
      setNewTask({
        title: '',
        description: '',
        client_id: '',
        service_category: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      })
    } catch {
      toast.error('Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  async function openTaskDetail(task: TaskWithUsers) {
    setSelectedTask(task)
    const { data } = await supabase
      .from('task_comments')
      .select('id, body, created_at, author:users!task_comments_author_id_fkey(full_name, avatar_url)')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
    setTaskComments(
      (data ?? []).map((c) => ({
        ...c,
        author: Array.isArray(c.author) ? c.author[0] : c.author,
      })) as typeof taskComments
    )
  }

  async function handleAddComment() {
    if (!selectedTask || !newComment.trim()) return
    setCommentLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.from('task_comments').insert({
        task_id: selectedTask.id,
        author_id: user.id,
        body: newComment,
      })

      setTaskComments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          body: newComment,
          created_at: new Date().toISOString(),
          author: { full_name: 'You', avatar_url: null },
        },
      ])
      setNewComment('')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  async function handleStatusChange(status: TaskStatus) {
    if (!selectedTask) return
    setSelectedTask((t) => t ? { ...t, status } : null)
    setTasks((prev) =>
      prev.map((t) => (t.id === selectedTask.id ? { ...t, status } : t))
    )
    await supabase
      .from('tasks')
      .update({ status })
      .eq('id', selectedTask.id)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Tasks"
        description={`${tasks.length} total tasks`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('kanban')}
              className={cn(view === 'kanban' && 'bg-accent')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('list')}
              className={cn(view === 'list' && 'bg-accent')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All staff</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-44 h-8">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36 h-8">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.id] ?? []
              return (
                <div key={col.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {col.label}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {colTasks.length}
                    </Badge>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors',
                          col.color,
                          snapshot.isDraggingOver && 'ring-2 ring-primary/30'
                        )}
                      >
                        {colTasks.map((task, idx) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={idx}
                          >
                            {(dragProvided) => (
                              <TaskCard
                                task={task}
                                onClick={() => openTaskDetail(task)}
                                innerRef={dragProvided.innerRef}
                                draggableProps={dragProvided.draggableProps}
                                dragHandleProps={dragProvided.dragHandleProps ?? {}}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colTasks.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-8">
                            No tasks
                          </p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No tasks"
              description="Create a task to get started."
              action={{ label: 'New Task', onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => openTaskDetail(task)}
                  >
                    <TableCell className="font-medium text-sm">
                      {task.title}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.client?.full_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[9px]">
                              {task.assignee.full_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{task.assignee.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          STATUS_CONFIG[task.status].badge
                        )}
                      >
                        {STATUS_CONFIG[task.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.due_date
                        ? format(new Date(task.due_date), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input
                className="mt-1.5"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask((t) => ({ ...t, title: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1.5 min-h-[80px]"
                placeholder="Task description..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((t) => ({ ...t, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client</Label>
                <Select
                  value={newTask.client_id || 'none'}
                  onValueChange={(v) =>
                    setNewTask((t) => ({
                      ...t,
                      client_id: v === 'none' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={newTask.service_category || 'general'}
                  onValueChange={(v) =>
                    setNewTask((t) => ({
                      ...t,
                      service_category:
                        v === 'general' ? '' : (v as TaskServiceCategory),
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="virtual_office">Virtual Office</SelectItem>
                    <SelectItem value="loan_assistance">
                      Loan Assistance
                    </SelectItem>
                    <SelectItem value="business_registration">
                      Business Registration
                    </SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assign To</Label>
                <Select
                  value={newTask.assigned_to || 'unassigned'}
                  onValueChange={(v) =>
                    setNewTask((t) => ({
                      ...t,
                      assigned_to: v === 'unassigned' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Assign to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v) =>
                    setNewTask((t) => ({
                      ...t,
                      priority: v as TaskPriority,
                    }))
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                className="mt-1.5"
                value={newTask.due_date}
                onChange={(e) =>
                  setNewTask((t) => ({ ...t, due_date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={creating}>
              {creating ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Sheet */}
      <Sheet
        open={!!selectedTask}
        onOpenChange={(o) => !o && setSelectedTask(null)}
      >
        <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
          {selectedTask && (
            <>
              <SheetHeader className="px-6 py-5 border-b border-border">
                <SheetTitle className="text-base leading-snug">
                  {selectedTask.title}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="px-6 py-4 space-y-6">
                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Select
                        value={selectedTask.status}
                        onValueChange={(v) =>
                          handleStatusChange(v as TaskStatus)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Priority
                      </p>
                      <PriorityBadge priority={selectedTask.priority} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Assignee
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTask.assignee?.full_name ?? 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Due Date
                      </p>
                      <p className="text-sm font-medium">
                        {selectedTask.due_date
                          ? format(
                              new Date(selectedTask.due_date),
                              'MMM d, yyyy'
                            )
                          : '—'}
                      </p>
                    </div>
                    {selectedTask.client && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Client
                        </p>
                        <p className="text-sm font-medium">
                          {selectedTask.client.full_name}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedTask.description && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Description
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {selectedTask.description}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Comments */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Comments ({taskComments.length})
                    </p>
                    {taskComments.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No comments yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {taskComments.map((comment) => (
                          <div key={comment.id} className="flex gap-2.5">
                            <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                              <AvatarImage
                                src={comment.author.avatar_url ?? undefined}
                              />
                              <AvatarFallback className="text-[9px]">
                                {comment.author.full_name
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-medium">
                                  {comment.author.full_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {format(
                                    new Date(comment.created_at),
                                    'MMM d, h:mm a'
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-foreground mt-0.5">
                                {comment.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        className="min-h-[60px] text-sm resize-none"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={commentLoading || !newComment.trim()}
                      >
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
