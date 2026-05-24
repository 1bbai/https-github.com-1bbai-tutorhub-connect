import { stripe } from './client'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { creditCredits } from '@/lib/credits/credit-engine'

// ---------------------------------------------------------------------------
// handleWebhookEvent
// ---------------------------------------------------------------------------
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabase = createAdminClient()

  switch (event.type) {
    // -----------------------------------------------------------------------
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice

      // 1. Find client by stripe_customer_id
      const { data: sub, error: subError } = await supabase
        .from('client_subscriptions')
        .select('client_id, plan_id, plans(meeting_room_credits_per_month)')
        .eq('stripe_customer_id', invoice.customer as string)
        .maybeSingle()

      if (subError || !sub) break

      const clientId = sub.client_id

      // 2. Upsert invoice record in invoices table
      const { error: invError } = await supabase.from('invoices').upsert(
        {
          client_id: clientId,
          stripe_invoice_id: invoice.id,
          amount_cents: invoice.amount_paid,
          currency: invoice.currency,
          status: 'paid',
          description: invoice.description ?? 'Monthly subscription',
          invoice_pdf_url: invoice.invoice_pdf ?? null,
          period_start: invoice.period_start
            ? new Date(invoice.period_start * 1000).toISOString()
            : null,
          period_end: invoice.period_end
            ? new Date(invoice.period_end * 1000).toISOString()
            : null,
        },
        { onConflict: 'stripe_invoice_id' },
      )

      if (invError) {
        console.error('invoice.paid – upsert invoice error:', invError.message)
      }

      // 3. Get monthly credit allocation from plan
      const planData = sub.plans as { meeting_room_credits_per_month: number | null } | null
      const monthlyCredits = planData?.meeting_room_credits_per_month ?? 0

      if (monthlyCredits > 0) {
        // 4. Update credits_remaining directly
        const { error: creditUpdateError } = await supabase
          .from('client_subscriptions')
          .update({
            credits_remaining: monthlyCredits,
            updated_at: new Date().toISOString(),
          })
          .eq('client_id', clientId)

        if (creditUpdateError) {
          console.error('invoice.paid – credits update error:', creditUpdateError.message)
        }

        // 5. Log credit_ledger entry
        await creditCredits({
          clientId,
          amount: monthlyCredits,
          reason: 'Monthly plan renewal',
        })
      }

      // 6. Create in-app notification
      await supabase.from('notifications').insert({
        user_id: clientId,
        type: 'invoice_paid',
        title: 'Invoice Paid',
        message: `Your invoice of ${formatCurrency(invoice.amount_paid, invoice.currency)} has been paid. Your meeting room credits have been renewed.`,
        action_url: '/client/billing',
      })

      break
    }

    // -----------------------------------------------------------------------
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice

      const { data: sub } = await supabase
        .from('client_subscriptions')
        .select('client_id')
        .eq('stripe_customer_id', invoice.customer as string)
        .maybeSingle()

      if (!sub) break

      const clientId = sub.client_id

      // Upsert invoice as open/past-due
      await supabase.from('invoices').upsert(
        {
          client_id: clientId,
          stripe_invoice_id: invoice.id,
          amount_cents: invoice.amount_due,
          currency: invoice.currency,
          status: 'open',
          description: invoice.description ?? 'Monthly subscription',
          invoice_pdf_url: invoice.invoice_pdf ?? null,
          period_start: invoice.period_start
            ? new Date(invoice.period_start * 1000).toISOString()
            : null,
          period_end: invoice.period_end
            ? new Date(invoice.period_end * 1000).toISOString()
            : null,
        },
        { onConflict: 'stripe_invoice_id' },
      )

      // Update subscription status to past_due
      await supabase
        .from('client_subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('client_id', clientId)

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: clientId,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: `Your payment of ${formatCurrency(invoice.amount_due, invoice.currency)} failed. Please update your payment method to avoid service interruption.`,
        action_url: '/client/billing',
      })

      break
    }

    // -----------------------------------------------------------------------
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('client_subscriptions')
        .update({
          status: subscription.status as 'active' | 'past_due' | 'cancelled' | 'trialing',
          current_period_start: new Date(
            subscription.current_period_start * 1000,
          ).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)

      break
    }

    // -----------------------------------------------------------------------
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('client_subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', subscription.id)

      break
    }

    // -----------------------------------------------------------------------
    case 'payment_method.attached': {
      const pm = event.data.object as Stripe.PaymentMethod

      if (!pm.customer) break

      // Look up client_id via stripe_customer_id
      const { data: sub } = await supabase
        .from('client_subscriptions')
        .select('client_id')
        .eq('stripe_customer_id', pm.customer as string)
        .maybeSingle()

      if (!sub) break

      const card = pm.card

      await supabase.from('payment_methods').upsert(
        {
          client_id: sub.client_id,
          stripe_payment_method_id: pm.id,
          brand: card?.brand ?? null,
          last4: card?.last4 ?? null,
          exp_month: card?.exp_month ?? null,
          exp_year: card?.exp_year ?? null,
          is_default: false,
        },
        { onConflict: 'stripe_payment_method_id' },
      )

      break
    }

    // -----------------------------------------------------------------------
    case 'payment_method.detached': {
      const pm = event.data.object as Stripe.PaymentMethod

      await supabase
        .from('payment_methods')
        .delete()
        .eq('stripe_payment_method_id', pm.id)

      break
    }

    // -----------------------------------------------------------------------
    case 'setup_intent.succeeded': {
      // The payment_method.attached event is the canonical signal — no action needed here.
      break
    }

    default:
      break
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(amountCents: number, currency: string | null): string {
  const formatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: (currency ?? 'cad').toUpperCase(),
  })
  return formatter.format(amountCents / 100)
}
