import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const PLANS = [
  {
    name: 'Virtual Office',
    price: 99,
    tagline: 'A prestige address, none of the rent.',
    features: [
      'Markham business address',
      'Mail handling & scanning',
      'Local business phone number',
      '4 hrs meeting-room credits / mo',
      'Member rate on day passes',
    ],
    cta: 'Get the address',
  },
  {
    name: 'Flex Membership',
    price: 299,
    tagline: 'Coworking that flexes with your week.',
    featured: true,
    features: [
      'Unlimited coworking access',
      'A dedicated desk on demand',
      '12 hrs meeting-room credits / mo',
      'Business address & mail',
      'Member events & community',
      'Priority room booking',
    ],
    cta: 'Start flex membership',
  },
  {
    name: 'Private Office',
    price: 749,
    tagline: 'Your own lockable, branded suite.',
    features: [
      'Furnished private office',
      'Your name on the door',
      '20 hrs meeting-room credits / mo',
      'All utilities & cleaning',
      'Reception & call answering',
      '24/7 secure access',
    ],
    cta: 'Tour a private office',
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="section bg-background">
      <div className="page-container">
        <SectionHeading
          eyebrow="Membership plans"
          title={
            <>
              Simple pricing,{' '}
              <span className="gradient-text">everything included</span>
            </>
          }
          description="Transparent monthly rates in CAD. No setup fees, no long lock-ins — upgrade, downgrade or pause as your business grows."
        />

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal
              key={plan.name}
              delay={i * 90}
              className={cn(
                'relative flex flex-col rounded-3xl border p-8 transition-all duration-300',
                plan.featured
                  ? 'border-transparent bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white shadow-strong lg:-mt-4 lg:mb-[-1rem]'
                  : 'border-border bg-card hover:-translate-y-1 hover:border-brand-300 hover:shadow-medium'
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gold px-4 py-1 text-xs font-bold text-gold-foreground shadow-soft">
                  <Sparkles className="h-3.5 w-3.5" />
                  Most popular
                </span>
              )}

              <h3
                className={cn(
                  'font-display text-lg font-bold',
                  plan.featured ? 'text-white' : 'text-foreground'
                )}
              >
                {plan.name}
              </h3>
              <p
                className={cn(
                  'mt-1 text-sm',
                  plan.featured ? 'text-white/70' : 'text-muted-foreground'
                )}
              >
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-end gap-1">
                <span
                  className={cn(
                    'font-display text-5xl font-bold',
                    plan.featured ? 'text-white' : 'text-foreground'
                  )}
                >
                  ${plan.price}
                </span>
                <span
                  className={cn(
                    'mb-1.5 text-sm',
                    plan.featured ? 'text-white/60' : 'text-muted-foreground'
                  )}
                >
                  /month
                </span>
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={cn(
                        'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full',
                        plan.featured
                          ? 'bg-gold/20 text-gold'
                          : 'bg-brand-50 text-brand-600'
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span
                      className={cn(
                        plan.featured ? 'text-white/85' : 'text-foreground/80'
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={cn(
                  'mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5',
                  plan.featured
                    ? 'bg-gold text-gold-foreground shadow-[0_10px_28px_-8px_hsl(var(--gold)/0.8)]'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                )}
              >
                {plan.cta}
              </a>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need a custom suite for a larger team?{' '}
          <Link
            href="/login"
            className="font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            Talk to our team
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
