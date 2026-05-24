import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/profile — Update user profile (full_name, phone, company_name)
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
    const { full_name, phone, company_name } = body

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: profile, error } = await admin
      .from('users')
      .update({
        full_name: full_name.trim(),
        phone: phone ?? null,
        company_name: company_name ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('PATCH /api/profile error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
