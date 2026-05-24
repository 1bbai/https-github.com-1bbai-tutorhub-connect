import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StaffShell } from '@/components/staff/StaffShell'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, role, avatar_url, company_name')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    redirect('/login')
  }

  return (
    <StaffShell profile={profile}>
      {children}
    </StaffShell>
  )
}
