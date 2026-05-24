import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSetupIntent } from '@/lib/stripe/payment-methods'
import { createStripeCustomer } from '@/lib/stripe/subscriptions'

export async function POST(_request: NextRequest) {
  try {
    // Authenticate the calling user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Fetch the user's profile to get name & email
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Look up existing subscription to get stripe_customer_id
    let { data: sub } = await adminClient
      .from('client_subscriptions')
      .select('stripe_customer_id')
      .eq('client_id', user.id)
      .maybeSingle()

    let customerId = sub?.stripe_customer_id ?? null

    // If no Stripe customer exists yet, create one now
    if (!customerId) {
      const customer = await createStripeCustomer({
        email: profile.email,
        name: profile.full_name,
        userId: user.id,
      })
      customerId = customer.id

      // Persist the customer ID — upsert so we don't duplicate rows
      const { error: upsertError } = await adminClient
        .from('client_subscriptions')
        .upsert(
          {
            client_id: user.id,
            stripe_customer_id: customerId,
            // plan_id will be set when a subscription is actually created;
            // use a sentinel / empty plan_id only if the column allows null.
            // For now we rely on the caller to have already created the row.
          },
          { onConflict: 'client_id' },
        )

      if (upsertError) {
        console.error('Failed to persist stripe_customer_id:', upsertError.message)
      }
    }

    const { clientSecret } = await createSetupIntent(customerId)

    return NextResponse.json({ clientSecret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('POST /api/billing/setup-intent error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
