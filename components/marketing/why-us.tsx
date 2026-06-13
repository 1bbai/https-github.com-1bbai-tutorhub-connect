import {
  BadgeCheck,
  Clock,
  MapPin,
  Sparkles,
  Wallet,
  Users,
} from 'lucide-react'

import { CountUp } from './count-up'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const REASONS = [
  {
    icon: MapPin,
    title: 'A prestige address',
    body: 'Steps from Highway 404/407 and Unionville GO — easy for clients, easier for your team.',
  },
  {
    icon: Wallet,
    title: 'All-inclusive, no surprises',
    body: 'Internet, utilities, cleaning, coffee and reception are baked into one predictable price.',
  },
  {
    icon: Clock,
    title: 'Truly flexible terms',
    body: 'Month-to-month agreements. Grow into a bigger suite or scale back whenever you need.',
  },
  {
    icon: Users,
    title: 'Concierge support',
    body: 'A friendly on-site team handling guests, deliveries and the details so you can focus.',
  },
  {
    icon: Sparkles,
    title: 'Tech that just works',
    body: 'Gigabit fibre, video-ready rooms and a portal that books, bills and tracks in seconds.',
  },
  {
    icon: BadgeCheck,
    title: 'A community to grow in',
    body: 'Network with 200+ founders, consultants and teams at curated member events.',
  },
]

const STATS = [
  { value: 200, suffix: '+', label: 'Businesses hosted' },
  { value: 50000, prefix: '', suffix: '+', label: 'Sq ft of workspace' },
  { value: 98, suffix: '%', label: 'Members who renew' },
  { value: 24, suffix: '/7', label: 'Secure access' },
]

export function WhyUs() {
  return (
    <section id="why" className="section bg-background">
      <div className="page-container">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            align="left"
            eyebrow="Why Markham Office Services"
            title={
              <>
                The professional edge,{' '}
                <span className="gradient-text">without the overhead</span>
              </>
            }
            description="We handle the building so you can run the business. Premium space, predictable cost, and a team that treats your success as the brief."
            className="lg:sticky lg:top-28"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {REASONS.map((reason, i) => {
              const Icon = reason.icon
              return (
                <Reveal
                  key={reason.title}
                  delay={i * 60}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-medium"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-foreground">
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {reason.body}
                  </p>
                </Reveal>
              )
            })}
          </div>
        </div>

        {/* Stats band */}
        <Reveal className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-8 sm:p-10">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-4xl font-bold text-white sm:text-5xl">
                  <CountUp
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </dd>
                <p className="mt-2 text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
