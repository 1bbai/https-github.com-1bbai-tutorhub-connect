import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StaffDashboard } from '@/components/staff/StaffDashboard'
import type { CrmDealWithRelations, TaskWithUsers, CrmActivity } from '@/types/database'

export default async function StaffDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Fetch deals assigned to this staff member
  const { data: dealsRaw } = await supabase
    .from('crm_deals')
    .select(`
      *,
      contact:crm_contacts!crm_deals_contact_id_fkey(id, full_name, company_name, email),
      stage:crm_pipeline_stages!crm_deals_stage_id_fkey(id, name, color, order_index),
      assigned_user:users!crm_deals_assigned_to_fkey(id, full_name, avatar_url)
    `)
    .eq('assigned_to', user.id)
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(10)

  // Fetch tasks assigned to this user
  const { data: tasksRaw } = await supabase
    .from('tasks')
    .select(`
      *,
      client:users!tasks_client_id_fkey(id, full_name, email, company_name),
      assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
      creator:users!tasks_created_by_fkey(id, full_name)
    `)
    .eq('assigned_to', user.id)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  // Recent activities created by this user (last 10)
  const { data: activitiesRaw } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('created_by', user.id)
    .order('occurred_at', { ascending: false })
    .limit(10)

  // Stats
  const { count: openTasks } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', user.id)
    .not('status', 'in', '("completed","cancelled")')

  const { count: activeDeals } = await supabase
    .from('crm_deals')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', user.id)
    .eq('status', 'open')

  const { count: newLeadsThisWeek } = await supabase
    .from('crm_contacts')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', user.id)
    .eq('status', 'lead')
    .gte('created_at', weekAgo.toISOString())

  return (
    <StaffDashboard
      assignedDeals={(dealsRaw ?? []) as unknown as CrmDealWithRelations[]}
      myTasks={(tasksRaw ?? []) as unknown as TaskWithUsers[]}
      recentActivities={(activitiesRaw ?? []) as unknown as CrmActivity[]}
      stats={{
        openTasks: openTasks ?? 0,
        activeDeals: activeDeals ?? 0,
        newLeadsThisWeek: newLeadsThisWeek ?? 0,
      }}
      userId={user.id}
    />
  )
}
