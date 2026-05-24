import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfilePage } from '@/components/client/ProfilePage'

export default async function ClientProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, prefsResult] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id),
  ])

  return (
    <ProfilePage
      user={profileResult.data!}
      notificationPreferences={prefsResult.data ?? []}
    />
  )
}
