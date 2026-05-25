import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createStripeCustomer } from '@/lib/stripe/subscriptions'
import { sendInviteEmail } from '@/lib/resend/sender'

// POST /api/admin/invite
// Body: { email, full_name, role: 'admin' | 'staff' | 'client', company_name? }
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin-only
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { email, full_name, role, company_name } = body

  if (!email || !full_name || !role) {
    return NextResponse.json(
      { error: 'email, full_name, and role are required' },
      { status: 400 }
    )
  }

  if (!['admin', 'staff', 'client'].includes(role)) {
    return NextResponse.json(
      { error: 'role must be admin, staff, or client' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  try {
    // Send invite email via Supabase Auth
    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          role,
          company_name: company_name ?? null,
        },
      })

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    const newUserId = inviteData.user.id

    // Create the user record in our users table
    const { error: userError } = await admin.from('users').upsert({
      id: newUserId,
      email,
      full_name,
      role,
      company_name: company_name ?? null,
      invited_by: user.id,
      is_active: true,
    })

    if (userError) {
      console.error('Failed to create user record:', userError.message)
    }

    // For clients, create a Stripe customer
    if (role === 'client') {
      try {
        await createStripeCustomer({
          email,
          name: full_name,
          userId: newUserId,
        })
      } catch (stripeErr) {
        // Non-fatal: Stripe customer can be created later
        console.error('Stripe customer creation failed during invite:', stripeErr)
      }
    }

    // Send branded invite email via Resend (in addition to Supabase's system invite)
    try {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://my.markhamoffice.com'}/accept-invite`
      await sendInviteEmail({ to: email, fullName: full_name, inviteUrl })
    } catch (emailErr) {
      console.error('Invite email failed:', emailErr)
    }

    return NextResponse.json({ success: true, userId: newUserId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to invite user'
    console.error('POST /api/admin/invite error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
