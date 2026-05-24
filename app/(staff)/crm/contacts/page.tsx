import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getContacts, getStaffUsers, getTags } from '@/lib/crm/contact-helpers'
import { ContactList } from '@/components/crm/ContactList'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export const metadata = {
  title: 'My Contacts – Staff Portal',
}

export default async function StaffContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Filter contacts assigned to this staff member
  const [contacts, staffUsers, tags] = await Promise.all([
    getContacts({ assignedTo: user.id }),
    getStaffUsers(),
    getTags(),
  ])

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ContactList
        initialContacts={contacts}
        staffUsers={staffUsers}
        tags={tags}
      />
    </Suspense>
  )
}
