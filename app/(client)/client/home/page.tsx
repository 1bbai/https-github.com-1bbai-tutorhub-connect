import { createClient } from '@/lib/supabase/server'
import { PortalDashboard } from '@/components/client/PortalDashboard'
import { redirect } from 'next/navigation'

export default async function ClientHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, servicesResult, bookingsResult, tasksResult] = await Promise.all([
    // Profile + subscription + plan
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single(),

    // Active services with service join
    supabase
      .from('client_services')
      .select('*, service:services(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),

    // Upcoming confirmed bookings (next 3)
    supabase
      .from('room_bookings')
      .select('*, room:meeting_rooms(id, name, capacity, credits_per_hour)')
      .eq('client_id', user.id)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(3),

    // Open tasks count
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('status', 'open'),
  ])

  // Fetch subscription + plan separately
  const { data: subscription } = await supabase
    .from('client_subscriptions')
    .select('*, plan:plans(*)')
    .eq('client_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const profile = profileResult.data
  const activeServices = servicesResult.data ?? []
  const upcomingBookings = bookingsResult.data ?? []
  const openTasksCount = tasksResult.count ?? 0

  return (
    <PortalDashboard
      profile={profile!}
      subscription={subscription}
      activeServices={activeServices as any}
      upcomingBookings={upcomingBookings as any}
      openTasksCount={openTasksCount}
    />
  )
}
