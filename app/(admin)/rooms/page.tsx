import { createClient } from '@/lib/supabase/server'
import { RoomManagement } from '@/components/admin/RoomManagement'
import type { MeetingRoom, RoomBookingWithDetails } from '@/types/database'

export const metadata = { title: 'Room Management' }

export default async function RoomsPage() {
  const supabase = await createClient()

  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    supabase
      .from('meeting_rooms')
      .select('*')
      .order('created_at', { ascending: true }),

    supabase
      .from('room_bookings')
      .select(`
        id, client_id, room_id, start_time, end_time, duration_hours,
        credits_used, status, notes, cancelled_at, created_at,
        room:meeting_rooms(id, name, capacity, credits_per_hour),
        client:users(id, full_name, email, company_name)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', now.toISOString())
      .lte('start_time', thirtyDaysLater.toISOString())
      .order('start_time', { ascending: true }),
  ])

  return (
    <RoomManagement
      rooms={(rooms ?? []) as MeetingRoom[]}
      bookings={(bookings ?? []) as unknown as RoomBookingWithDetails[]}
    />
  )
}
