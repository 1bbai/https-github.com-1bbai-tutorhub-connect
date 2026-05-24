import Stripe from 'stripe'
import { stripe } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

// ---------------------------------------------------------------------------
// createSetupIntent
// ---------------------------------------------------------------------------
export async function createSetupIntent(
  customerId: string,
): Promise<{ clientSecret: string }> {
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
  })

  if (!setupIntent.client_secret) {
    throw new Error('SetupIntent created but no client_secret returned')
  }

  return { clientSecret: setupIntent.client_secret }
}

// ---------------------------------------------------------------------------
// listPaymentMethods
// ---------------------------------------------------------------------------
export async function listPaymentMethods(
  customerId: string,
): Promise<Stripe.PaymentMethod[]> {
  const result = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })
  return result.data
}

// ---------------------------------------------------------------------------
// detachPaymentMethod
// ---------------------------------------------------------------------------
export async function detachPaymentMethod(
  paymentMethodId: string,
): Promise<void> {
  await stripe.paymentMethods.detach(paymentMethodId)

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('stripe_payment_method_id', paymentMethodId)

  if (error) {
    throw new Error(`Stripe detached but DB delete failed: ${error.message}`)
  }
}

// ---------------------------------------------------------------------------
// setDefaultPaymentMethod
// ---------------------------------------------------------------------------
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string,
): Promise<void> {
  // Update default on the Stripe customer object
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  const supabase = createAdminClient()

  // Fetch client_id for this customer from our subscriptions table
  const { data: sub, error: subError } = await supabase
    .from('client_subscriptions')
    .select('client_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (subError) {
    throw new Error(`DB lookup failed: ${subError.message}`)
  }

  if (!sub) {
    // Nothing to update in payment_methods without a client_id
    return
  }

  const clientId = sub.client_id

  // Clear existing defaults for this client
  const { error: clearError } = await supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('client_id', clientId)

  if (clearError) {
    throw new Error(`Failed to clear existing defaults: ${clearError.message}`)
  }

  // Set the new default
  const { error: setError } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('client_id', clientId)
    .eq('stripe_payment_method_id', paymentMethodId)

  if (setError) {
    throw new Error(`Failed to set new default: ${setError.message}`)
  }
}
