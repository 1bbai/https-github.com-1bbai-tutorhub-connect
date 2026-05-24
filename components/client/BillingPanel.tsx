'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Download,
  FileText,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PaymentMethod, Invoice, ClientSubscriptionWithPlan } from '@/types/database'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

interface BillingPanelProps {
  clientId: string
  paymentMethods: PaymentMethod[]
  invoices: Invoice[]
  subscription: ClientSubscriptionWithPlan | null
}

const invoiceStatusStyle: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  open: 'bg-amber-100 text-amber-700 border-amber-200',
  void: 'bg-gray-100 text-gray-500 border-gray-200',
  uncollectible: 'bg-red-100 text-red-700 border-red-200',
}

function brandLabel(brand: string | null): string {
  if (!brand) return 'Card'
  const b = brand.toLowerCase()
  if (b === 'visa') return 'Visa'
  if (b === 'mastercard') return 'Mastercard'
  if (b === 'amex') return 'Amex'
  if (b === 'discover') return 'Discover'
  return brand.charAt(0).toUpperCase() + brand.slice(1)
}

// ─── Add Card Form (inside Stripe Elements) ────────────────────────────────────

function AddCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing?added=1`,
      },
    })

    if (submitError) {
      setError(submitError.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !stripe}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Card'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─── Add Card Dialog ───────────────────────────────────────────────────────────

function AddCardDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [fetchError, setFetchError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setClientSecret(null)
      setFetchError(null)
      return
    }
    setLoading(true)
    fetch('/api/billing/setup-intent', { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Failed to initialize payment form')
        }
        return res.json()
      })
      .then((data) => setClientSecret(data.clientSecret))
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Enter your card details below. Your card will be securely saved for future payments.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {fetchError && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {fetchError}
          </p>
        )}

        {clientSecret && !loading && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: 'stripe' } }}
          >
            <AddCardForm
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onCancel={() => onOpenChange(false)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Payment Methods Tab ───────────────────────────────────────────────────────

function PaymentMethodsTab({
  paymentMethods,
  onRefresh,
}: {
  paymentMethods: PaymentMethod[]
  onRefresh: () => void
}) {
  const [addCardOpen, setAddCardOpen] = React.useState(false)
  const [removeId, setRemoveId] = React.useState<string | null>(null)
  const [removeLoading, setRemoveLoading] = React.useState(false)
  const [defaultLoading, setDefaultLoading] = React.useState<string | null>(null)

  async function handleRemove() {
    if (!removeId) return
    setRemoveLoading(true)
    try {
      const res = await fetch('/api/billing/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: removeId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to remove card')
      }
      toast.success('Payment method removed.')
      setRemoveId(null)
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove card')
    } finally {
      setRemoveLoading(false)
    }
  }

  async function handleSetDefault(pmId: string) {
    setDefaultLoading(pmId)
    try {
      const res = await fetch('/api/billing/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: pmId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to set default')
      }
      toast.success('Default payment method updated.')
      onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to set default')
    } finally {
      setDefaultLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Saved Cards</h3>
        <Button size="sm" onClick={() => setAddCardOpen(true)} className="h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Payment Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment methods"
          description="Add a card to enable automatic billing."
          action={{ label: 'Add Card', onClick: () => setAddCardOpen(true) }}
          className="py-8"
        />
      ) : (
        <div className="space-y-2">
          {paymentMethods.map((pm) => (
            <Card key={pm.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {brandLabel(pm.brand)} ending in {pm.last4 ?? '****'}
                      </span>
                      {pm.is_default && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires {pm.exp_month?.toString().padStart(2, '0')}/{pm.exp_year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!pm.is_default && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      disabled={defaultLoading === pm.stripe_payment_method_id}
                      onClick={() => handleSetDefault(pm.stripe_payment_method_id)}
                    >
                      {defaultLoading === pm.stripe_payment_method_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5 mr-1" />
                          Set Default
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setRemoveId(pm.stripe_payment_method_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddCardDialog
        open={addCardOpen}
        onOpenChange={setAddCardOpen}
        onSuccess={() => {
          setAddCardOpen(false)
          toast.success('Payment method saved.')
          onRefresh()
        }}
      />

      <ConfirmDialog
        open={!!removeId}
        onOpenChange={(open) => { if (!open) setRemoveId(null) }}
        title="Remove Payment Method"
        description="Are you sure you want to remove this card? This action cannot be undone."
        confirmLabel="Remove Card"
        variant="destructive"
        loading={removeLoading}
        onConfirm={handleRemove}
      />
    </div>
  )
}

// ─── Invoice History Tab ───────────────────────────────────────────────────────

function InvoiceHistoryTab({
  invoices,
  subscription,
}: {
  invoices: Invoice[]
  subscription: ClientSubscriptionWithPlan | null
}) {
  return (
    <div className="space-y-4">
      {/* Upcoming invoice preview */}
      {subscription && subscription.current_period_end && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Upcoming Payment</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Next payment due: {formatDate(subscription.current_period_end)}
              </p>
            </div>
            <p className="text-lg font-bold text-primary shrink-0">
              {formatCurrency(subscription.plan.price_monthly)}
            </p>
          </CardContent>
        </Card>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Your invoices will appear here once your first payment is processed."
          className="py-8"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Description
                </th>
                <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(inv.created_at)}
                  </td>
                  <td className="py-3 px-3 text-foreground max-w-[200px] truncate">
                    {inv.description ?? 'Subscription payment'}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-foreground whitespace-nowrap">
                    {formatCurrency(inv.amount_cents / 100, inv.currency ?? 'CAD')}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${invoiceStatusStyle[inv.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {inv.invoice_pdf_url ? (
                      <a
                        href={inv.invoice_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function BillingPanel({
  clientId,
  paymentMethods: initialPaymentMethods,
  invoices,
  subscription,
}: BillingPanelProps) {
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = React.useState(initialPaymentMethods)

  function handleRefresh() {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Billing</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your payment methods and view invoice history.
        </p>
      </div>

      <Tabs defaultValue="payment-methods">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoice History</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethodsTab
            paymentMethods={paymentMethods}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoiceHistoryTab invoices={invoices} subscription={subscription} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
