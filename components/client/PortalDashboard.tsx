'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  CreditCard,
  Wrench,
  HeadphonesIcon,
  DollarSign,
  FileText,
  CalendarClock,
  ChevronRight,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import type {
  User,
  ClientSubscriptionWithPlan,
  ClientServiceWithService,
  ServiceCategory,
} from '@/types/database'

interface BookingWithRoom {
  id: string
  room_id: string
  start_time: string
  end_time: string
  duration_hours: number
  credits_used: number
  status: string
  notes: string | null
  cancelled_at: string | null
  created_at: string
  room: {
    id: string
    name: string
    capacity: number | null
    credits_per_hour: number | null
  } | null
}

interface PortalDashboardProps {
  profile: User
  subscription: ClientSubscriptionWithPlan | null
  activeServices: ClientServiceWithService[]
  upcomingBookings: BookingWithRoom[]
  openTasksCount: number
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const categoryIcon: Record<ServiceCategory, React.ElementType> = {
  virtual_office: Building2,
  loan_assistance: DollarSign,
  business_registration: FileText,
}

const serviceStatusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
}

export function PortalDashboard({
  profile,
  subscription,
  activeServices,
  upcomingBookings,
  openTasksCount,
}: PortalDashboardProps) {
  const router = useRouter()
  const [cancelBookingId, setCancelBookingId] = React.useState<string | null>(null)
  const [cancelLoading, setCancelLoading] = React.useState(false)

  const firstName = profile.full_name.split(' ')[0]
  const plan = subscription?.plan ?? null
  const creditsRemaining = subscription?.credits_remaining ?? 0
  const totalCredits = plan?.meeting_room_credits_per_month ?? 0
  const creditsUsed = totalCredits - creditsRemaining
  const creditProgress = totalCredits > 0 ? Math.min(100, Math.max(0, (creditsUsed / totalCredits) * 100)) : 0

  async function handleCancelBooking() {
    if (!cancelBookingId) return
    setCancelLoading(true)
    try {
      const res = await fetch(`/api/bookings/${cancelBookingId}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to cancel booking')
      }
      toast.success('Booking cancelled and credits refunded.')
      setCancelBookingId(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel booking')
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {firstName}!
        </h2>
        <p className="text-muted-foreground mt-1">
          {plan ? `You're on the ${plan.name} plan` : 'Welcome to your client portal'}
        </p>
      </div>

      {/* Credits Card */}
      {subscription && plan && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Meeting Room Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-primary">{creditsRemaining}</span>
              <span className="text-muted-foreground pb-1.5 text-sm">
                credits remaining
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {plan.name} — {totalCredits} credits per month
            </p>
            <Progress value={creditProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {creditsUsed} credits used of {totalCredits}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Building2, label: 'Book a Room', href: '/rooms' },
            { icon: CreditCard, label: 'View Invoices', href: '/billing' },
            { icon: Wrench, label: 'My Services', href: '/services' },
            { icon: HeadphonesIcon, label: 'Get Support', href: '/support' },
          ].map(({ icon: Icon, label, href }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-center group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Services */}
      {activeServices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Active Services
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-primary"
              onClick={() => router.push('/services')}
            >
              View all <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeServices.map((cs) => {
              const Icon = categoryIcon[cs.service.category] ?? Wrench
              return (
                <Card key={cs.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {cs.service.name}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {cs.service.category.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${serviceStatusColor[cs.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {cs.status}
                      </span>
                    </div>
                    {cs.expiry_date && (
                      <p className="text-xs text-muted-foreground mt-2.5">
                        Expires: {formatDate(cs.expiry_date)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Upcoming Bookings
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2 text-primary"
            onClick={() => router.push('/rooms')}
          >
            Book a room <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {upcomingBookings.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming bookings"
            description="Book a meeting room to get started."
            action={{ label: 'Book a Room', onClick: () => router.push('/rooms') }}
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {booking.room?.name ?? 'Meeting Room'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(booking.start_time)} &middot; {booking.duration_hours}h &middot; {booking.credits_used} credits
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setCancelBookingId(booking.id)}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Open Tasks */}
      {openTasksCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">
              You have {openTasksCount} open support request{openTasksCount !== 1 ? 's' : ''}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-800 hover:bg-amber-100 h-7 text-xs"
              onClick={() => router.push('/support')}
            >
              View requests
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancel Booking Confirm Dialog */}
      <ConfirmDialog
        open={!!cancelBookingId}
        onOpenChange={(open) => { if (!open) setCancelBookingId(null) }}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? Your credits will be refunded."
        confirmLabel="Cancel Booking"
        variant="destructive"
        loading={cancelLoading}
        onConfirm={handleCancelBooking}
      />
    </div>
  )
}
