import { createClient } from '@/lib/supabase/server'
import type { CrmActivity, ActivityType, ActivityDirection } from '@/types/database'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface LogActivityParams {
  contactId: string
  type: ActivityType
  subject: string
  body?: string
  direction?: ActivityDirection
  dealId?: string
  createdBy: string
  occurredAt?: Date
}

export interface ActivityWithUser extends CrmActivity {
  created_by_user: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

// ─────────────────────────────────────────────
// logActivity
// ─────────────────────────────────────────────

export async function logActivity(params: LogActivityParams): Promise<CrmActivity> {
  const supabase = await createClient()

  const payload = {
    contact_id: params.contactId,
    type: params.type,
    subject: params.subject,
    body: params.body ?? null,
    direction: params.direction ?? null,
    deal_id: params.dealId ?? null,
    created_by: params.createdBy,
    occurred_at: (params.occurredAt ?? new Date()).toISOString(),
  }

  const { data, error } = await supabase
    .from('crm_activities')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[logActivity]', error.message)
    throw new Error(error.message)
  }

  return data
}

// ─────────────────────────────────────────────
// getContactActivities
// ─────────────────────────────────────────────

export async function getContactActivities(
  contactId: string,
  limit = 50,
  offset = 0
): Promise<ActivityWithUser[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_activities')
    .select(`
      *,
      created_by_user:users!crm_activities_created_by_fkey(id, full_name, avatar_url)
    `)
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[getContactActivities]', error.message)
    throw new Error(error.message)
  }

  return (data ?? []) as unknown as ActivityWithUser[]
}

// ─────────────────────────────────────────────
// getDealActivities
// ─────────────────────────────────────────────

export async function getDealActivities(
  dealId: string,
  limit = 30
): Promise<ActivityWithUser[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_activities')
    .select(`
      *,
      created_by_user:users!crm_activities_created_by_fkey(id, full_name, avatar_url)
    `)
    .eq('deal_id', dealId)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getDealActivities]', error.message)
    throw new Error(error.message)
  }

  return (data ?? []) as unknown as ActivityWithUser[]
}

// ─────────────────────────────────────────────
// getRecentActivities (across all contacts)
// ─────────────────────────────────────────────

export async function getRecentActivities(limit = 20): Promise<
  (ActivityWithUser & {
    contact: { id: string; full_name: string; company_name: string | null } | null
  })[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_activities')
    .select(`
      *,
      created_by_user:users!crm_activities_created_by_fkey(id, full_name, avatar_url),
      contact:crm_contacts!crm_activities_contact_id_fkey(id, full_name, company_name)
    `)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getRecentActivities]', error.message)
    throw new Error(error.message)
  }

  return (data ?? []) as unknown as (ActivityWithUser & {
    contact: { id: string; full_name: string; company_name: string | null } | null
  })[]
}
