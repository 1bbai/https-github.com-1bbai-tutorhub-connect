import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// getCreditBalance
// ---------------------------------------------------------------------------
export async function getCreditBalance(clientId: string): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('client_subscriptions')
    .select('credits_remaining')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch credit balance: ${error.message}`)
  }

  return data?.credits_remaining ?? 0
}

// ---------------------------------------------------------------------------
// debitCredits
// ---------------------------------------------------------------------------
export async function debitCredits(params: {
  clientId: string
  amount: number
  reason: string
  bookingId?: string
  performedBy?: string
}): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const supabase = createAdminClient()

  // 1. Check current balance
  const { data: sub, error: fetchError } = await supabase
    .from('client_subscriptions')
    .select('id, credits_remaining')
    .eq('client_id', params.clientId)
    .eq('status', 'active')
    .maybeSingle()

  if (fetchError) {
    return { success: false, newBalance: 0, error: fetchError.message }
  }

  const current = sub?.credits_remaining ?? 0

  // 2. Check for insufficient balance
  if (current < params.amount) {
    return {
      success: false,
      newBalance: current,
      error: `Insufficient credits. Available: ${current}, Required: ${params.amount}`,
    }
  }

  const newBalance = current - params.amount

  // 3. Decrement credits_remaining
  const { error: updateError } = await supabase
    .from('client_subscriptions')
    .update({
      credits_remaining: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('client_id', params.clientId)
    .eq('status', 'active')

  if (updateError) {
    return { success: false, newBalance: current, error: updateError.message }
  }

  // 4. Insert credit_ledger row
  const { error: ledgerError } = await supabase.from('credit_ledger').insert({
    client_id: params.clientId,
    booking_id: params.bookingId ?? null,
    type: 'debit',
    amount: params.amount,
    reason: params.reason,
    balance_after: newBalance,
    performed_by: params.performedBy ?? null,
  })

  if (ledgerError) {
    console.error('credit_ledger insert failed (debit):', ledgerError.message)
  }

  // 5. Low balance notification (< 2 credits)
  if (newBalance < 2) {
    await supabase.from('notifications').insert({
      user_id: params.clientId,
      type: 'low_credits',
      title: 'Low Meeting Room Credits',
      message: `You have ${newBalance} meeting room credit${newBalance === 1 ? '' : 's'} remaining. Consider upgrading your plan for more credits.`,
      action_url: '/client/plan',
    })
  }

  return { success: true, newBalance }
}

// ---------------------------------------------------------------------------
// creditCredits
// ---------------------------------------------------------------------------
export async function creditCredits(params: {
  clientId: string
  amount: number
  reason: string
  bookingId?: string
  performedBy?: string
}): Promise<{ success: boolean; newBalance: number }> {
  const supabase = createAdminClient()

  // 1. Get current balance and increment
  const { data: sub, error: fetchError } = await supabase
    .from('client_subscriptions')
    .select('credits_remaining')
    .eq('client_id', params.clientId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch subscription: ${fetchError.message}`)
  }

  const current = sub?.credits_remaining ?? 0
  const newBalance = current + params.amount

  const { error: updateError } = await supabase
    .from('client_subscriptions')
    .update({
      credits_remaining: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('client_id', params.clientId)

  if (updateError) {
    throw new Error(`Failed to increment credits: ${updateError.message}`)
  }

  // 2. Insert credit_ledger row
  const { error: ledgerError } = await supabase.from('credit_ledger').insert({
    client_id: params.clientId,
    booking_id: params.bookingId ?? null,
    type: 'credit',
    amount: params.amount,
    reason: params.reason,
    balance_after: newBalance,
    performed_by: params.performedBy ?? null,
  })

  if (ledgerError) {
    console.error('credit_ledger insert failed (credit):', ledgerError.message)
  }

  return { success: true, newBalance }
}

// ---------------------------------------------------------------------------
// getCreditHistory
// ---------------------------------------------------------------------------
export async function getCreditHistory(clientId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('credit_ledger')
    .select(
      `
      id,
      type,
      amount,
      reason,
      balance_after,
      created_at,
      booking_id,
      room_bookings (
        id,
        start_time,
        end_time,
        duration_hours,
        credits_used,
        status,
        meeting_rooms (
          id,
          name
        )
      )
    `,
    )
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch credit history: ${error.message}`)
  }

  return data ?? []
}
