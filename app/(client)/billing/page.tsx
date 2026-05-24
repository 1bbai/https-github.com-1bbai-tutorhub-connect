import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BillingPanel } from '@/components/client/BillingPanel'

export default async function ClientBillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [paymentMethodsResult, invoicesResult, subscriptionResult] = await Promise.all([
    supabase
      .from('payment_methods')
      .select('*')
      .eq('client_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('invoices')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('client_subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
  ])

  return (
    <BillingPanel
      clientId={user.id}
      paymentMethods={paymentMethodsResult.data ?? []}
      invoices={invoicesResult.data ?? []}
      subscription={subscriptionResult.data as any}
    />
  )
}
