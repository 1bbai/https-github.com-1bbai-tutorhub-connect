import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PUT /api/profile/notifications — Upsert a notification preference
export async function PUT(request: NextRequest) {
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
    const { eventType, email_enabled, sms_enabled } = body

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Check if a preference record exists for this user + event
    const { data: existing } = await admin
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_type', eventType)
      .maybeSingle()

    const updateData: Record<string, unknown> = {
      user_id: user.id,
      event_type: eventType,
    }

    if (email_enabled !== undefined) updateData.email_enabled = email_enabled
    if (sms_enabled !== undefined) updateData.sms_enabled = sms_enabled

    let result
    if (existing) {
      const { data, error } = await admin
        .from('notification_preferences')
        .update(updateData)
        .eq('id', existing.id)
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    } else {
      const { data, error } = await admin
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          event_type: eventType,
          email_enabled: email_enabled ?? true,
          sms_enabled: sms_enabled ?? true,
          in_app_enabled: true,
        })
        .select('*')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      result = data
    }

    return NextResponse.json({ preference: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('PUT /api/profile/notifications error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
