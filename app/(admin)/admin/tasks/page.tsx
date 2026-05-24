import { createClient } from '@/lib/supabase/server'
import { TaskBoard } from '@/components/admin/TaskBoard'
import type { TaskWithUsers, User } from '@/types/database'

export const metadata = { title: 'Tasks' }

export default async function TasksPage() {
  const supabase = await createClient()

  const [{ data: tasks }, { data: staff }, { data: clients }] =
    await Promise.all([
      supabase
        .from('tasks')
        .select(`
          id, title, description, client_id, assigned_to, created_by, service_category,
          priority, status, due_date, created_at, updated_at,
          client:users!tasks_client_id_fkey(id, full_name, email, company_name),
          assignee:users!tasks_assigned_to_fkey(id, full_name, avatar_url),
          creator:users!tasks_created_by_fkey(id, full_name)
        `)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false }),

      supabase
        .from('users')
        .select('id, full_name, avatar_url, email')
        .in('role', ['admin', 'staff'])
        .eq('is_active', true),

      supabase
        .from('users')
        .select('id, full_name, company_name, email')
        .eq('role', 'client')
        .eq('is_active', true)
        .order('full_name'),
    ])

  return (
    <TaskBoard
      initialTasks={(tasks ?? []) as unknown as TaskWithUsers[]}
      staff={(staff ?? []) as Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]}
      clients={(clients ?? []) as Pick<User, 'id' | 'full_name' | 'company_name' | 'email'>[]}
    />
  )
}
