import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { detachPaymentMethod, setDefaultPaymentMethod } from '@/lib/stripe/payment-methods'

// DELETE /api/billing/payment-methods — Remove a payment method
export async function DELETE(request: NextRequest) {
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
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify the payment method belongs to this client
    const { data: pm } = await admin
      .from('payment_methods')
      .select('id, client_id')
      .eq('stripe_payment_method_id', paymentMethodId)
      .maybeSingle()

    if (!pm || pm.client_id !== user.id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    await detachPaymentMethod(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('DELETE /api/billing/payment-methods error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/billing/payment-methods — Set a payment method as default
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
    const { paymentMethodId } = body

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify ownership and get customer ID
    const { data: pm } = await admin
      .from('payment_methods')
      .select('id, client_id')
      .eq('stripe_payment_method_id', paymentMethodId)
      .maybeSingle()

    if (!pm || pm.client_id !== user.id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    const { data: sub } = await admin
      .from('client_subscriptions')
      .select('stripe_customer_id')
      .eq('client_id', user.id)
      .maybeSingle()

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 })
    }

    await setDefaultPaymentMethod(sub.stripe_customer_id, paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('PATCH /api/billing/payment-methods error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
