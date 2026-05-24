import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/support/requests/[id]/comments — Add a comment to a task
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const body = await request.json()
    const { body: commentBody } = body

    if (!commentBody || !commentBody.trim()) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify access: client can only comment on their own tasks; staff/admin can comment on any
    const { data: task } = await admin
      .from('tasks')
      .select('id, client_id')
      .eq('id', taskId)
      .maybeSingle()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const { data: profile } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isClient = task.client_id === user.id
    const isStaff = profile?.role === 'admin' || profile?.role === 'staff'

    if (!isClient && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: comment, error: commentError } = await admin
      .from('task_comments')
      .insert({
        task_id: taskId,
        author_id: user.id,
        body: commentBody.trim(),
      })
      .select('*, author:users(id, full_name, avatar_url)')
      .single()

    if (commentError) {
      return NextResponse.json({ error: commentError.message }, { status: 500 })
    }

    // Update task updated_at
    await admin
      .from('tasks')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', taskId)

    // Notify the client if the commenter is staff
    if (isStaff && task.client_id) {
      await admin.from('notifications').insert({
        user_id: task.client_id,
        type: 'task_updated',
        title: 'New Reply on Your Request',
        message: 'A staff member has replied to your support request.',
        action_url: '/support',
      })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('POST /api/support/requests/[id]/comments error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/support/requests/[id]/comments — List comments for a task
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const admin = createAdminClient()

    // Verify task access
    const { data: task } = await admin
      .from('tasks')
      .select('id, client_id')
      .eq('id', taskId)
      .maybeSingle()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const { data: profile } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isClient = task.client_id === user.id
    const isStaff = profile?.role === 'admin' || profile?.role === 'staff'

    if (!isClient && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: comments, error } = await admin
      .from('task_comments')
      .select('*, author:users(id, full_name, avatar_url)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: comments ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
