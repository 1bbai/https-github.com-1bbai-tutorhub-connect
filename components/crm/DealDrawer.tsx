'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Pencil,
  Check,
  X,
  ExternalLink,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'
import type { CrmDealWithRelations, CrmPipelineStage, User, DealStatus, CrmActivity } from '@/types/database'

interface DealDrawerProps {
  deal: CrmDealWithRelations
  stages: (CrmPipelineStage & { deals?: CrmDealWithRelations[] })[]
  staffList: User[]
  onClose: () => void
  onUpdate: () => void
}

const STATUS_OPTIONS: { value: DealStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'won', label: 'Won', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200' },
]

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatCAD(value: number | null): string {
  if (!value) return ''
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value)
}

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞',
  email: '✉️',
  meeting: '🤝',
  note: '📝',
  task: '✅',
  sms: '💬',
  system: '⚙️',
}

export function DealDrawer({ deal, stages, staffList, onClose, onUpdate }: DealDrawerProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(deal.title)
  const [stageId, setStageId] = useState(deal.stage_id)
  const [value, setValue] = useState(deal.value?.toString() ?? '')
  const [closeDate, setCloseDate] = useState(deal.expected_close_date ?? '')
  const [assignedTo, setAssignedTo] = useState(deal.assigned_to ?? 'unassigned')
  const [status, setStatus] = useState<DealStatus>(deal.status)
  const [notes, setNotes] = useState(deal.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [activitiesLoaded, setActivitiesLoaded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load activities on first render
  useState(() => {
    async function load() {
      try {
        const res = await fetch(`/api/crm/activities?contactId=${deal.contact_id}&dealId=${deal.id}&limit=5`)
        if (res.ok) {
          const data = await res.json()
          setActivities(data.activities ?? data ?? [])
        }
      } catch {
        // ignore
      } finally {
        setActivitiesLoaded(true)
      }
    }
    load()
  })

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          stage_id: stageId,
          value: value ? parseFloat(value) : null,
          expected_close_date: closeDate || null,
          assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
          status,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save')
      }
      toast.success('Deal updated')
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save deal')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete deal')
      toast.success('Deal deleted')
      onClose()
      onUpdate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete deal')
    } finally {
      setDeleting(false)
    }
  }

  const currentStage = stages.find((s) => s.id === stageId)

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-semibold h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingTitle(false)
                  if (e.key === 'Escape') { setTitle(deal.title); setEditingTitle(false) }
                }}
              />
              <button
                onClick={() => setEditingTitle(false)}
                className="p-1 text-emerald-600 hover:text-emerald-700"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setTitle(deal.title); setEditingTitle(false) }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <SheetTitle className="text-base font-semibold text-foreground leading-snug flex-1">
                {title}
              </SheetTitle>
              <button
                onClick={() => setEditingTitle(true)}
                className="p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
                aria-label="Edit title"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-5">
            {/* Stage */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Stage</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger className="mt-1.5 h-9">
                  <div className="flex items-center gap-2">
                    {currentStage && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: currentStage.color ?? '#94a3b8' }}
                      />
                    )}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color ?? '#94a3b8' }}
                        />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Contact</Label>
              <div className="mt-1.5 flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                    {getInitials(deal.contact.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{deal.contact.full_name}</p>
                  {deal.contact.company_name && (
                    <p className="text-xs text-muted-foreground truncate">{deal.contact.company_name}</p>
                  )}
                </div>
                <Link
                  href={`/admin/crm/contacts/${deal.contact_id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Value + Close Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Value (CAD)</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Expected Close</Label>
                <Input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="mt-1.5 h-9"
                />
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="mt-1.5 h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
              <div className="flex items-center gap-2 mt-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      status === opt.value
                        ? opt.color
                        : 'border-border bg-transparent text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Deal notes..."
                className="mt-1.5 resize-none"
              />
            </div>

            {/* Save */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Separator />

            {/* Activity section */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Recent Activity
              </p>
              {!activitiesLoaded ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : activities.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activities recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-2.5">
                      <span className="text-sm mt-0.5 shrink-0">
                        {ACTIVITY_ICONS[activity.type] ?? '📋'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.subject}
                        </p>
                        {activity.body && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {activity.body}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(activity.occurred_at), 'MMM d, yyyy · h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Deal'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &ldquo;{deal.title}&rdquo;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="h-4" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
