import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ServiceCards } from '@/components/client/ServiceCards'

export default async function ClientServicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: clientServices } = await supabase
    .from('client_services')
    .select('*, service:services(*)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return <ServiceCards clientServices={(clientServices as any) ?? []} />
}
