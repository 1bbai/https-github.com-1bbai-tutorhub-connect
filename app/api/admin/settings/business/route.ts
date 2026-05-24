import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/admin/settings/business
// Body: business profile fields
// In a full implementation this would upsert to a business_settings table.
// For now, returns success as env vars are read-only at runtime.
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse body (we'll store this in a future business_settings table)
  const body = await req.json()

  // TODO: upsert to business_settings table once migration is run
  // For now, acknowledge the save
  console.info('[settings/business] Profile save requested:', JSON.stringify(body))

  return NextResponse.json({ success: true })
}
