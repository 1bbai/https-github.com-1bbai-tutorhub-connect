import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getContact } from '@/lib/crm/contact-helpers'
import { getStaffUsers, getTags } from '@/lib/crm/contact-helpers'
import { getPipelines } from '@/lib/crm/pipeline-helpers'
import { ContactDetail } from '@/components/crm/ContactDetail'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  const contact = await getContact(params.id)
  return {
    title: contact ? `${contact.full_name} – CRM` : 'Contact Not Found',
  }
}

export default async function ContactDetailPage({ params }: Props) {
  const [contact, staffUsers, tags, pipelines] = await Promise.all([
    getContact(params.id),
    getStaffUsers(),
    getTags(),
    getPipelines(),
  ])

  if (!contact) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ContactDetail
        contact={contact}
        staffUsers={staffUsers}
        tags={tags}
        pipelines={pipelines}
      />
    </Suspense>
  )
}
