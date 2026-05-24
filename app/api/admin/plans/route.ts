import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

// GET /api/admin/plans
export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data, error } = await admin.from('plans').select('*').order('price_monthly')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: subs } = await admin.from('client_subscriptions').select('plan_id').eq('status', 'active')
  const countByPlan: Record<string, number> = {}
  for (const sub of subs ?? []) {
    countByPlan[sub.plan_id] = (countByPlan[sub.plan_id] ?? 0) + 1
  }

  const plans = (data ?? []).map((p) => ({ ...p, client_count: countByPlan[p.id] ?? 0 }))
  return NextResponse.json({ plans })
}

// POST /api/admin/plans
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const user = await assertAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const admin = createAdminClient()

  const { data, error } = await admin.from('plans').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plan: data }, { status: 201 })
}
