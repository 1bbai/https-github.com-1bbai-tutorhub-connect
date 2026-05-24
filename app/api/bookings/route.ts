import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { debitCredits, getCreditHistory } from '@/lib/credits/credit-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, startTime, endTime, durationHours, creditsUsed, notes } = body

    if (!roomId || !startTime || !endTime || !durationHours || creditsUsed === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check availability — no overlapping confirmed bookings for this room
    const { data: precise, error: preciseErr } = await admin
      .from('room_bookings')
      .select('id')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .lt('start_time', endTime)
      .gt('end_time', startTime)

    if (preciseErr) {
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
    }

    if (precise && precise.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose a different time.' },
        { status: 409 }
      )
    }

    // Debit credits
    const debitResult = await debitCredits({
      clientId: user.id,
      amount: creditsUsed,
      reason: `Room booking: ${durationHours}h in room ${roomId}`,
    })

    if (!debitResult.success) {
      return NextResponse.json({ error: debitResult.error ?? 'Insufficient credits' }, { status: 402 })
    }

    // Create the booking
    const { data: booking, error: bookingError } = await admin
      .from('room_bookings')
      .insert({
        client_id: user.id,
        room_id: roomId,
        start_time: startTime,
        end_time: endTime,
        duration_hours: durationHours,
        credits_used: creditsUsed,
        status: 'confirmed',
        notes: notes ?? null,
      })
      .select('*, room:meeting_rooms(id, name)')
      .single()

    if (bookingError) {
      // Attempt to refund credits
      await admin
        .from('client_subscriptions')
        .update({ credits_remaining: debitResult.newBalance + creditsUsed })
        .eq('client_id', user.id)

      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    // Update the ledger with the booking_id
    await admin
      .from('credit_ledger')
      .update({ booking_id: booking.id })
      .eq('client_id', user.id)
      .is('booking_id', null)
      .order('created_at', { ascending: false })
      .limit(1)

    // Create notification
    await admin.from('notifications').insert({
      user_id: user.id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `Your booking for ${(booking as any).room?.name ?? 'a meeting room'} has been confirmed.`,
      action_url: '/rooms',
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('POST /api/bookings error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

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

    const admin = createAdminClient()

    // Get user profile to check role
    const { data: profile } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const clientIdFilter = searchParams.get('clientId')
    const includeCredits = searchParams.get('includeCredits') === 'true'

    // Credit history requested separately
    if (includeCredits) {
      const creditHistory = await getCreditHistory(user.id)
      return NextResponse.json({ creditHistory })
    }

    let query = admin
      .from('room_bookings')
      .select('*, room:meeting_rooms(id, name, capacity, credits_per_hour)')
      .order('start_time', { ascending: false })

    // Clients can only see their own bookings
    if (profile?.role === 'client') {
      query = query.eq('client_id', user.id)
    } else if (clientIdFilter) {
      query = query.eq('client_id', clientIdFilter)
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: bookings, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookings })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
