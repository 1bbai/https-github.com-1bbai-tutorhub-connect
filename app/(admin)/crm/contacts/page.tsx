import { Suspense } from 'react'
import { getContacts } from '@/lib/crm/contact-helpers'
import { getStaffUsers, getTags } from '@/lib/crm/contact-helpers'
import { ContactList } from '@/components/crm/ContactList'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

export const metadata = {
  title: 'Contacts – CRM',
}

export default async function ContactsPage() {
  const [contacts, staffUsers, tags] = await Promise.all([
    getContacts(),
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
