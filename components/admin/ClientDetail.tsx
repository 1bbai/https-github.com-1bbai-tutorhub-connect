'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  MessageSquare,
  ShieldOff,
  ExternalLink,
  FileText,
  Download,
  Plus,
  Minus,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import type {
  User,
  ClientSubscription,
  Plan,
  ClientService,
  Service,
  RoomBooking,
  MeetingRoom,
  Invoice,
  Task,
  CrmContact,
  CreditLedgerEntry,
  ClientServiceStatus,
  BookingStatus,
  InvoiceStatus,
  TaskPriority,
  TaskStatus,
} from '@/types/database'
import { cn } from '@/lib/utils'

type SubscriptionWithPlan = ClientSubscription & { plan: Plan }
type ServiceWithDetails = ClientService & { service: Service }
type BookingWithRoom = RoomBooking & {
  room: Pick<MeetingRoom, 'id' | 'name' | 'capacity' | 'credits_per_hour'>
}

interface ClientDetailProps {
  client: User
  subscription: SubscriptionWithPlan | null
  clientServices: ServiceWithDetails[]
  bookings: BookingWithRoom[]
  invoices: Invoice[]
  tasks: Task[]
  crmContact: Pick<
    CrmContact,
    'id' | 'full_name' | 'email' | 'phone' | 'status' | 'company_name'
  > | null
  creditHistory: (CreditLedgerEntry & { performer: { full_name: string } | null })[]
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  expired: 'bg-muted text-muted-foreground border-border',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-muted text-muted-foreground border-border',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  open: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  void: 'bg-muted text-muted-foreground border-border',
  uncollectible: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  awaiting_client: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export function ClientDetail({
  client,
  subscription,
  clientServices,
  bookings,
  invoices,
  tasks,
  crmContact,
  creditHistory,
}: ClientDetailProps) {
  const router = useRouter()
  const supabase = createClient()

  // Edit state
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: client.full_name,
    email: client.email,
    phone: client.phone ?? '',
    company_name: client.company_name ?? '',
  })
  const [saving, setSaving] = useState(false)

  // Credits
  const [creditAmount, setCreditAmount] = useState('')
  const [creditReason, setCreditReason] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)

  // Suspend dialog
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [suspending, setSuspending] = useState(false)

  const initials = client.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name,
          phone: form.phone || null,
          company_name: form.company_name || null,
        })
        .eq('id', client.id)

      if (error) throw error
      toast.success('Profile updated')
      setEditing(false)
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreditAdjust(type: 'credit' | 'debit') {
    const amount = parseInt(creditAmount, 10)
    if (!amount || amount <= 0 || !creditReason.trim()) {
      toast.error('Enter a valid amount and reason')
      return
    }
    setCreditLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type, reason: creditReason.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to adjust credits')
        return
      }
      toast.success(`${type === 'credit' ? 'Added' : 'Deducted'} ${amount} credit${amount !== 1 ? 's' : ''}`)
      setCreditAmount('')
      setCreditReason('')
      router.refresh()
    } catch {
      toast.error('Failed to adjust credits')
    } finally {
      setCreditLoading(false)
    }
  }

  async function handleSuspend() {
    setSuspending(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', client.id)
      if (error) throw error
      toast.success('Account suspended')
      setSuspendOpen(false)
      router.push('/admin/clients')
    } catch {
      toast.error('Failed to suspend account')
    } finally {
      setSuspending(false)
    }
  }

  const upcomingBookings = bookings.filter(
    (b) =>
      b.status === 'confirmed' && new Date(b.start_time) > new Date()
  )
  const pastBookings = bookings.filter(
    (b) =>
      b.status !== 'confirmed' || new Date(b.start_time) <= new Date()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/clients')}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Clients
        </Button>
      </div>

      <PageHeader
        title={client.full_name}
        description={client.email}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Send Message
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setSuspendOpen(true)}
              disabled={!client.is_active}
            >
              <ShieldOff className="w-4 h-4" />
              {client.is_active ? 'Suspend Account' : 'Suspended'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Profile card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Profile</CardTitle>
                {editing ? (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditing(false)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditing(true)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={client.avatar_url ?? undefined} />
                  <AvatarFallback className="text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Badge
                    variant="outline"
                    className={
                      client.is_active
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {client.is_active ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, full_name: e.target.value }))
                      }
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company</Label>
                    <Input
                      value={form.company_name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          company_name: e.target.value,
                        }))
                      }
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                </div>
              ) : (
                <dl className="space-y-2">
                  {[
                    ['Email', client.email],
                    ['Phone', client.phone ?? '—'],
                    ['Company', client.company_name ?? '—'],
                    [
                      'Joined',
                      format(new Date(client.created_at), 'MMM d, yyyy'),
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium text-foreground mt-0.5">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Plan card */}
          {subscription && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {subscription.plan.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      STATUS_BADGE[subscription.status] ??
                      'text-muted-foreground'
                    }
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    ${subscription.plan.price_monthly}/mo
                  </p>
                  {subscription.current_period_end && (
                    <p>
                      Renews{' '}
                      {format(
                        new Date(subscription.current_period_end),
                        'MMM d, yyyy'
                      )}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Change Plan
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Credits card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {subscription?.credits_remaining ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  credits remaining
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs">Adjust Credits</Label>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="h-8 text-sm"
                  min="0"
                />
                <Input
                  placeholder="Reason"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="h-8 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => handleCreditAdjust('credit')}
                    disabled={creditLoading}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleCreditAdjust('debit')}
                    disabled={creditLoading}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    Deduct
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CRM Contact */}
          {crmContact && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">
                  CRM Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{crmContact.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {crmContact.email}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs capitalize',
                      STATUS_BADGE[crmContact.status] ?? ''
                    )}
                  >
                    {crmContact.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 mt-2"
                    onClick={() =>
                      router.push(`/admin/crm/contacts/${crmContact.id}`)
                    }
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View in CRM
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right columns: tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="services">
            <TabsList className="mb-4">
              <TabsTrigger value="services">
                Services ({clientServices.length})
              </TabsTrigger>
              <TabsTrigger value="bookings">
                Bookings ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="invoices">
                Invoices ({invoices.length})
              </TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="credits">
                Credits ({creditHistory.length})
              </TabsTrigger>
            </TabsList>

            {/* Services tab */}
            <TabsContent value="services">
              <Card>
                <CardContent className="p-0">
                  {clientServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No services assigned
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expires</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientServices.map((cs) => (
                          <TableRow key={cs.id}>
                            <TableCell className="font-medium text-sm">
                              {cs.service.name}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground capitalize">
                              {cs.service.category.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs capitalize',
                                  STATUS_BADGE[cs.status] ?? ''
                                )}
                              >
                                {cs.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {cs.expiry_date
                                ? format(
                                    new Date(cs.expiry_date),
                                    'MMM d, yyyy'
                                  )
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings tab */}
            <TabsContent value="bookings">
              <div className="space-y-4">
                {upcomingBookings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Upcoming
                    </p>
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Room</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Credits</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {upcomingBookings.map((b) => (
                              <TableRow key={b.id}>
                                <TableCell className="text-sm font-medium">
                                  {b.room.name}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(b.start_time),
                                    'MMM d, h:mm a'
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {b.duration_hours}h
                                </TableCell>
                                <TableCell className="text-sm">
                                  {b.credits_used}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      STATUS_BADGE[b.status] ?? ''
                                    )}
                                  >
                                    {b.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {pastBookings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Past
                    </p>
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Room</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Duration</TableHead>
                              <TableHead>Credits</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pastBookings.map((b) => (
                              <TableRow key={b.id}>
                                <TableCell className="text-sm font-medium">
                                  {b.room.name}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(b.start_time),
                                    'MMM d, h:mm a'
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {b.duration_hours}h
                                </TableCell>
                                <TableCell className="text-sm">
                                  {b.credits_used}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      STATUS_BADGE[b.status] ?? ''
                                    )}
                                  >
                                    {b.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {bookings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No bookings yet
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Invoices tab */}
            <TabsContent value="invoices">
              <Card>
                <CardContent className="p-0">
                  {invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No invoices yet
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(inv.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-sm">
                              {inv.description ?? '—'}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-right">
                              ${(inv.amount_cents / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs capitalize',
                                  STATUS_BADGE[inv.status] ?? ''
                                )}
                              >
                                {inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {inv.invoice_pdf_url && (
                                <a
                                  href={inv.invoice_pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks tab */}
            <TabsContent value="tasks">
              <Card>
                <CardContent className="p-0">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks for this client
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="text-sm font-medium">
                              {task.title}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs capitalize',
                                  PRIORITY_BADGE[task.priority]
                                )}
                              >
                                {task.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs capitalize',
                                  STATUS_BADGE[task.status] ?? ''
                                )}
                              >
                                {task.status.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {task.due_date
                                ? format(
                                    new Date(task.due_date),
                                    'MMM d, yyyy'
                                  )
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Credits tab */}
            <TabsContent value="credits">
              <Card>
                <CardContent className="p-0">
                  {creditHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No credit history yet
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Balance After</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Performed By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditHistory.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs capitalize',
                                  entry.type === 'credit'
                                    ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                                    : 'text-red-600 border-red-200 bg-red-50'
                                )}
                              >
                                {entry.type === 'credit' ? '+' : '−'}{entry.amount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {entry.amount}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.balance_after}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {entry.reason}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.performer?.full_name ?? (entry.booking_id ? 'System (booking)' : 'System')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Suspend confirm dialog */}
      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend Account"
        description={`Are you sure you want to suspend ${client.full_name}'s account? They will lose access immediately.`}
        confirmLabel="Suspend Account"
        variant="destructive"
        onConfirm={handleSuspend}
        loading={suspending}
      />
    </div>
  )
}
