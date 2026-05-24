import Stripe from 'stripe'
import { stripe } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// createStripeCustomer
// ---------------------------------------------------------------------------
export async function createStripeCustomer(params: {
  email: string
  name: string
  userId: string
}): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { userId: params.userId },
  })
  return customer
}

// ---------------------------------------------------------------------------
// createSubscription
// ---------------------------------------------------------------------------
export async function createSubscription(params: {
  customerId: string
  priceId: string
  clientId: string
  planId: string
}): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })

  const supabase = createAdminClient()
  const { error } = await supabase.from('client_subscriptions').insert({
    client_id: params.clientId,
    plan_id: params.planId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: params.customerId,
    status: subscription.status === 'active' ? 'active' : 'trialing',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  })

  if (error) {
    // Attempt to clean up the Stripe subscription so state stays consistent
    await stripe.subscriptions.cancel(subscription.id)
    throw new Error(`Failed to persist subscription: ${error.message}`)
  }

  return subscription
}

// ---------------------------------------------------------------------------
// updateSubscription
// ---------------------------------------------------------------------------
export async function updateSubscription(params: {
  subscriptionId: string
  newPriceId: string
  planId: string
  clientId: string
}): Promise<Stripe.Subscription> {
  // Retrieve existing subscription to get the item ID
  const existing = await stripe.subscriptions.retrieve(params.subscriptionId)
  const itemId = existing.items.data[0]?.id
  if (!itemId) {
    throw new Error('No subscription item found on existing subscription')
  }

  const updated = await stripe.subscriptions.update(params.subscriptionId, {
    items: [{ id: itemId, price: params.newPriceId }],
    proration_behavior: 'create_prorations',
  })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('client_subscriptions')
    .update({
      plan_id: params.planId,
      status: updated.status as 'active' | 'past_due' | 'cancelled' | 'trialing',
      current_period_start: new Date(updated.current_period_start * 1000).toISOString(),
      current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', params.subscriptionId)
    .eq('client_id', params.clientId)

  if (error) {
    throw new Error(`Stripe updated but DB sync failed: ${error.message}`)
  }

  return updated
}

// ---------------------------------------------------------------------------
// cancelSubscription
// ---------------------------------------------------------------------------
export async function cancelSubscription(
  subscriptionId: string,
  clientId: string,
): Promise<Stripe.Subscription> {
  const cancelled = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('client_subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)
    .eq('client_id', clientId)

  if (error) {
    throw new Error(`Stripe cancelled but DB sync failed: ${error.message}`)
  }

  return cancelled
}

// ---------------------------------------------------------------------------
// getUpcomingInvoice
// ---------------------------------------------------------------------------
export async function getUpcomingInvoice(
  customerId: string,
  subscriptionId?: string,
): Promise<Stripe.UpcomingInvoice> {
  const params: Stripe.InvoiceRetrieveUpcomingParams = {
    customer: customerId,
  }
  if (subscriptionId) {
    params.subscription = subscriptionId
  }
  return stripe.invoices.retrieveUpcoming(params)
}
