import { createClient } from '@/lib/supabase/server'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ReportsCharts } from '@/components/admin/ReportsCharts'
import { PageHeader } from '@/components/shared/PageHeader'
import type {
  MonthlyRevenue,
  ClientsByPlan,
  RoomBookingsByMonth,
  TaskCompletionByCategory,
  CrmFunnelEntry,
} from '@/components/admin/ReportsCharts'

function formatMonth(date: Date): string {
  return format(date, 'MMM yy')
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const now = new Date()

  // Build last-12-months array
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i)
    return {
      label: formatMonth(d),
      start: startOfMonth(d).toISOString(),
      end: endOfMonth(d).toISOString(),
    }
  })

  // 1. Monthly Revenue (paid invoices)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('amount_cents, created_at')
    .eq('status', 'paid')
    .gte('created_at', months[0].start)

  const monthlyRevenue: MonthlyRevenue[] = months.map(({ label, start, end }) => {
    const total = (invoices ?? [])
      .filter((inv) => inv.created_at >= start && inv.created_at <= end)
      .reduce((sum, inv) => sum + (inv.amount_cents ?? 0), 0)
    return { month: label, revenue: Math.round(total / 100) }
  })

  // 2. Clients by Plan
  const { data: plans } = await supabase.from('plans').select('id, name')
  const { data: activeSubs } = await supabase
    .from('client_subscriptions')
    .select('plan_id')
    .eq('status', 'active')

  const planCountMap: Record<string, number> = {}
  for (const sub of activeSubs ?? []) {
    planCountMap[sub.plan_id] = (planCountMap[sub.plan_id] ?? 0) + 1
  }
  const clientsByPlan: ClientsByPlan[] = (plans ?? [])
    .map((plan) => ({ plan: plan.name, count: planCountMap[plan.id] ?? 0 }))
    .filter((p) => p.count > 0)

  // 3. Room Bookings per Month
  const { data: bookings } = await supabase
    .from('room_bookings')
    .select('created_at')
    .neq('status', 'cancelled')
    .gte('created_at', months[0].start)

  const roomBookingsByMonth: RoomBookingsByMonth[] = months.map(({ label, start, end }) => {
    const count = (bookings ?? []).filter(
      (b) => b.created_at >= start && b.created_at <= end
    ).length
    return { month: label, bookings: count }
  })

  // 4. Task Completion by Category
  const { data: tasks } = await supabase
    .from('tasks')
    .select('service_category, status')
    .neq('status', 'cancelled')

  const categoryMap: Record<string, { completed: number; total: number }> = {}
  const CATEGORY_LABELS: Record<string, string> = {
    virtual_office: 'Virtual Office',
    loan_assistance: 'Loan Assistance',
    business_registration: 'Bus. Reg.',
    room: 'Room',
    general: 'General',
  }

  for (const task of tasks ?? []) {
    const cat = task.service_category ?? 'general'
    if (!categoryMap[cat]) categoryMap[cat] = { completed: 0, total: 0 }
    categoryMap[cat].total++
    if (task.status === 'completed') categoryMap[cat].completed++
  }

  const taskCompletion: TaskCompletionByCategory[] = Object.entries(categoryMap).map(
    ([cat, counts]) => ({
      category: CATEGORY_LABELS[cat] ?? cat,
      ...counts,
    })
  )

  // 5. CRM Funnel
  const STATUS_ORDER = ['lead', 'prospect', 'active', 'inactive', 'churned']
  const { data: contacts } = await supabase
    .from('crm_contacts')
    .select('status')

  const statusMap: Record<string, number> = {}
  for (const contact of contacts ?? []) {
    statusMap[contact.status] = (statusMap[contact.status] ?? 0) + 1
  }

  const crmFunnel: CrmFunnelEntry[] = STATUS_ORDER.map((status) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count: statusMap[status] ?? 0,
  })).filter((e) => e.count > 0)

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Business analytics and performance metrics"
      />
      <ReportsCharts
        monthlyRevenue={monthlyRevenue}
        clientsByPlan={clientsByPlan}
        roomBookingsByMonth={roomBookingsByMonth}
        taskCompletion={taskCompletion}
        crmFunnel={crmFunnel}
      />
    </div>
  )
}
