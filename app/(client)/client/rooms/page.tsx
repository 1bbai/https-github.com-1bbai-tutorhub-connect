import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoomBrowser } from '@/components/client/RoomBrowser'

export default async function ClientRoomsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const now = new Date().toISOString()

  const [roomsResult, upcomingResult, pastResult, subResult] = await Promise.all([
    supabase
      .from('meeting_rooms')
      .select('*')
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('room_bookings')
      .select('*, room:meeting_rooms(id, name, capacity, credits_per_hour)')
      .eq('client_id', user.id)
      .eq('status', 'confirmed')
      .gte('start_time', now)
      .order('start_time', { ascending: true }),

    supabase
      .from('room_bookings')
      .select('*, room:meeting_rooms(id, name, capacity, credits_per_hour)')
      .eq('client_id', user.id)
      .in('status', ['completed', 'cancelled'])
      .lt('start_time', now)
      .order('start_time', { ascending: false })
      .limit(20),

    supabase
      .from('client_subscriptions')
      .select('credits_remaining')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  return (
    <RoomBrowser
      rooms={roomsResult.data ?? []}
      upcomingBookings={upcomingResult.data as any ?? []}
      pastBookings={pastResult.data as any ?? []}
      creditBalance={subResult.data?.credits_remaining ?? 0}
      clientId={user.id}
    />
  )
}
