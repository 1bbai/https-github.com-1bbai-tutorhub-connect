import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateSubscription, cancelSubscription } from '@/lib/stripe/subscriptions'

// PATCH /api/billing/subscription — Change plan
export async function PATCH(request: NextRequest) {
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
    const { planId } = body

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch current subscription
    const { data: sub } = await admin
      .from('client_subscriptions')
      .select('id, stripe_subscription_id, stripe_customer_id, plan_id')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!sub) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Fetch the new plan
    const { data: plan } = await admin
      .from('plans')
      .select('id, stripe_price_id')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (!plan.stripe_price_id) {
      return NextResponse.json({ error: 'Plan has no Stripe price ID configured' }, { status: 400 })
    }

    if (!sub.stripe_subscription_id) {
      // No Stripe subscription — just update the DB record
      const { error: updateErr } = await admin
        .from('client_subscriptions')
        .update({ plan_id: planId, updated_at: new Date().toISOString() })
        .eq('id', sub.id)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    await updateSubscription({
      subscriptionId: sub.stripe_subscription_id,
      newPriceId: plan.stripe_price_id,
      planId,
      clientId: user.id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('PATCH /api/billing/subscription error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/billing/subscription — Cancel subscription
export async function DELETE(_request: NextRequest) {
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

    const { data: sub } = await admin
      .from('client_subscriptions')
      .select('id, stripe_subscription_id')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (!sub) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    if (!sub.stripe_subscription_id) {
      // Just mark as cancelled in DB
      const { error: updateErr } = await admin
        .from('client_subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', sub.id)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    await cancelSubscription(sub.stripe_subscription_id, user.id)

    // Send notification
    await admin.from('notifications').insert({
      user_id: user.id,
      type: 'subscription_cancelled',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled. You will retain access until the end of your billing period.',
      action_url: '/plan',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('DELETE /api/billing/subscription error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
