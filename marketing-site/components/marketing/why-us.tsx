import {
  BadgeCheck,
  Clock,
  Mailbox,
  MapPin,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { CountUp } from './count-up'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const REASONS = [
  {
    icon: MapPin,
    title: 'A prestige Highway 7 address',
    body: 'Central Markham at 3601 Highway 7 East, with scenic Civic Centre views and easy 404/407 access.',
  },
  {
    icon: Wallet,
    title: 'Free business registration',
    body: 'Register your company free of charge — sole proprietorship to full incorporation — with a virtual office plan.',
  },
  {
    icon: Clock,
    title: 'Trusted since 2005',
    body: 'Over 20 years helping Markham businesses start and grow, and a proud Markham Board of Trade member.',
  },
  {
    icon: Mailbox,
    title: 'Mail handled for you',
    body: 'Professional mail handling with weekly forwarding, so nothing important ever slips through.',
  },
  {
    icon: Sparkles,
    title: 'Fully furnished & serviced',
    body: 'Move-in-ready suites with a well-appointed conference room, reception area and staff services.',
  },
  {
    icon: BadgeCheck,
    title: 'Best meeting-room rates',
    body: 'Member-exclusive rates — the best in Markham — plus one free meeting-room hour every month.',
  },
]

const STATS = [
  { value: 20, suffix: '+', label: 'Years in business' },
  { value: 300, suffix: '', label: 'Sq ft executive suites' },
  { value: 1, suffix: '', label: 'Free meeting hour / mo' },
  { value: 6, suffix: '', label: 'Days open weekly' },
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
                  <CountUp value={stat.value} suffix={stat.suffix} />
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
