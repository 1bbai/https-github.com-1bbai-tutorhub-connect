import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDefaultPipeline, getPipelineWithDeals } from '@/lib/crm/pipeline-helpers'
import { DealKanban } from '@/components/crm/DealKanban'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Kanban } from 'lucide-react'
import type { PipelineWithDeals } from '@/lib/crm/pipeline-helpers'

export const metadata = { title: 'My Deals – Staff Portal' }

export default async function StaffDealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const defaultPipeline = await getDefaultPipeline()
  let pipeline: PipelineWithDeals | null = null

  if (defaultPipeline) {
    pipeline = await getPipelineWithDeals(defaultPipeline.id)
    // Filter deals to only those assigned to this user
    if (pipeline) {
      pipeline = {
        ...pipeline,
        stages: pipeline.stages.map((stage) => ({
          ...stage,
          deals: stage.deals.filter(
            (deal) => deal.assigned_to === user.id
          ),
        })),
      }
    }
  }

  // Fetch staff list for the deal drawer
  const { data: staffList } = await supabase
    .from('users')
    .select('id, email, full_name, phone, company_name, role, avatar_url, is_active, invited_by, created_at, updated_at')
    .in('role', ['admin', 'staff'])
    .eq('is_active', true)
    .order('full_name')

  if (!pipeline) {
    return (
      <div>
        <PageHeader title="My Deals" description="Deals assigned to you" />
        <EmptyState
          icon={Kanban}
          title="No pipeline configured"
          description="Ask your admin to set up a CRM pipeline."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="My Deals"
        description="Deals assigned to you"
      />
      <DealKanban
        pipeline={pipeline}
        staffList={staffList ?? []}
      />
    </div>
  )
}
