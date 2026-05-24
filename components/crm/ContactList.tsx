'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Tag,
  Download,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn, getInitials, formatRelativeTime, debounce } from '@/lib/utils'
import type { ContactWithActivity } from '@/lib/crm/contact-helpers'
import type { CrmTag, User, ContactStatus, ContactSource } from '@/types/database'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAGE_SIZE = 25

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
]

const SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Sources' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'walk_in', label: 'Walk In' },
  { value: 'other', label: 'Other' },
]

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  prospect: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  churned: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface ContactListProps {
  initialContacts: ContactWithActivity[]
  staffUsers: Pick<User, 'id' | 'full_name' | 'avatar_url'>[]
  tags: CrmTag[]
}

// ─────────────────────────────────────────────
// ContactList
// ─────────────────────────────────────────────

export function ContactList({ initialContacts, staffUsers, tags }: ContactListProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)

  // ── Filtering (client-side for now) ──────────
  const filtered = initialContacts.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (sourceFilter !== 'all' && c.source !== sourceFilter) return false
    if (assignedFilter !== 'all' && c.assigned_to !== assignedFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const matches =
        c.full_name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.company_name ?? '').toLowerCase().includes(q)
      if (!matches) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const allSelected =
    paginated.length > 0 && paginated.every((c) => selectedIds.has(c.id))
  const someSelected = selectedIds.size > 0

  // ── Handlers ─────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setSearch(value)
      setPage(1)
    }, 300),
    []
  )

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginated.forEach((c) => next.delete(c.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        paginated.forEach((c) => next.add(c.id))
        return next
      })
    }
  }

  function handleRowClick(id: string) {
    startTransition(() => {
      router.push(`/admin/crm/contacts/${id}`)
    })
  }

  function exportCsv() {
    const rows = filtered.filter((c) =>
      selectedIds.size > 0 ? selectedIds.has(c.id) : true
    )
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Tags']
    const lines = [
      headers.join(','),
      ...rows.map((c) =>
        [
          `"${c.full_name}"`,
          `"${c.email ?? ''}"`,
          `"${c.phone ?? ''}"`,
          `"${c.company_name ?? ''}"`,
          c.status,
          c.source,
          `"${(c.tags ?? []).join('; ')}"`,
        ].join(',')
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${filtered.length} contact${filtered.length !== 1 ? 's' : ''}`}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Contact
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, email, company…"
            className="pl-9"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1) }}
          >
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sourceFilter}
            onValueChange={(v) => { setSourceFilter(v); setPage(1) }}
          >
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={assignedFilter}
            onValueChange={(v) => { setAssignedFilter(v); setPage(1) }}
          >
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staffUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAssignOpen(true)}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkStatusOpen(true)}
            >
              <Tag className="w-3.5 h-3.5 mr-1.5" />
              Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Try adjusting your filters or create your first contact."
          action={{ label: 'New Contact', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="w-4 h-4 rounded border border-border flex items-center justify-center hover:border-primary transition-colors"
                      aria-label={allSelected ? 'Deselect all' : 'Select all'}
                    >
                      {allSelected && <Check className="w-3 h-3 text-primary" />}
                    </button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                  <TableHead className="hidden xl:table-cell">Tags</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Activity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    selected={selectedIds.has(contact.id)}
                    onSelect={() => toggleSelect(contact.id)}
                    onRowClick={() => handleRowClick(contact.id)}
                    tags={tags}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} contacts
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        staffUsers={staffUsers}
        tags={tags}
        onCreated={() => {
          setCreateOpen(false)
          router.refresh()
        }}
      />

      {/* Bulk Assign Dialog */}
      <BulkAssignDialog
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        selectedIds={Array.from(selectedIds)}
        staffUsers={staffUsers}
        onDone={() => {
          setBulkAssignOpen(false)
          setSelectedIds(new Set())
          router.refresh()
        }}
      />

      {/* Bulk Status Dialog */}
      <BulkStatusDialog
        open={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        selectedIds={Array.from(selectedIds)}
        onDone={() => {
          setBulkStatusOpen(false)
          setSelectedIds(new Set())
          router.refresh()
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// ContactRow
// ─────────────────────────────────────────────

interface ContactRowProps {
  contact: ContactWithActivity
  selected: boolean
  onSelect: () => void
  onRowClick: () => void
  tags: CrmTag[]
}

function ContactRow({ contact, selected, onSelect, onRowClick, tags }: ContactRowProps) {
  const initials = getInitials(contact.full_name)
  const contactTags = tags.filter((t) => (contact.tags ?? []).includes(t.name))

  return (
    <TableRow
      className={cn(
        'cursor-pointer transition-colors',
        selected && 'bg-primary/5'
      )}
      onClick={onRowClick}
    >
      <TableCell onClick={(e) => { e.stopPropagation(); onSelect() }} className="cursor-default">
        <div className="w-4 h-4 rounded border border-border flex items-center justify-center hover:border-primary transition-colors">
          {selected && <Check className="w-3 h-3 text-primary" />}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm text-foreground truncate">{contact.full_name}</p>
            {(contact.email || contact.company_name) && (
              <p className="text-xs text-muted-foreground truncate">
                {contact.company_name ?? contact.email}
              </p>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge
          variant="secondary"
          className={cn('text-xs font-medium capitalize', STATUS_COLORS[contact.status])}
        >
          {contact.status}
        </Badge>
      </TableCell>

      <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">
        {contact.source.replace('_', ' ')}
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        {contact.assigned_user ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-[10px] bg-muted">
                {getInitials(contact.assigned_user.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {contact.assigned_user.full_name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>

      <TableCell className="hidden xl:table-cell">
        <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
          {contactTags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: tag.color ? `${tag.color}22` : '#6366f122',
                color: tag.color ?? '#6366f1',
              }}
            >
              {tag.name}
            </span>
          ))}
          {contactTags.length > 3 && (
            <span className="text-[11px] text-muted-foreground">+{contactTags.length - 3}</span>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
        {contact.last_activity_at
          ? formatRelativeTime(contact.last_activity_at)
          : contact.activity_count > 0
          ? `${contact.activity_count} activit${contact.activity_count === 1 ? 'y' : 'ies'}`
          : '—'}
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <span className="sr-only">Actions</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M3.625 7.5a.875.875 0 1 1-1.75 0 .875.875 0 0 1 1.75 0zm4.25 0a.875.875 0 1 1-1.75 0 .875.875 0 0 1 1.75 0zm3.375.875a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75z" fill="currentColor" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRowClick()}>
              View Contact
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// ─────────────────────────────────────────────
// CreateContactDialog
// ─────────────────────────────────────────────

interface CreateContactDialogProps {
  open: boolean
  onClose: () => void
  staffUsers: Pick<User, 'id' | 'full_name' | 'avatar_url'>[]
  tags: CrmTag[]
  onCreated: () => void
}

function CreateContactDialog({
  open,
  onClose,
  staffUsers,
  tags,
  onCreated,
}: CreateContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    website: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Canada',
    status: 'lead' as ContactStatus,
    source: 'other' as ContactSource,
    assigned_to: '',
    notes: '',
    tags: [] as string[],
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) {
      toast.error('Full name is required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          assigned_to: form.assigned_to || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create')
      toast.success('Contact created')
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create contact')
    } finally {
      setLoading(false)
    }
  }

  function toggleTag(name: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(name)
        ? prev.tags.filter((t) => t !== name)
        : [...prev.tags, name],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+1 416 555 0100"
              />
            </div>
            <div>
              <Label htmlFor="company_name">Company</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={set('company_name')}
                placeholder="Acme Inc."
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={set('website')}
                placeholder="https://example.com"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={set('address')}
                placeholder="123 Main St"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={set('city')} placeholder="Markham" />
            </div>
            <div>
              <Label htmlFor="province">Province</Label>
              <Input id="province" value={form.province} onChange={set('province')} placeholder="ON" />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input id="postal_code" value={form.postal_code} onChange={set('postal_code')} placeholder="L3R 0A1" />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={set('country')} placeholder="Canada" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v as ContactStatus }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.slice(1).map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Select
                value={form.source}
                onValueChange={(v) => setForm((p) => ({ ...p, source: v as ContactSource }))}
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.slice(1).map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select
                value={form.assigned_to}
                onValueChange={(v) => setForm((p) => ({ ...p, assigned_to: v }))}
              >
                <SelectTrigger id="assigned_to">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {staffUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {tags.map((tag) => {
                  const active = form.tags.includes(tag.name)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                        active
                          ? 'border-transparent'
                          : 'border-border bg-transparent text-muted-foreground hover:border-primary/40'
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: `${tag.color ?? '#6366f1'}22`,
                              color: tag.color ?? '#6366f1',
                            }
                          : {}
                      }
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={set('notes')}
                placeholder="Any additional notes…"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// BulkAssignDialog
// ─────────────────────────────────────────────

interface BulkAssignDialogProps {
  open: boolean
  onClose: () => void
  selectedIds: string[]
  staffUsers: Pick<User, 'id' | 'full_name' | 'avatar_url'>[]
  onDone: () => void
}

function BulkAssignDialog({ open, onClose, selectedIds, staffUsers, onDone }: BulkAssignDialogProps) {
  const [assignTo, setAssignTo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch('/api/crm/contacts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, updates: { assigned_to: assignTo || null } }),
      })
      toast.success(`Assigned ${selectedIds.length} contact${selectedIds.length !== 1 ? 's' : ''}`)
      onDone()
    } catch {
      toast.error('Failed to assign contacts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign {selectedIds.length} Contact{selectedIds.length !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        <div>
          <Label>Assign to</Label>
          <Select value={assignTo} onValueChange={setAssignTo}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {staffUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// BulkStatusDialog
// ─────────────────────────────────────────────

interface BulkStatusDialogProps {
  open: boolean
  onClose: () => void
  selectedIds: string[]
  onDone: () => void
}

function BulkStatusDialog({ open, onClose, selectedIds, onDone }: BulkStatusDialogProps) {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!status) { toast.error('Select a status'); return }
    setLoading(true)
    try {
      await fetch('/api/crm/contacts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, updates: { status } }),
      })
      toast.success(`Updated ${selectedIds.length} contact${selectedIds.length !== 1 ? 's' : ''}`)
      onDone()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Status for {selectedIds.length} Contact{selectedIds.length !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        <div>
          <Label>New Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.slice(1).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating…' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
