import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientDetail } from '@/components/admin/ClientDetail'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', params.id)
    .single()
  return { title: (data as { full_name: string } | null)?.full_name ?? 'Client Detail' }
}

export default async function ClientDetailPage({ params }: Props) {
  const supabase = await createClient()

  const [
    { data: client },
    { data: subscription },
    { data: clientServices },
    { data: bookings },
    { data: invoices },
    { data: tasks },
    { data: crmContact },
    { data: credits },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single(),

    supabase
      .from('client_subscriptions')
      .select('*, plan:plans(*)')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('client_services')
      .select('*, service:services(*)')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('room_bookings')
      .select('*, room:meeting_rooms(id, name, capacity, credits_per_hour)')
      .eq('client_id', params.id)
      .order('start_time', { ascending: false })
      .limit(20),

    supabase
      .from('invoices')
      .select('*')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('tasks')
      .select('*')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('crm_contacts')
      .select('id, full_name, email, phone, status, company_name')
      .eq('linked_user_id', params.id)
      .maybeSingle(),

    supabase
      .from('credit_ledger')
      .select('*, performer:users!performed_by(full_name)')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (!client) notFound()

  return (
    <ClientDetail
      client={client}
      subscription={subscription}
      clientServices={clientServices ?? []}
      bookings={bookings ?? []}
      invoices={invoices ?? []}
      tasks={tasks ?? []}
      crmContact={crmContact}
      creditHistory={credits ?? []}
    />
  )
}
