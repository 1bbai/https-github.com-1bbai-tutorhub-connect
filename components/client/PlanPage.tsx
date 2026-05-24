'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { ClientSubscriptionWithPlan, Plan } from '@/types/database'

interface PlanPageProps {
  subscription: ClientSubscriptionWithPlan | null
  allPlans: Plan[]
  clientId: string
}

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  trialing: { label: 'Trial', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  past_due: { label: 'Past Due', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export function PlanPage({ subscription, allPlans, clientId }: PlanPageProps) {
  const router = useRouter()
  const [changingPlanId, setChangingPlanId] = React.useState<string | null>(null)
  const [changingLoading, setChangingLoading] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [cancelLoading, setCancelLoading] = React.useState(false)

  const currentPlan = subscription?.plan ?? null
  const availablePlans = allPlans.filter((p) => p.id !== currentPlan?.id)

  async function handleChangePlan(planId: string) {
    setChangingLoading(true)
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update plan')
      }
      toast.success('Plan updated successfully.')
      setChangingPlanId(null)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update plan')
    } finally {
      setChangingLoading(false)
    }
  }

  async function handleCancelSubscription() {
    setCancelLoading(true)
    try {
      const res = await fetch('/api/billing/subscription', { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to cancel subscription')
      }
      toast.success('Subscription cancelled. You will retain access until the end of your billing period.')
      setCancelOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel subscription')
    } finally {
      setCancelLoading(false)
    }
  }

  const selectedPlan = changingPlanId ? allPlans.find((p) => p.id === changingPlanId) : null
  const isUpgrade = selectedPlan && currentPlan
    ? selectedPlan.price_monthly > currentPlan.price_monthly
    : false

  if (!subscription) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No active subscription"
        description="You don't have an active plan. Please contact support to get started."
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">My Plan</h2>
        {currentPlan && (
          <Card className="border-primary/30 bg-primary/5 ring-2 ring-primary/10">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold">{currentPlan.name}</CardTitle>
                  {currentPlan.description && (
                    <CardDescription className="mt-1">{currentPlan.description}</CardDescription>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(currentPlan.price_monthly)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  {(() => {
                    const s = statusBadge[subscription.status]
                    return s ? (
                      <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${s.className}`}>
                        {s.label}
                      </span>
                    ) : null
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {subscription.current_period_end && (
                  <span>
                    Renews: <strong className="text-foreground">{formatDate(subscription.current_period_end)}</strong>
                  </span>
                )}
                {currentPlan.meeting_room_credits_per_month !== null && (
                  <span>
                    Credits: <strong className="text-foreground">{currentPlan.meeting_room_credits_per_month} / month</strong>
                  </span>
                )}
              </div>
              {Array.isArray(currentPlan.features) && currentPlan.features.length > 0 && (
                <ul className="space-y-1.5">
                  {(currentPlan.features as string[]).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Available Plans */}
      {availablePlans.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Available Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePlans.map((plan) => {
              const isHigher = currentPlan ? plan.price_monthly > currentPlan.price_monthly : true
              return (
                <Card key={plan.id} className="hover:shadow-sm transition-shadow flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                      <p className="text-lg font-bold text-foreground shrink-0">
                        {formatCurrency(plan.price_monthly)}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                    {plan.description && (
                      <CardDescription className="text-xs">{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      {plan.meeting_room_credits_per_month !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{plan.meeting_room_credits_per_month} meeting room credits/month</span>
                        </div>
                      )}
                      {Array.isArray(plan.features) &&
                        (plan.features as string[]).slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      {Array.isArray(plan.features) && plan.features.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-5">
                          +{plan.features.length - 3} more features
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isHigher ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setChangingPlanId(plan.id)}
                    >
                      {isHigher ? 'Upgrade' : 'Downgrade'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Cancel Subscription */}
      <div className="border border-destructive/30 rounded-xl p-6 bg-destructive/5 space-y-3">
        <h3 className="text-base font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Cancelling your subscription will stop automatic renewals. You will retain access to all features until the end of your current billing period.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setCancelOpen(true)}
        >
          Cancel Subscription
        </Button>
      </div>

      {/* Change Plan Confirm Dialog */}
      <ConfirmDialog
        open={!!changingPlanId}
        onOpenChange={(open) => { if (!open) setChangingPlanId(null) }}
        title={`${isUpgrade ? 'Upgrade' : 'Downgrade'} to ${selectedPlan?.name ?? 'new plan'}?`}
        description={`Your subscription will be updated to the ${selectedPlan?.name} plan at ${selectedPlan ? formatCurrency(selectedPlan.price_monthly) : ''}/month. Prorations will be applied.`}
        confirmLabel={isUpgrade ? 'Upgrade Plan' : 'Downgrade Plan'}
        loading={changingLoading}
        onConfirm={() => changingPlanId ? handleChangePlan(changingPlanId) : undefined}
      />

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription? You will lose access to all plan features at the end of your billing period. This action cannot be undone."
        confirmLabel="Yes, Cancel Subscription"
        variant="destructive"
        loading={cancelLoading}
        onConfirm={handleCancelSubscription}
      />
    </div>
  )
}
