'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  X,
  Plus,
  ExternalLink,
  UserCircle2,
  Loader2,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ActivityTimeline } from '@/components/crm/ActivityTimeline'
import { cn, getInitials, formatCurrency, formatDate } from '@/lib/utils'
import type { ContactFull } from '@/lib/crm/contact-helpers'
import type { CrmTag, User, ContactStatus, CrmPipelineWithStages } from '@/types/database'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STATUS_CYCLE: ContactStatus[] = ['lead', 'prospect', 'active', 'inactive', 'churned']

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200',
  prospect: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200',
  churned: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-200',
}

const DEAL_STATUS_COLORS: Record<string, string> = {
  open: 'border-l-blue-500',
  won: 'border-l-emerald-500',
  lost: 'border-l-red-500',
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface ContactDetailProps {
  contact: ContactFull
  staffUsers: Pick<User, 'id' | 'full_name' | 'avatar_url'>[]
  tags: CrmTag[]
  pipelines: CrmPipelineWithStages[]
  currentUserId?: string
}

// ─────────────────────────────────────────────
// ContactDetail
// ─────────────────────────────────────────────

export function ContactDetail({
  contact,
  staffUsers,
  tags,
  pipelines,
  currentUserId = '',
}: ContactDetailProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Local state for editable fields
  const [info, setInfo] = useState({
    full_name: contact.full_name,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    company_name: contact.company_name ?? '',
    website: contact.website ?? '',
    address: contact.address ?? '',
    city: contact.city ?? '',
    province: contact.province ?? '',
    postal_code: contact.postal_code ?? '',
    country: contact.country ?? 'Canada',
    notes: contact.notes ?? '',
  })
  const [status, setStatus] = useState<ContactStatus>(contact.status)
  const [assignedTo, setAssignedTo] = useState(contact.assigned_to ?? '')
  const [contactTags, setContactTags] = useState<string[]>(contact.tags ?? [])
  const [tagSearch, setTagSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)

  // ── Cycle status ─────────────────────────────

  async function cycleStatus() {
    const idx = STATUS_CYCLE.indexOf(status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setStatus(next)
    try {
      await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      toast.success(`Status → ${next}`)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to update status')
      setStatus(status)
    }
  }

  // ── Save info ────────────────────────────────

  async function saveInfo() {
    setSaving(true)
    try {
      await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      })
      toast.success('Contact saved')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to save contact')
    } finally {
      setSaving(false)
    }
  }

  // ── Assign staff ──────────────────────────────

  async function handleAssign(userId: string) {
    setAssignedTo(userId)
    try {
      await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: userId || null }),
      })
      toast.success('Assigned updated')
    } catch {
      toast.error('Failed to update assignment')
    }
  }

  // ── Tags ─────────────────────────────────────

  async function removeTag(name: string) {
    const newTags = contactTags.filter((t) => t !== name)
    setContactTags(newTags)
    try {
      await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })
    } catch {
      toast.error('Failed to remove tag')
      setContactTags(contactTags)
    }
  }

  async function addTag(name: string) {
    if (contactTags.includes(name)) return
    const newTags = [...contactTags, name]
    setContactTags(newTags)
    setTagSearch('')
    try {
      await fetch(`/api/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })
    } catch {
      toast.error('Failed to add tag')
      setContactTags(contactTags)
    }
  }

  const filteredTags = tags.filter(
    (t) =>
      !contactTags.includes(t.name) &&
      t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const assignedUser = staffUsers.find((u) => u.id === assignedTo)

  return (
    <div>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/crm/contacts')}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Contacts
        </Button>
      </div>

      <div className="flex items-start gap-4 mb-8">
        <Avatar className="w-14 h-14 shrink-0">
          <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
            {getInitials(contact.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">{contact.full_name}</h1>
          {contact.company_name && (
            <p className="text-muted-foreground mt-0.5">{contact.company_name}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <button onClick={cycleStatus}>
              <Badge
                variant="secondary"
                className={cn(
                  'cursor-pointer capitalize text-xs font-medium transition-colors',
                  STATUS_COLORS[status]
                )}
              >
                {status}
              </Badge>
            </button>
            <span className="text-xs text-muted-foreground">Click badge to cycle status</span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <ActivityTimeline
                contactId={contact.id}
                initialActivities={contact.activities as never}
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Info + Meta */}
        <div className="space-y-4">
          {/* Contact Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoField
                icon={<Mail className="w-3.5 h-3.5" />}
                label="Email"
                value={info.email}
                onChange={(v) => setInfo((p) => ({ ...p, email: v }))}
                type="email"
                placeholder="email@example.com"
              />
              <InfoField
                icon={<Phone className="w-3.5 h-3.5" />}
                label="Phone"
                value={info.phone}
                onChange={(v) => setInfo((p) => ({ ...p, phone: v }))}
                placeholder="+1 416 555 0100"
              />
              <InfoField
                icon={<Building2 className="w-3.5 h-3.5" />}
                label="Company"
                value={info.company_name}
                onChange={(v) => setInfo((p) => ({ ...p, company_name: v }))}
                placeholder="Acme Inc."
              />
              <InfoField
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Website"
                value={info.website}
                onChange={(v) => setInfo((p) => ({ ...p, website: v }))}
                placeholder="https://example.com"
              />
              <InfoField
                icon={<MapPin className="w-3.5 h-3.5" />}
                label="Address"
                value={info.address}
                onChange={(v) => setInfo((p) => ({ ...p, address: v }))}
                placeholder="123 Main St"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">City</Label>
                  <Input
                    value={info.city}
                    onChange={(e) => setInfo((p) => ({ ...p, city: e.target.value }))}
                    className="h-7 text-xs mt-0.5"
                    placeholder="Markham"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Province</Label>
                  <Input
                    value={info.province}
                    onChange={(e) => setInfo((p) => ({ ...p, province: e.target.value }))}
                    className="h-7 text-xs mt-0.5"
                    placeholder="ON"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Postal Code</Label>
                  <Input
                    value={info.postal_code}
                    onChange={(e) => setInfo((p) => ({ ...p, postal_code: e.target.value }))}
                    className="h-7 text-xs mt-0.5"
                    placeholder="L3R 0A1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <Input
                    value={info.country}
                    onChange={(e) => setInfo((p) => ({ ...p, country: e.target.value }))}
                    className="h-7 text-xs mt-0.5"
                    placeholder="Canada"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  value={info.notes}
                  onChange={(e) => setInfo((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="text-xs mt-0.5 resize-none"
                  placeholder="Internal notes…"
                />
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={saveInfo}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Assigned To */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={assignedTo} onValueChange={handleAssign}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {staffUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[9px] bg-muted">
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {u.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignedUser && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(assignedUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{assignedUser.full_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {contactTags.map((name) => {
                  const tag = tags.find((t) => t.name === name)
                  return (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: tag?.color ? `${tag.color}22` : '#6366f122',
                        color: tag?.color ?? '#6366f1',
                      }}
                    >
                      {name}
                      <button
                        onClick={() => removeTag(name)}
                        className="hover:opacity-70 transition-opacity ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )
                })}
              </div>
              <div className="relative">
                <Input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Add tag…"
                  className="h-7 text-xs pr-7"
                />
                {tagSearch && filteredTags.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md z-10 overflow-hidden">
                    {filteredTags.slice(0, 8).map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => addTag(tag.name)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors text-left"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color ?? '#6366f1' }}
                        />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Linked Account */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Client Account</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.linked_user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(contact.linked_user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{contact.linked_user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{contact.linked_user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/clients/${contact.linked_user_id}`)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-3">
                  <UserCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-xs text-muted-foreground mb-3">
                    Not linked to a client account
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setConvertOpen(true)}
                  >
                    Convert to Client
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deals */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Deals</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => router.push('/admin/crm/deals')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contact.deals.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No deals yet</p>
              ) : (
                <div className="space-y-2">
                  {contact.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className={cn(
                        'p-3 rounded-lg border-l-2 bg-muted/30',
                        DEAL_STATUS_COLORS[deal.status] ?? 'border-l-border'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-foreground truncate">
                          {deal.title}
                        </p>
                        {deal.value && (
                          <span className="text-xs font-semibold text-foreground shrink-0">
                            {formatCurrency(deal.value, deal.currency ?? 'CAD')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {deal.stage && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: deal.stage.color
                                ? `${deal.stage.color}22`
                                : '#6366f122',
                              color: deal.stage.color ?? '#6366f1',
                            }}
                          >
                            {deal.stage.name}
                          </span>
                        )}
                        {deal.expected_close_date && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(deal.expected_close_date, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Convert to Client Dialog */}
      <ConvertToClientDialog
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        contactId={contact.id}
        defaultEmail={contact.email ?? ''}
        defaultName={contact.full_name}
        onConverted={() => {
          setConvertOpen(false)
          startTransition(() => router.refresh())
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// InfoField (inline editable)
// ─────────────────────────────────────────────

interface InfoFieldProps {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}

function InfoField({ icon, label, value, onChange, type = 'text', placeholder }: InfoFieldProps) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 text-xs mt-0.5"
        placeholder={placeholder}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// ConvertToClientDialog
// ─────────────────────────────────────────────

interface ConvertToClientDialogProps {
  open: boolean
  onClose: () => void
  contactId: string
  defaultEmail: string
  defaultName: string
  onConverted: () => void
}

function ConvertToClientDialog({
  open,
  onClose,
  contactId,
  defaultEmail,
  defaultName,
  onConverted,
}: ConvertToClientDialogProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [fullName, setFullName] = useState(defaultName)
  const [sendInvite, setSendInvite] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleConvert() {
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/crm/contacts/${contactId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, sendInvite }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Failed to convert')
      }
      toast.success('Contact converted to client')
      onConverted()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Conversion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Convert to Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will create a client account and optionally send an invitation email.
          </p>
          <div>
            <Label htmlFor="convert-name">Full Name</Label>
            <Input
              id="convert-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="convert-email">Email *</Label>
            <Input
              id="convert-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="send-invite" className="cursor-pointer">
              Send invitation email
            </Label>
            <Switch
              id="send-invite"
              checked={sendInvite}
              onCheckedChange={setSendInvite}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={loading}>
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : null}
            Convert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
