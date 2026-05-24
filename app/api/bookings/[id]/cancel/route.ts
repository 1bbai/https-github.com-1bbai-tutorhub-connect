import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { creditCredits } from '@/lib/credits/credit-engine'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = params.id
    const admin = createAdminClient()

    // Fetch the booking to verify ownership and status
    const { data: booking, error: fetchError } = await admin
      .from('room_bookings')
      .select('*, room:meeting_rooms(id, name)')
      .eq('id', bookingId)
      .maybeSingle()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check authorization: only the booking owner or an admin can cancel
    const { data: profile } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = booking.client_id === user.id
    const isAdmin = profile?.role === 'admin' || profile?.role === 'staff'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    // Cancel the booking
    const { error: cancelError } = await admin
      .from('room_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (cancelError) {
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    // Refund credits
    await creditCredits({
      clientId: booking.client_id,
      amount: booking.credits_used,
      reason: `Refund for cancelled booking: ${(booking as any).room?.name ?? 'meeting room'}`,
      bookingId,
    })

    // Create notification
    await admin.from('notifications').insert({
      user_id: booking.client_id,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for ${(booking as any).room?.name ?? 'a meeting room'} has been cancelled and ${booking.credits_used} credit${booking.credits_used !== 1 ? 's' : ''} have been refunded.`,
      action_url: '/rooms',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('POST /api/bookings/[id]/cancel error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
