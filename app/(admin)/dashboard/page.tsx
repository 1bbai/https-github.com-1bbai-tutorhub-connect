import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import type { AdminStats, TaskGroups } from '@/components/admin/AdminDashboard'
import type { RoomBookingWithDetails } from '@/types/database'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Parallel fetches
  const [
    { count: activeClientCount },
    { data: tasks },
    { data: upcomingBookingsRaw },
    { data: openDeals },
    { data: newLeads },
    { data: monthlyInvoices },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .eq('is_active', true),

    supabase
      .from('tasks')
      .select('id, priority, status')
      .not('status', 'eq', 'cancelled'),

    supabase
      .from('room_bookings')
      .select(`
        id, start_time, end_time, status, credits_used, duration_hours, notes, cancelled_at, created_at,
        client_id,
        room_id,
        room:meeting_rooms(id, name, capacity, credits_per_hour),
        client:users(id, full_name, email, company_name)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', now.toISOString())
      .lte('start_time', sevenDaysLater.toISOString())
      .order('start_time', { ascending: true })
      .limit(20),

    supabase
      .from('crm_deals')
      .select('value')
      .eq('status', 'open'),

    supabase
      .from('crm_contacts')
      .select('id', { count: 'exact' })
      .eq('status', 'lead')
      .gte('created_at', sevenDaysAgo.toISOString()),

    supabase
      .from('invoices')
      .select('amount_cents')
      .eq('status', 'paid')
      .gte('created_at', startOfMonth.toISOString()),
  ])

  // Compute stats
  const openTasks = tasks?.filter((t) => t.status !== 'completed').length ?? 0
  const pipelineValue =
    openDeals?.reduce((sum, d) => sum + (d.value ?? 0), 0) ?? 0
  const monthlyRevenue =
    (monthlyInvoices?.reduce((sum, i) => sum + i.amount_cents, 0) ?? 0) / 100

  const tasksByPriority: TaskGroups = {
    urgent:
      tasks?.filter((t) => t.priority === 'urgent' && t.status !== 'completed')
        .length ?? 0,
    high:
      tasks?.filter((t) => t.priority === 'high' && t.status !== 'completed')
        .length ?? 0,
    medium:
      tasks?.filter(
        (t) => t.priority === 'medium' && t.status !== 'completed'
      ).length ?? 0,
    low:
      tasks?.filter((t) => t.priority === 'low' && t.status !== 'completed')
        .length ?? 0,
  }

  const stats: AdminStats = {
    activeClients: activeClientCount ?? 0,
    openTasks,
    upcomingBookings: upcomingBookingsRaw?.length ?? 0,
    monthlyRevenue,
    pipelineValue,
    newLeadsThisWeek: newLeads?.length ?? 0,
  }

  return (
    <AdminDashboard
      stats={stats}
      upcomingBookings={(upcomingBookingsRaw ?? []) as unknown as RoomBookingWithDetails[]}
      tasksByPriority={tasksByPriority}
    />
  )
}
