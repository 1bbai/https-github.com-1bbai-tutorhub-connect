import { createClient } from '@/lib/supabase/server'
import { ClientList } from '@/components/admin/ClientList'
import type { ClientWithSubscription } from '@/types/database'

export const metadata = { title: 'Clients' }

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('users')
    .select(`
      id, email, full_name, phone, company_name, role, avatar_url, is_active, invited_by, created_at, updated_at,
      subscription:client_subscriptions(
        id, client_id, plan_id, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, credits_remaining, created_at, updated_at,
        plan:plans(id, name, description, price_monthly, stripe_price_id, meeting_room_credits_per_month, features, is_active, created_at)
      )
    `)
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  // Flatten single-element arrays from supabase join
  const normalizedClients = (clients ?? []).map((c) => ({
    ...c,
    subscription: Array.isArray(c.subscription)
      ? (c.subscription[0] ?? null)
      : c.subscription,
  })) as ClientWithSubscription[]

  return <ClientList clients={normalizedClients} />
}
