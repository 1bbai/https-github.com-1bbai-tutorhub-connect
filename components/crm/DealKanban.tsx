'use client'

import { useState, useCallback } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { format } from 'date-fns'
import { Plus, DollarSign, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DealDrawer } from '@/components/crm/DealDrawer'
import type { PipelineWithDeals } from '@/lib/crm/pipeline-helpers'
import type { CrmDealWithRelations, CrmPipelineStage, User } from '@/types/database'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface DealKanbanProps {
  pipeline: PipelineWithDeals
  staffList: User[]
}

function formatCAD(value: number | null): string {
  if (!value) return '$0'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─────────────────────────────────────────────
// NewDealDialog
// ─────────────────────────────────────────────

interface NewDealDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  stageId: string
  pipelineId: string
  staffList: User[]
  onCreated: () => void
}

function NewDealDialog({
  open,
  onOpenChange,
  stageId,
  pipelineId,
  staffList,
  onCreated,
}: NewDealDialogProps) {
  const [title, setTitle] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [contactId, setContactId] = useState('')
  const [value, setValue] = useState('')
  const [closeDate, setCloseDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('unassigned')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<{ id: string; full_name: string; company_name: string | null }[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  async function searchContacts(q: string) {
    if (!q.trim()) return
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/crm/contacts?q=${encodeURIComponent(q)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts ?? data ?? [])
      }
    } catch {
      // ignore
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error('Deal title is required')
      return
    }
    if (!contactId) {
      toast.error('Please select a contact')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          contactId,
          pipelineId,
          stageId,
          value: value ? parseFloat(value) : null,
          expectedCloseDate: closeDate || null,
          assignedTo: assignedTo === 'unassigned' ? null : assignedTo,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create deal')
      }
      toast.success('Deal created')
      onCreated()
      onOpenChange(false)
      setTitle('')
      setContactId('')
      setContactSearch('')
      setValue('')
      setCloseDate('')
      setAssignedTo('unassigned')
      setNotes('')
      setContacts([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create deal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Deal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Deal Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Virtual Office Package"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Contact *</Label>
            <Input
              value={contactSearch}
              onChange={(e) => {
                setContactSearch(e.target.value)
                searchContacts(e.target.value)
              }}
              placeholder="Search contacts..."
              className="mt-1"
            />
            {contacts.length > 0 && (
              <div className="border border-border rounded-md mt-1 bg-popover shadow-md max-h-40 overflow-y-auto">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      contactId === c.id ? 'bg-accent font-medium' : ''
                    }`}
                    onClick={() => {
                      setContactId(c.id)
                      setContactSearch(
                        c.company_name ? `${c.full_name} (${c.company_name})` : c.full_name
                      )
                      setContacts([])
                    }}
                  >
                    <span className="font-medium">{c.full_name}</span>
                    {c.company_name && (
                      <span className="text-muted-foreground ml-1">· {c.company_name}</span>
                    )}
                  </button>
                ))}
                {searchLoading && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Value (CAD)</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Expected Close</Label>
              <Input
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Assigned To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 resize-none"
              placeholder="Optional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Deal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// DealCard
// ─────────────────────────────────────────────

function DealCard({
  deal,
  index,
  onClick,
}: {
  deal: CrmDealWithRelations
  index: number
  onClick: () => void
}) {
  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow mb-2 ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/40 rotate-1' : ''
          }`}
        >
          {/* Contact + company */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {deal.contact?.company_name ?? deal.contact?.full_name}
              </p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">
                {deal.title}
              </p>
            </div>
            {deal.assigned_user && (
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                  {getInitials(deal.assigned_user.full_name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Value */}
          {deal.value != null && (
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
              <DollarSign className="w-3 h-3" />
              {formatCAD(deal.value)}
            </div>
          )}

          {/* Expected close date */}
          {deal.expected_close_date && (
            <p className="text-xs text-muted-foreground">
              Close: {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      )}
    </Draggable>
  )
}

// ─────────────────────────────────────────────
// DealKanban (main export)
// ─────────────────────────────────────────────

export function DealKanban({ pipeline, staffList }: DealKanbanProps) {
  const [stages, setStages] = useState(pipeline.stages)
  const [newDealStageId, setNewDealStageId] = useState<string | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<CrmDealWithRelations | null>(null)

  // Compute pipeline stats
  const allDeals = stages.flatMap((s) => s.deals)
  const openDeals = allDeals.filter((d) => d.status === 'open')
  const wonDeals = allDeals.filter((d) => d.status === 'won')
  const closedDeals = allDeals.filter((d) => d.status === 'won' || d.status === 'lost')
  const totalOpenValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const winRate = closedDeals.length > 0
    ? Math.round((wonDeals.length / closedDeals.length) * 100)
    : 0

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result
      if (!destination) return
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return
      }

      const newStageId = destination.droppableId

      // Optimistic update
      setStages((prev) => {
        const next = prev.map((stage) => ({ ...stage, deals: [...stage.deals] }))
        const srcStage = next.find((s) => s.id === source.droppableId)
        const dstStage = next.find((s) => s.id === newStageId)
        if (!srcStage || !dstStage) return prev
        const [moved] = srcStage.deals.splice(source.index, 1)
        dstStage.deals.splice(destination.index, 0, moved)
        return next
      })

      try {
        const res = await fetch(`/api/crm/deals/${draggableId}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stageId: newStageId }),
        })
        if (!res.ok) throw new Error('Failed to move deal')
        toast.success('Deal moved')
      } catch {
        toast.error('Failed to move deal')
        // Revert optimistic update
        setStages(pipeline.stages)
      }
    },
    [pipeline.stages]
  )

  function handleNewDealCreated() {
    // Refresh by navigating
    window.location.reload()
  }

  function handleDealUpdate() {
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Pipeline header */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Open Pipeline:</span>
          <span className="text-sm font-semibold text-foreground">{formatCAD(totalOpenValue)}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Win Rate:</span>
          <span className="text-sm font-semibold text-foreground">{winRate}%</span>
        </div>
        <div className="text-sm text-muted-foreground ml-auto">
          {allDeals.length} total deals
        </div>
      </div>

      {/* Kanban columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {stages.map((stage) => {
            const stageValue = stage.deals.reduce((sum, d) => sum + (d.value ?? 0), 0)

            return (
              <div
                key={stage.id}
                className="flex flex-col w-72 shrink-0 bg-muted/30 rounded-lg border border-border"
              >
                {/* Column header */}
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color ?? '#94a3b8' }}
                    />
                    <span className="text-sm font-semibold text-foreground truncate flex-1">
                      {stage.name}
                    </span>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {stage.deals.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatCAD(stageValue)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setNewDealStageId(stage.id)}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 min-h-[120px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary/5' : ''
                      }`}
                    >
                      {stage.deals.map((deal, idx) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          index={idx}
                          onClick={() => setSelectedDeal(deal)}
                        />
                      ))}
                      {provided.placeholder}
                      {stage.deals.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-6">
                          <p className="text-xs text-muted-foreground">No deals</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* New Deal Dialog */}
      {newDealStageId && (
        <NewDealDialog
          open={!!newDealStageId}
          onOpenChange={(v) => { if (!v) setNewDealStageId(null) }}
          stageId={newDealStageId}
          pipelineId={pipeline.id}
          staffList={staffList}
          onCreated={handleNewDealCreated}
        />
      )}

      {/* Deal Drawer */}
      {selectedDeal && (
        <DealDrawer
          deal={selectedDeal}
          stages={stages}
          staffList={staffList}
          onClose={() => setSelectedDeal(null)}
          onUpdate={handleDealUpdate}
        />
      )}
    </div>
  )
}
