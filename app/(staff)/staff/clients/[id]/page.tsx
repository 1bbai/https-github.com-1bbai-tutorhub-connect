import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { User, Mail, Phone, Building2, Calendar, CreditCard, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/PageHeader'
import type { ClientWithSubscription } from '@/types/database'

interface Props {
  params: { id: string }
}

export default async function StaffClientDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: client } = await supabase
    .from('users')
    .select(`
      id, email, full_name, phone, company_name, role, avatar_url, is_active, invited_by, created_at, updated_at,
      subscription:client_subscriptions(
        id, client_id, plan_id, stripe_subscription_id, stripe_customer_id,
        status, current_period_start, current_period_end, credits_remaining, created_at, updated_at,
        plan:plans(id, name, description, price_monthly, stripe_price_id, meeting_room_credits_per_month, features, is_active, created_at)
      )
    `)
    .eq('id', params.id)
    .eq('role', 'client')
    .single()

  if (!client) notFound()

  const normalized = {
    ...client,
    subscription: Array.isArray(client.subscription)
      ? (client.subscription[0] ?? null)
      : client.subscription,
  } as ClientWithSubscription

  const initials = normalized.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date')
    .eq('client_id', params.id)
    .neq('status', 'cancelled')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  const { data: bookings } = await supabase
    .from('room_bookings')
    .select(`
      id, start_time, end_time, credits_used, status,
      room:meeting_rooms(id, name)
    `)
    .eq('client_id', params.id)
    .order('start_time', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <PageHeader
        title={normalized.full_name}
        description={normalized.company_name ?? normalized.email}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{normalized.full_name}</p>
                <Badge
                  variant="outline"
                  className={
                    normalized.is_active
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-xs'
                      : 'bg-muted text-muted-foreground text-xs'
                  }
                >
                  {normalized.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="space-y-2.5 text-sm">
              {normalized.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{normalized.email}</span>
                </div>
              )}
              {normalized.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{normalized.phone}</span>
                </div>
              )}
              {normalized.company_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{normalized.company_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Joined {format(new Date(normalized.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {normalized.subscription ? (
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {normalized.subscription.plan?.name ?? 'Unknown Plan'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${normalized.subscription.plan?.price_monthly ?? 0}/mo
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    normalized.subscription.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : normalized.subscription.status === 'past_due'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {normalized.subscription.status}
                </Badge>
                <Separator />
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Credits remaining</span>
                    <span className="font-semibold">{normalized.subscription.credits_remaining ?? 0}</span>
                  </div>
                  {normalized.subscription.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Renews</span>
                      <span>{format(new Date(normalized.subscription.current_period_end), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">No active subscription</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Room Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {(bookings ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No bookings yet.</p>
            ) : (
              <div className="space-y-2.5">
                {bookings!.map((booking) => {
                  const room = Array.isArray(booking.room) ? booking.room[0] : booking.room
                  return (
                    <div key={booking.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {room?.name ?? 'Meeting Room'}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            booking.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : booking.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(booking.start_time), 'MMM d, yyyy · h:mm a')}
                        {' '}· {booking.credits_used} credit{booking.credits_used !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {(tasks ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No tasks for this client.</p>
          ) : (
            <div className="divide-y divide-border">
              {tasks!.map((task) => (
                <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : task.priority === 'high'
                          ? 'bg-orange-100 text-orange-700 border-orange-200'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
