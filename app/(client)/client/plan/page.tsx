import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlanPage } from '@/components/client/PlanPage'

export default async function ClientPlanPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [subscriptionResult, plansResult] = await Promise.all([
    supabase
      .from('client_subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),

    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true }),
  ])

  const subscription = subscriptionResult.data
  const allPlans = plansResult.data ?? []

  return (
    <PlanPage
      subscription={subscription as any}
      allPlans={allPlans}
      clientId={user.id}
    />
  )
}
