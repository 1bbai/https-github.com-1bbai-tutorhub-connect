import { createClient } from '@/lib/supabase/server'
import { ServiceManagement } from '@/components/admin/ServiceManagement'

export default async function ServicesPage() {
  const supabase = await createClient()

  // Fetch plans with client count
  const { data: plansRaw } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly', { ascending: true })

  // Fetch client counts per plan
  const { data: subscriptions } = await supabase
    .from('client_subscriptions')
    .select('plan_id')
    .eq('status', 'active')

  const countByPlan: Record<string, number> = {}
  for (const sub of subscriptions ?? []) {
    countByPlan[sub.plan_id] = (countByPlan[sub.plan_id] ?? 0) + 1
  }

  const plans = (plansRaw ?? []).map((plan) => ({
    ...plan,
    client_count: countByPlan[plan.id] ?? 0,
  }))

  // Fetch services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })

  return (
    <ServiceManagement
      plans={plans}
      services={services ?? []}
    />
  )
}
