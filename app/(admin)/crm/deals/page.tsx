import { createClient } from '@/lib/supabase/server'
import { getDefaultPipeline, getPipelineWithDeals } from '@/lib/crm/pipeline-helpers'
import { DealKanban } from '@/components/crm/DealKanban'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Kanban } from 'lucide-react'
import type { PipelineWithDeals } from '@/lib/crm/pipeline-helpers'

export default async function DealsPage() {
  const supabase = await createClient()

  // Fetch default pipeline with stages and deals
  const defaultPipeline = await getDefaultPipeline()
  let pipeline: PipelineWithDeals | null = null

  if (defaultPipeline) {
    pipeline = await getPipelineWithDeals(defaultPipeline.id)
  }

  // Fetch staff list
  const { data: staffList } = await supabase
    .from('users')
    .select('id, email, full_name, phone, company_name, role, avatar_url, is_active, invited_by, created_at, updated_at')
    .in('role', ['admin', 'staff'])
    .eq('is_active', true)
    .order('full_name')

  if (!pipeline) {
    return (
      <div>
        <PageHeader
          title="Deals"
          description="Manage your CRM deals pipeline"
        />
        <EmptyState
          icon={Kanban}
          title="No pipeline configured"
          description="Create a CRM pipeline first to start tracking deals."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={pipeline.name}
        description="Drag and drop deals between stages to update their status"
      />
      <DealKanban
        pipeline={pipeline}
        staffList={staffList ?? []}
      />
    </div>
  )
}
