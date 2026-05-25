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

  if (!sub) {
    return { success: false, newBalance: 0, error: 'Client has no active subscription.' }
  }

  const current = sub.credits_remaining ?? 0

  if (current < params.amount) {
    return {
      success: false,
      newBalance: current,
      error: `Insufficient meeting room credits. Available: ${current}, Required: ${params.amount}`,
    }
  }

  const newBalance = current - params.amount

  // 2. Decrement credits_remaining (use id for precision)
  const { error: updateError } = await supabase
    .from('client_subscriptions')
    .update({ credits_remaining: newBalance, updated_at: new Date().toISOString() })
    .eq('id', sub.id)

  if (updateError) {
    return { success: false, newBalance: current, error: updateError.message }
  }

  // 3. Insert credit_ledger row (no performed_by — added as a non-fatal follow-up)
  const { data: ledgerRow, error: ledgerError } = await supabase
    .from('credit_ledger')
    .insert({
      client_id: params.clientId,
      booking_id: params.bookingId ?? null,
      type: 'debit',
      amount: params.amount,
      reason: params.reason,
      balance_after: newBalance,
    })
    .select('id')
    .single()

  if (ledgerError) {
    // Roll back the subscription update to keep state consistent
    await supabase
      .from('client_subscriptions')
      .update({ credits_remaining: current })
      .eq('id', sub.id)
    return { success: false, newBalance: current, error: `Failed to record ledger entry: ${ledgerError.message}` }
  }

  // 4. Set performed_by if provided — requires migration 003, non-fatal if not yet applied
  if (params.performedBy && ledgerRow) {
    const { error: auditErr } = await supabase
      .from('credit_ledger')
      .update({ performed_by: params.performedBy })
      .eq('id', ledgerRow.id)
    if (auditErr) {
      console.warn('[debitCredits] performed_by update skipped (run migration 003):', auditErr.message)
    }
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
}): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const supabase = createAdminClient()

  // 1. Get active subscription
  const { data: sub, error: fetchError } = await supabase
    .from('client_subscriptions')
    .select('id, credits_remaining')
    .eq('client_id', params.clientId)
    .eq('status', 'active')
    .maybeSingle()

  if (fetchError) {
    return { success: false, newBalance: 0, error: `Failed to fetch subscription: ${fetchError.message}` }
  }

  if (!sub) {
    return { success: false, newBalance: 0, error: 'Client has no active subscription. Assign a plan before adding credits.' }
  }

  const current = sub.credits_remaining ?? 0
  const newBalance = current + params.amount

  // 2. Increment credits_remaining (use id for precision)
  const { error: updateError } = await supabase
    .from('client_subscriptions')
    .update({ credits_remaining: newBalance, updated_at: new Date().toISOString() })
    .eq('id', sub.id)

  if (updateError) {
    return { success: false, newBalance: current, error: `Failed to increment credits: ${updateError.message}` }
  }

  // 3. Insert credit_ledger row (no performed_by — added as a non-fatal follow-up)
  const { data: ledgerRow, error: ledgerError } = await supabase
    .from('credit_ledger')
    .insert({
      client_id: params.clientId,
      booking_id: params.bookingId ?? null,
      type: 'credit',
      amount: params.amount,
      reason: params.reason,
      balance_after: newBalance,
    })
    .select('id')
    .single()

  if (ledgerError) {
    // Roll back the subscription update to keep state consistent
    await supabase
      .from('client_subscriptions')
      .update({ credits_remaining: current })
      .eq('id', sub.id)
    return { success: false, newBalance: current, error: `Failed to record ledger entry: ${ledgerError.message}` }
  }

  // 4. Set performed_by if provided — requires migration 003, non-fatal if not yet applied
  if (params.performedBy && ledgerRow) {
    const { error: auditErr } = await supabase
      .from('credit_ledger')
      .update({ performed_by: params.performedBy })
      .eq('id', ledgerRow.id)
    if (auditErr) {
      console.warn('[creditCredits] performed_by update skipped (run migration 003):', auditErr.message)
    }
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
