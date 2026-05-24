import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SupportThread } from '@/components/client/SupportThread'

export default async function ClientSupportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <SupportThread
      initialTasks={(tasks as any) ?? []}
      clientId={user.id}
    />
  )
}
