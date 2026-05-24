import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CrmContact,
  CrmContactWithUsers,
  ContactStatus,
  ContactSource,
  User,
} from '@/types/database'

// ─────────────────────────────────────────────
// Extended joined types
// ─────────────────────────────────────────────

export interface ContactWithActivity extends CrmContactWithUsers {
  activity_count: number
  last_activity_at: string | null
}

export interface ContactFull extends CrmContactWithUsers {
  activities: Array<{
    id: string
    type: string
    subject: string
    occurred_at: string
    created_by_user: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
  }>
  deals: Array<{
    id: string
    title: string
    value: number | null
    currency: string | null
    status: string
    stage: { id: string; name: string; color: string | null } | null
    pipeline: { id: string; name: string } | null
    expected_close_date: string | null
    assigned_user: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
  }>
}

// ─────────────────────────────────────────────
// getContacts
// ─────────────────────────────────────────────

export async function getContacts(filters?: {
  status?: string
  source?: string
  assignedTo?: string
  search?: string
}): Promise<ContactWithActivity[]> {
  const supabase = await createClient()

  let query = supabase
    .from('crm_contacts')
    .select(`
      *,
      assigned_user:users!crm_contacts_assigned_to_fkey(id, full_name, avatar_url),
      created_by_user:users!crm_contacts_created_by_fkey(id, full_name),
      linked_user:users!crm_contacts_linked_user_id_fkey(id, full_name, email),
      crm_activities(count)
    `)
    .order('updated_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status as ContactStatus)
  }
  if (filters?.source && filters.source !== 'all') {
    query = query.eq('source', filters.source as ContactSource)
  }
  if (filters?.assignedTo && filters.assignedTo !== 'all') {
    query = query.eq('assigned_to', filters.assignedTo)
  }
  if (filters?.search) {
    const s = `%${filters.search}%`
    query = query.or(`full_name.ilike.${s},email.ilike.${s},company_name.ilike.${s}`)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getContacts]', error.message)
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any
    const activityRows: Array<{ count: number }> = r.crm_activities ?? []
    const count = activityRows[0]?.count ?? 0
    return {
      ...r,
      activity_count: Number(count),
      last_activity_at: null,
    } as ContactWithActivity
  })
}

// ─────────────────────────────────────────────
// getContact (full detail)
// ─────────────────────────────────────────────

export async function getContact(id: string): Promise<ContactFull | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .select(`
      *,
      assigned_user:users!crm_contacts_assigned_to_fkey(id, full_name, avatar_url),
      created_by_user:users!crm_contacts_created_by_fkey(id, full_name),
      linked_user:users!crm_contacts_linked_user_id_fkey(id, full_name, email),
      activities:crm_activities(
        id, type, subject, occurred_at,
        created_by_user:users!crm_activities_created_by_fkey(id, full_name, avatar_url)
      ),
      deals:crm_deals(
        id, title, value, currency, status, expected_close_date,
        stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color),
        pipeline:crm_pipelines!crm_deals_pipeline_id_fkey(id, name),
        assigned_user:users!crm_deals_assigned_to_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getContact]', error.message)
    return null
  }

  return data as unknown as ContactFull
}

// ─────────────────────────────────────────────
// updateContactStatus
// ─────────────────────────────────────────────

export async function updateContactStatus(
  id: string,
  status: string
): Promise<CrmContact | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .update({ status: status as ContactStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateContactStatus]', error.message)
    throw new Error(error.message)
  }

  return data
}

// ─────────────────────────────────────────────
// updateContact
// ─────────────────────────────────────────────

export async function updateContact(
  id: string,
  updates: Partial<CrmContact>
): Promise<CrmContact | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateContact]', error.message)
    throw new Error(error.message)
  }

  return data
}

// ─────────────────────────────────────────────
// linkContactToUser
// ─────────────────────────────────────────────

export async function linkContactToUser(
  contactId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('crm_contacts')
    .update({ linked_user_id: userId, updated_at: new Date().toISOString() })
    .eq('id', contactId)

  if (error) {
    console.error('[linkContactToUser]', error.message)
    throw new Error(error.message)
  }
}

// ─────────────────────────────────────────────
// convertContactToClient
// ─────────────────────────────────────────────

export async function convertContactToClient(
  contactId: string,
  email: string,
  fullName: string
): Promise<{ userId: string }> {
  const admin = await createAdminClient()

  // 1. Invite user via Auth (magic link / invite email)
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName, role: 'client' },
    }
  )

  if (inviteError) {
    console.error('[convertContactToClient] invite error', inviteError.message)
    throw new Error(inviteError.message)
  }

  const userId = inviteData.user.id

  // 2. Upsert the public.users row (handle_new_user trigger may race)
  const { error: upsertError } = await admin
    .from('users')
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role: 'client',
        is_active: true,
      },
      { onConflict: 'id' }
    )

  if (upsertError) {
    console.error('[convertContactToClient] upsert user error', upsertError.message)
    throw new Error(upsertError.message)
  }

  // 3. Link contact to the new user
  await linkContactToUser(contactId, userId)

  // 4. Update status to "active"
  await updateContactStatus(contactId, 'active')

  return { userId }
}

// ─────────────────────────────────────────────
// getStaffUsers  (helper for dropdowns)
// ─────────────────────────────────────────────

export async function getStaffUsers(): Promise<
  Pick<User, 'id' | 'full_name' | 'avatar_url'>[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('role', ['admin', 'staff'])
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    console.error('[getStaffUsers]', error.message)
    return []
  }

  return data ?? []
}

// ─────────────────────────────────────────────
// getTags
// ─────────────────────────────────────────────

export async function getTags() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_tags')
    .select('*')
    .order('name')

  if (error) {
    console.error('[getTags]', error.message)
    return []
  }

  return data ?? []
}

// ─────────────────────────────────────────────
// createContact
// ─────────────────────────────────────────────

export async function createContact(
  payload: Omit<
    CrmContact,
    'id' | 'created_at' | 'updated_at' | 'linked_user_id'
  >
): Promise<CrmContact> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[createContact]', error.message)
    throw new Error(error.message)
  }

  return data
}

// ─────────────────────────────────────────────
// bulkUpdateContacts
// ─────────────────────────────────────────────

export async function bulkUpdateContacts(
  ids: string[],
  updates: { status?: string; assigned_to?: string | null }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('crm_contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) {
    console.error('[bulkUpdateContacts]', error.message)
    throw new Error(error.message)
  }
}
