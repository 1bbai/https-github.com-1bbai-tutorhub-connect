import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { creditCredits, debitCredits } from '@/lib/credits/credit-engine'

// POST /api/admin/clients/[id]/credits
// Body: { amount: number, type: 'credit' | 'debit', reason: string }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin-only check
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { amount, type, reason } = body

  if (!amount || !type || !reason) {
    return NextResponse.json(
      { error: 'amount, type, and reason are required' },
      { status: 400 }
    )
  }

  if (type !== 'credit' && type !== 'debit') {
    return NextResponse.json({ error: 'type must be "credit" or "debit"' }, { status: 400 })
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })
  }

  const clientId = params.id

  try {
    if (type === 'credit') {
      const result = await creditCredits({ clientId, amount, reason })
      return NextResponse.json({ success: true, newBalance: result.newBalance })
    } else {
      const result = await debitCredits({ clientId, amount, reason })
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true, newBalance: result.newBalance })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update credits'
    console.error('POST /api/admin/clients/[id]/credits error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
