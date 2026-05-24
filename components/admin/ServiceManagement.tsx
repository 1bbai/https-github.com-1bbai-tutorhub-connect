'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Plan, Service, ServiceCategory } from '@/types/database'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface PlanWithClientCount extends Plan {
  client_count: number
}

interface ServiceManagementProps {
  plans: PlanWithClientCount[]
  services: Service[]
}

const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'virtual_office', label: 'Virtual Office' },
  { value: 'loan_assistance', label: 'Loan Assistance' },
  { value: 'business_registration', label: 'Business Registration' },
]

const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  virtual_office: 'bg-blue-100 text-blue-700 border-blue-200',
  loan_assistance: 'bg-purple-100 text-purple-700 border-purple-200',
  business_registration: 'bg-orange-100 text-orange-700 border-orange-200',
}

function formatPrice(cents: number | null): string {
  if (!cents) return '$0.00'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(cents / 100)
}

// ─────────────────────────────────────────────
// PlanDialog
// ─────────────────────────────────────────────

interface PlanDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  plan?: Plan | null
  onSaved: () => void
}

function PlanDialog({ open, onOpenChange, plan, onSaved }: PlanDialogProps) {
  const isEditing = !!plan
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: plan?.name ?? '',
    description: plan?.description ?? '',
    price_monthly: plan?.price_monthly?.toString() ?? '',
    stripe_price_id: plan?.stripe_price_id ?? '',
    meeting_room_credits_per_month: plan?.meeting_room_credits_per_month?.toString() ?? '',
    is_active: plan?.is_active ?? true,
    features: Array.isArray(plan?.features) ? (plan.features as string[]) : [],
  })
  const [newFeature, setNewFeature] = useState('')

  function addFeature() {
    if (!newFeature.trim()) return
    setForm((prev) => ({ ...prev, features: [...prev.features, newFeature.trim()] }))
    setNewFeature('')
  }

  function removeFeature(i: number) {
    setForm((prev) => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Plan name is required'); return }
    if (!form.price_monthly) { toast.error('Price is required'); return }
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price_monthly: parseFloat(form.price_monthly),
        stripe_price_id: form.stripe_price_id || null,
        meeting_room_credits_per_month: form.meeting_room_credits_per_month
          ? parseInt(form.meeting_room_credits_per_month)
          : null,
        is_active: form.is_active,
        features: form.features,
      }
      const method = isEditing ? 'PATCH' : 'POST'
      const url = isEditing ? `/api/admin/plans/${plan!.id}` : '/api/admin/plans'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      toast.success(isEditing ? 'Plan updated' : 'Plan created')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Plan Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Professional"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Plan description..."
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <Label>Price / Month (CAD) *</Label>
              <Input
                type="number"
                value={form.price_monthly}
                onChange={(e) => setForm((p) => ({ ...p, price_monthly: e.target.value }))}
                placeholder="99.00"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Room Credits / Month</Label>
              <Input
                type="number"
                value={form.meeting_room_credits_per_month}
                onChange={(e) =>
                  setForm((p) => ({ ...p, meeting_room_credits_per_month: e.target.value }))
                }
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Stripe Price ID</Label>
              <Input
                value={form.stripe_price_id}
                onChange={(e) => setForm((p) => ({ ...p, stripe_price_id: e.target.value }))}
                placeholder="price_..."
                className="mt-1 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <Label>Features</Label>
            <div className="mt-1.5 space-y-1.5">
              {form.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-foreground bg-muted/50 rounded px-2.5 py-1.5">
                    {feature}
                  </span>
                  <button
                    onClick={() => removeFeature(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add feature..."
                  className="text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is-active"
              checked={form.is_active}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
            <Label htmlFor="is-active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Plan' : 'Create Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// ServiceDialog
// ─────────────────────────────────────────────

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  service?: Service | null
  onSaved: () => void
}

function ServiceDialog({ open, onOpenChange, service, onSaved }: ServiceDialogProps) {
  const isEditing = !!service
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: service?.name ?? '',
    category: service?.category ?? ('virtual_office' as ServiceCategory),
    description: service?.description ?? '',
    price_cents: service?.price_cents ? (service.price_cents / 100).toString() : '',
    is_active: service?.is_active ?? true,
  })

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Service name is required'); return }
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        category: form.category,
        description: form.description || null,
        price_cents: form.price_cents ? Math.round(parseFloat(form.price_cents) * 100) : null,
        is_active: form.is_active,
      }
      const method = isEditing ? 'PATCH' : 'POST'
      const url = isEditing ? `/api/admin/services/${service!.id}` : '/api/admin/services'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      toast.success(isEditing ? 'Service updated' : 'Service created')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Service' : 'Add Service'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Service Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Business Registration"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Category *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((p) => ({ ...p, category: v as ServiceCategory }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="mt-1 resize-none"
              placeholder="Service description..."
            />
          </div>
          <div>
            <Label>Price (CAD)</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                value={form.price_cents}
                onChange={(e) => setForm((p) => ({ ...p, price_cents: e.target.value }))}
                placeholder="0.00"
                className="pl-6"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="svc-active"
              checked={form.is_active}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
            <Label htmlFor="svc-active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Service' : 'Create Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────
// ServiceManagement (main export)
// ─────────────────────────────────────────────

export function ServiceManagement({ plans: initialPlans, services: initialServices }: ServiceManagementProps) {
  const [plans, setPlans] = useState<PlanWithClientCount[]>(initialPlans)
  const [services, setServices] = useState<Service[]>(initialServices)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  async function refreshPlans() {
    try {
      const res = await fetch('/api/admin/plans')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans ?? data ?? [])
      }
    } catch {
      // ignore
    }
  }

  async function refreshServices() {
    try {
      const res = await fetch('/api/admin/services')
      if (res.ok) {
        const data = await res.json()
        setServices(data.services ?? data ?? [])
      }
    } catch {
      // ignore
    }
  }

  async function togglePlanActive(plan: PlanWithClientCount) {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !plan.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: !p.is_active } : p))
      )
      toast.success(plan.is_active ? 'Plan deactivated' : 'Plan activated')
    } catch {
      toast.error('Failed to update plan')
    }
  }

  async function toggleServiceActive(service: Service) {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !service.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, is_active: !s.is_active } : s))
      )
      toast.success(service.is_active ? 'Service deactivated' : 'Service activated')
    } catch {
      toast.error('Failed to update service')
    }
  }

  async function deleteService(service: Service) {
    if (!confirm(`Delete "${service.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setServices((prev) => prev.filter((s) => s.id !== service.id))
      toast.success('Service deleted')
    } catch {
      toast.error('Failed to delete service')
    }
  }

  return (
    <div>
      <PageHeader
        title="Services & Plans"
        description="Manage your service offerings and subscription plans"
      />

      <Tabs defaultValue="plans">
        <TabsList className="mb-6">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              onClick={() => { setEditingPlan(null); setPlanDialogOpen(true) }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Plan
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      {plan.description && (
                        <CardDescription className="mt-0.5 text-xs line-clamp-2">
                          {plan.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        plan.is_active
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]'
                          : 'bg-muted text-muted-foreground text-[10px]'
                      }
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-foreground">
                    ${plan.price_monthly.toFixed(0)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">
                        {plan.meeting_room_credits_per_month ?? 0}
                      </span>{' '}
                      credits/mo
                    </div>
                    <div>
                      <span className="font-medium text-foreground">
                        {Array.isArray(plan.features) ? plan.features.length : 0}
                      </span>{' '}
                      features
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{plan.client_count}</span>{' '}
                    active client{plan.client_count !== 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => { setEditingPlan(plan); setPlanDialogOpen(true) }}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => togglePlanActive(plan)}
                    >
                      {plan.is_active ? (
                        <ToggleRight className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                      )}
                      {plan.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No plans yet. Create your first plan.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              onClick={() => { setEditingService(null); setServiceDialogOpen(true) }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Service
            </Button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${CATEGORY_COLORS[service.category]}`}
                      >
                        {SERVICE_CATEGORIES.find((c) => c.value === service.category)?.label ?? service.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(service.price_cents)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={service.is_active ?? false}
                        onCheckedChange={() => toggleServiceActive(service)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => { setEditingService(service); setServiceDialogOpen(true) }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteService(service)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No services yet. Add your first service.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        plan={editingPlan}
        onSaved={refreshPlans}
      />
      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={editingService}
        onSaved={refreshServices}
      />
    </div>
  )
}
