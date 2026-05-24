'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import {
  CheckSquare,
  Briefcase,
  Users,
  TrendingUp,
  Clock,
  MessageSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatCard } from '@/components/shared/StatCard'
import type { CrmDealWithRelations, TaskWithUsers, CrmActivity } from '@/types/database'

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  call: MessageSquare,
  email: MessageSquare,
  meeting: Users,
  note: MessageSquare,
  task: CheckSquare,
  sms: MessageSquare,
  system: TrendingUp,
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  awaiting_client: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-muted text-muted-foreground',
}

function formatCAD(value: number | null): string {
  if (!value) return '$0'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

interface StaffDashboardProps {
  assignedDeals: CrmDealWithRelations[]
  myTasks: TaskWithUsers[]
  recentActivities: CrmActivity[]
  stats: {
    openTasks: number
    activeDeals: number
    newLeadsThisWeek: number
  }
  userId: string
}

export function StaffDashboard({
  assignedDeals,
  myTasks,
  recentActivities,
  stats,
}: StaffDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Open Tasks"
          value={stats.openTasks}
          icon={CheckSquare}
          description="Assigned to you"
        />
        <StatCard
          title="Active Deals"
          value={stats.activeDeals}
          icon={Briefcase}
          description="Deals assigned to you"
        />
        <StatCard
          title="New Leads"
          value={stats.newLeadsThisWeek}
          icon={TrendingUp}
          description="This week"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Deals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">My Deals</CardTitle>
              <Link
                href="/staff/crm/deals"
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {assignedDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No deals assigned to you yet.
              </p>
            ) : (
              assignedDeals.slice(0, 8).map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(deal.contact.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{deal.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {deal.contact.company_name ?? deal.contact.full_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-emerald-700">
                      {deal.value ? formatCAD(deal.value) : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{deal.stage.name}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">My Tasks</CardTitle>
              <Link
                href="/staff/tasks"
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No tasks assigned to you.
              </p>
            ) : (
              myTasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <CheckSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      {task.client && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.client.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}
                    >
                      {task.priority}
                    </Badge>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No recent activity.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] ?? MessageSquare
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.subject}</p>
                      {activity.body && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{activity.body}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 capitalize">
                          {activity.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(activity.occurred_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
