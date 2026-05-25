import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const INTEGRATION_KEYS = [
  'resend_api_key',
  'resend_from_email',
  'resend_from_name',
  'twilio_account_sid',
  'twilio_auth_token',
  'twilio_from_number',
  'stripe_secret_key',
  'stripe_publishable_key',
  'stripe_webhook_secret',
] as const

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// GET — return current values (masked) + connected status
export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('app_settings')
    .select('key, value')
    .in('key', INTEGRATION_KEYS)

  const settings: Record<string, string> = {}
  for (const row of rows ?? []) {
    settings[row.key] = row.value ?? ''
  }

  // Merge env-var defaults for keys not yet saved to DB
  const merged = {
    resend_api_key:        settings.resend_api_key        ?? (process.env.RESEND_API_KEY        ? '••set-via-env••' : ''),
    resend_from_email:     settings.resend_from_email     ?? process.env.RESEND_FROM_EMAIL     ?? '',
    resend_from_name:      settings.resend_from_name      ?? process.env.RESEND_FROM_NAME      ?? '',
    twilio_account_sid:    settings.twilio_account_sid    ?? (process.env.TWILIO_ACCOUNT_SID   ? '••set-via-env••' : ''),
    twilio_auth_token:     settings.twilio_auth_token     ?? (process.env.TWILIO_AUTH_TOKEN    ? '••set-via-env••' : ''),
    twilio_from_number:    settings.twilio_from_number    ?? process.env.TWILIO_FROM_NUMBER    ?? '',
    stripe_secret_key:     settings.stripe_secret_key     ?? (process.env.STRIPE_SECRET_KEY    ? '••set-via-env••' : ''),
    stripe_publishable_key:settings.stripe_publishable_key?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
    stripe_webhook_secret: settings.stripe_webhook_secret ?? (process.env.STRIPE_WEBHOOK_SECRET? '••set-via-env••' : ''),
  }

  return NextResponse.json(merged)
}

// POST — save one or more settings keys
export async function POST(req: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body: Record<string, string> = await req.json()
  const admin = createAdminClient()

  const upserts = Object.entries(body)
    .filter(([key]) => (INTEGRATION_KEYS as readonly string[]).includes(key))
    .filter(([, value]) => value !== '••set-via-env••') // don't overwrite env-sourced placeholders
    .map(([key, value]) => ({
      key,
      value: value.trim(),
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }))

  if (upserts.length === 0) {
    return NextResponse.json({ success: true })
  }

  const { error } = await admin.from('app_settings').upsert(upserts, { onConflict: 'key' })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
