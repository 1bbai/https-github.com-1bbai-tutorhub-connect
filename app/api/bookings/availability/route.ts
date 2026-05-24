import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const date = searchParams.get('date') // format: YYYY-MM-DD

    if (!roomId || !date) {
      return NextResponse.json({ error: 'roomId and date are required' }, { status: 400 })
    }

    // Build date range for the given day
    const dayStart = `${date}T00:00:00.000Z`
    const dayEnd = `${date}T23:59:59.999Z`

    const admin = createAdminClient()
    const { data: bookings, error } = await admin
      .from('room_bookings')
      .select('start_time, end_time')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const bookedSlots = (bookings ?? []).map((b) => ({
      start: b.start_time,
      end: b.end_time,
    }))

    return NextResponse.json({ bookedSlots })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
