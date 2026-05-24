import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeCustomer } from '@/lib/stripe/subscriptions'

// GET /api/admin/clients
// Returns all clients with their subscriptions (admin only)
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('users')
    .select(`
      id, email, full_name, phone, company_name, role, avatar_url, is_active, invited_by, created_at, updated_at,
      subscription:client_subscriptions(
        id, client_id, plan_id, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, credits_remaining, created_at, updated_at,
        plan:plans(id, name, price_monthly, is_active)
      )
    `)
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const normalized = (data ?? []).map((c) => ({
    ...c,
    subscription: Array.isArray(c.subscription) ? (c.subscription[0] ?? null) : c.subscription,
  }))

  return NextResponse.json({ clients: normalized })
}

// POST /api/admin/clients
// Body: { email, full_name, company_name? }
// Creates a client user, sends invite, and creates Stripe customer (admin only)
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { email, full_name, company_name } = body

  if (!email || !full_name) {
    return NextResponse.json({ error: 'email and full_name are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  try {
    // Invite via Supabase Auth
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          role: 'client',
          company_name: company_name ?? null,
        },
      })

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    const newUserId = inviteData.user.id

    // Upsert user row
    const { error: userError } = await admin.from('users').upsert({
      id: newUserId,
      email,
      full_name,
      company_name: company_name ?? null,
      role: 'client',
      invited_by: user.id,
    })

    if (userError) {
      console.error('Failed to upsert user:', userError.message)
    }

    // Create Stripe customer
    let stripeCustomerId: string | null = null
    try {
      const customer = await createStripeCustomer({
        email,
        name: full_name,
        userId: newUserId,
      })
      stripeCustomerId = customer.id
    } catch (stripeErr) {
      console.error('Stripe customer creation failed:', stripeErr)
    }

    return NextResponse.json({
      success: true,
      userId: newUserId,
      stripeCustomerId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create client'
    console.error('POST /api/admin/clients error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
