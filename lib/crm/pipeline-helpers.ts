import { createClient } from '@/lib/supabase/server'
import type {
  CrmPipeline,
  CrmPipelineStage,
  CrmPipelineWithStages,
  CrmDeal,
  CrmDealWithRelations,
  CrmDealInsert,
  DealStatus,
} from '@/types/database'

// ─────────────────────────────────────────────
// Extended types
// ─────────────────────────────────────────────

export interface PipelineWithDeals extends CrmPipelineWithStages {
  stages: (CrmPipelineStage & {
    deals: CrmDealWithRelations[]
  })[]
}

export interface CreateDealInput {
  contactId: string
  pipelineId: string
  stageId: string
  title: string
  value?: number | null
  currency?: string
  status?: DealStatus
  expectedCloseDate?: string | null
  assignedTo?: string | null
  notes?: string | null
  createdBy?: string | null
}

// ─────────────────────────────────────────────
// getPipelines
// ─────────────────────────────────────────────

export async function getPipelines(): Promise<CrmPipelineWithStages[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_pipelines')
    .select(`
      *,
      stages:crm_pipeline_stages(*)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getPipelines]', error.message)
    throw new Error(error.message)
  }

  return (data ?? []).map((p) => ({
    ...p,
    stages: (p.stages ?? []).sort(
      (a: CrmPipelineStage, b: CrmPipelineStage) => a.order_index - b.order_index
    ),
  })) as CrmPipelineWithStages[]
}

// ─────────────────────────────────────────────
// getDefaultPipeline
// ─────────────────────────────────────────────

export async function getDefaultPipeline(): Promise<CrmPipelineWithStages | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_pipelines')
    .select(`
      *,
      stages:crm_pipeline_stages(*)
    `)
    .eq('is_default', true)
    .single()

  if (error) {
    // Fall back to first pipeline
    const all = await getPipelines()
    return all[0] ?? null
  }

  if (!data) return null

  return {
    ...data,
    stages: (data.stages ?? []).sort(
      (a: CrmPipelineStage, b: CrmPipelineStage) => a.order_index - b.order_index
    ),
  } as CrmPipelineWithStages
}

// ─────────────────────────────────────────────
// getPipelineWithDeals
// ─────────────────────────────────────────────

export async function getPipelineWithDeals(
  pipelineId: string
): Promise<PipelineWithDeals | null> {
  const supabase = await createClient()

  // Fetch pipeline + stages
  const { data: pipeline, error: pipelineError } = await supabase
    .from('crm_pipelines')
    .select(`
      *,
      stages:crm_pipeline_stages(*)
    `)
    .eq('id', pipelineId)
    .single()

  if (pipelineError || !pipeline) {
    console.error('[getPipelineWithDeals] pipeline', pipelineError?.message)
    return null
  }

  // Fetch deals with relations for this pipeline
  const { data: deals, error: dealsError } = await supabase
    .from('crm_deals')
    .select(`
      *,
      contact:crm_contacts!crm_deals_contact_id_fkey(id, full_name, company_name, email),
      stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color, order_index),
      assigned_user:users!crm_deals_assigned_to_fkey(id, full_name, avatar_url)
    `)
    .eq('pipeline_id', pipelineId)
    .order('updated_at', { ascending: false })

  if (dealsError) {
    console.error('[getPipelineWithDeals] deals', dealsError.message)
    throw new Error(dealsError.message)
  }

  const sortedStages = (pipeline.stages ?? []).sort(
    (a: CrmPipelineStage, b: CrmPipelineStage) => a.order_index - b.order_index
  )

  const stagesWithDeals = sortedStages.map((stage: CrmPipelineStage) => ({
    ...stage,
    deals: ((deals ?? []) as unknown as CrmDealWithRelations[]).filter(
      (d) => d.stage_id === stage.id
    ),
  }))

  return {
    ...pipeline,
    stages: stagesWithDeals,
  } as PipelineWithDeals
}

// ─────────────────────────────────────────────
// moveDeal
// ─────────────────────────────────────────────

export async function moveDeal(
  dealId: string,
  newStageId: string
): Promise<CrmDeal> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_deals')
    .update({
      stage_id: newStageId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)
    .select()
    .single()

  if (error) {
    console.error('[moveDeal]', error.message)
    throw new Error(error.message)
  }

  return data
}

// ─────────────────────────────────────────────
// createDeal
// ─────────────────────────────────────────────

export async function createDeal(input: CreateDealInput): Promise<CrmDeal> {
  const supabase = await createClient()

  const payload: CrmDealInsert = {
    contact_id: input.contactId,
    pipeline_id: input.pipelineId,
    stage_id: input.stageId,
    title: input.title,
    value: input.value ?? null,
    currency: input.currency ?? 'CAD',
    status: input.status ?? 'open',
    expected_close_date: input.expectedCloseDate ?? null,
    assigned_to: input.assignedTo ?? null,
    notes: input.notes ?? null,
    created_by: input.createdBy ?? null,
  }

  const { data, error } = await supabase
    .from('crm_deals')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[createDeal]', error.message)
    throw new Error(error.message)
  }

  return data
}

// ─────────────────────────────────────────────
// updateDeal
// ─────────────────────────────────────────────

export async function updateDeal(
  id: string,
  updates: Partial<CrmDeal>
): Promise<CrmDeal> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_deals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateDeal]', error.message)
    throw new Error(error.message)
  }

  return data
}

// ─────────────────────────────────────────────
// deleteDeal
// ─────────────────────────────────────────────

export async function deleteDeal(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('crm_deals')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteDeal]', error.message)
    throw new Error(error.message)
  }
}

// ─────────────────────────────────────────────
// getDeal (single with relations)
// ─────────────────────────────────────────────

export async function getDeal(id: string): Promise<CrmDealWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_deals')
    .select(`
      *,
      contact:crm_contacts!crm_deals_contact_id_fkey(id, full_name, company_name, email),
      stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color, order_index),
      assigned_user:users!crm_deals_assigned_to_fkey(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getDeal]', error.message)
    return null
  }

  return data as unknown as CrmDealWithRelations
}

// ─────────────────────────────────────────────
// getDashboardStats (for CRM dashboard)
// ─────────────────────────────────────────────

export async function getCrmStats() {
  const supabase = await createClient()

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [
    { count: totalContacts },
    { count: newThisWeek },
    { data: openDeals },
    { data: staleContacts },
  ] = await Promise.all([
    supabase.from('crm_contacts').select('*', { count: 'exact', head: true }),
    supabase
      .from('crm_contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString()),
    supabase
      .from('crm_deals')
      .select('value')
      .eq('status', 'open'),
    supabase
      .from('crm_contacts')
      .select('id, full_name, email, updated_at, assigned_to')
      .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10),
  ])

  const pipelineValue = (openDeals ?? []).reduce(
    (sum, d) => sum + (d.value ?? 0),
    0
  )

  return {
    totalContacts: totalContacts ?? 0,
    newThisWeek: newThisWeek ?? 0,
    openDeals: openDeals?.length ?? 0,
    pipelineValue,
    staleContacts: staleContacts ?? [],
  }
}
