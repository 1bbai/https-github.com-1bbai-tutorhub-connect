'use client'

import { format } from 'date-fns'
import {
  Users,
  CheckSquare,
  CalendarClock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Clock,
  CalendarDays,
} from 'lucide-react'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RoomBookingWithDetails } from '@/types/database'
import { cn } from '@/lib/utils'

export interface AdminStats {
  activeClients: number
  openTasks: number
  upcomingBookings: number
  monthlyRevenue: number
  pipelineValue: number
  newLeadsThisWeek: number
}

export interface TaskGroups {
  urgent: number
  high: number
  medium: number
  low: number
}

interface AdminDashboardProps {
  stats: AdminStats
  upcomingBookings: RoomBookingWithDetails[]
  tasksByPriority: TaskGroups
}

const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgent',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
  },
  high: {
    label: 'High',
    color: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  low: {
    label: 'Low',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function AdminDashboard({
  stats,
  upcomingBookings,
  tasksByPriority,
}: AdminDashboardProps) {
  const totalOpenTasks =
    tasksByPriority.urgent +
    tasksByPriority.high +
    tasksByPriority.medium +
    tasksByPriority.low

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Overview for ${format(new Date(), 'MMMM d, yyyy')}`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Active Clients"
          value={stats.activeClients}
          icon={Users}
          description="Currently subscribed"
          trend={{ value: 5, label: 'vs last month', positive: true }}
        />
        <StatCard
          title="Open Tasks"
          value={stats.openTasks}
          icon={CheckSquare}
          description="Across all priorities"
        />
        <StatCard
          title="Upcoming Bookings"
          value={stats.upcomingBookings}
          icon={CalendarClock}
          description="Next 7 days"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          description="Paid invoices this month"
          trend={{ value: 8, label: 'vs last month', positive: true }}
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(stats.pipelineValue)}
          icon={TrendingUp}
          description={`${stats.newLeadsThisWeek} new leads this week`}
          trend={{ value: stats.newLeadsThisWeek, label: 'new this week', positive: true }}
        />
      </div>

      {/* Middle row: Task priorities + Upcoming bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task priorities */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                Open Tasks by Priority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  'urgent',
                  'high',
                  'medium',
                  'low',
                ] as (keyof TaskGroups)[]
              ).map((priority) => {
                const cfg = PRIORITY_CONFIG[priority]
                const count = tasksByPriority[priority]
                const pct = totalOpenTasks > 0 ? (count / totalOpenTasks) * 100 : 0

                return (
                  <div
                    key={priority}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3',
                      cfg.bg,
                      cfg.border
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-2 h-2 rounded-full', cfg.color)} />
                      <span className={cn('text-sm font-medium', cfg.textColor)}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', cfg.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={cn('text-sm font-bold min-w-[1.5rem] text-right', cfg.textColor)}>
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}

              {totalOpenTasks === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No open tasks — great work!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming bookings */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                Upcoming Room Bookings
                <Badge variant="secondary" className="ml-auto text-xs">
                  Next 7 days
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No bookings in the next 7 days
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                        <span className="text-[10px] font-medium text-primary leading-none">
                          {format(new Date(booking.start_time), 'MMM')}
                        </span>
                        <span className="text-base font-bold text-primary leading-none">
                          {format(new Date(booking.start_time), 'd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {booking.client.full_name}
                          {booking.client.company_name && (
                            <span className="text-muted-foreground font-normal">
                              {' '}· {booking.client.company_name}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {booking.room.name} ·{' '}
                          {format(new Date(booking.start_time), 'h:mm a')} –{' '}
                          {format(new Date(booking.end_time), 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <Badge variant="outline" className="text-[10px] mb-1">
                          {booking.duration_hours}h
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {booking.credits_used} credits
                        </span>
                      </div>
                    </div>
                  ))}
                  {upcomingBookings.length >= 20 && (
                    <a
                      href="/admin/rooms"
                      className="flex items-center justify-center gap-1 text-xs text-primary hover:underline py-2"
                    >
                      View all bookings <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
