import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { first_name, last_name, email, password, phone, company_name } = body

  if (!first_name || !last_name || !email || !password || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const full_name = `${first_name.trim()} ${last_name.trim()}`
  const admin = createAdminClient()

  // Check if the email is already registered
  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Please sign in instead.' },
      { status: 409 }
    )
  }

  // Create the auth user (admin client auto-confirms the email)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'client' },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already been registered') ||
        authError.message.toLowerCase().includes('already exists')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const userId = authData.user.id

  // Upsert the profile row (trigger may have already created it)
  const { error: profileError } = await admin.from('users').upsert({
    id: userId,
    email: email.toLowerCase().trim(),
    full_name,
    phone: phone.trim(),
    company_name: company_name?.trim() || null,
    role: 'client',
    is_active: true,
  })

  if (profileError) {
    console.error('Profile upsert failed:', profileError.message)
    // Non-fatal: auth user created, profile can be fixed later
  }

  return NextResponse.json({ success: true })
}
