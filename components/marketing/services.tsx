import {
  Building2,
  CalendarClock,
  FileCheck2,
  Headset,
  Mailbox,
  MonitorSmartphone,
  ArrowUpRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const SERVICES = [
  {
    icon: Mailbox,
    title: 'Virtual office',
    description:
      'A prestige Markham business address with professional mail handling and weekly forwarding — work from anywhere, look established.',
    featured: true,
    points: [
      'Prestigious business address',
      'Mail handling & weekly forwarding',
      'Member rates on meeting rooms',
    ],
  },
  {
    icon: Building2,
    title: 'Executive office suites',
    description:
      'Fully furnished private offices from 150–300 sq ft, most with a scenic view of the Markham Civic Centre.',
    points: ['Furnished & move-in ready'],
  },
  {
    icon: CalendarClock,
    title: 'Meeting & conference rooms',
    description:
      'Well-appointed boardroom and meeting room at the best member rate in Markham — book by the hour.',
    points: ['1 free hour every month'],
  },
  {
    icon: FileCheck2,
    title: 'Business registration',
    description:
      'Register your company — from sole proprietorship to full provincial or federal incorporation. Free with a virtual office plan.',
    points: ['FREE with virtual office'],
  },
  {
    icon: Headset,
    title: 'Reception & staff services',
    description:
      'An attractive, functional reception area and friendly staff to greet your guests and support your day.',
    points: ['Professional front desk'],
  },
  {
    icon: MonitorSmartphone,
    title: 'The client portal',
    description:
      'Bookings, billing and support — all self-serve in one tidy dashboard, available to every member.',
    points: ['Book, pay & track in seconds'],
  },
]

export function Services() {
  return (
    <section id="services" className="section bg-background">
      <div className="page-container">
        <SectionHeading
          eyebrow="What we offer"
          title={
            <>
              Everything your business needs,{' '}
              <span className="gradient-text">under one roof</span>
            </>
          }
          description="From a prestige business address to a full private suite — pick exactly what you need and let us run the rest."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => {
            const Icon = service.icon
            return (
              <Reveal
                key={service.title}
                delay={i * 70}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-strong',
                  service.featured
                    ? 'border-brand-700/40 bg-gradient-to-br from-brand-600 to-brand-800 text-white sm:row-span-2 sm:justify-between'
                    : 'border-border bg-card hover:border-brand-300'
                )}
              >
                {/* hover glow */}
                <div
                  className={cn(
                    'pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-300',
                    service.featured
                      ? 'bg-gold/30 opacity-60'
                      : 'bg-brand-300/30 opacity-0 group-hover:opacity-100'
                  )}
                  aria-hidden="true"
                />

                <div>
                  <span
                    className={cn(
                      'grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                      service.featured
                        ? 'bg-white/15 text-white'
                        : 'bg-brand-50 text-brand-600'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>

                  <h3
                    className={cn(
                      'mt-5 font-display text-xl font-bold',
                      service.featured ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {service.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-2 text-sm leading-relaxed',
                      service.featured ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    {service.description}
                  </p>
                </div>

                <ul
                  className={cn(
                    'mt-5 space-y-1.5 text-sm',
                    service.featured ? 'text-white/85' : 'text-foreground/80'
                  )}
                >
                  {service.points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          service.featured ? 'bg-gold' : 'bg-brand-500'
                        )}
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                {service.featured && (
                  <a
                    href="#contact"
                    className="mt-7 inline-flex items-center gap-1.5 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-transform hover:translate-x-0.5"
                  >
                    Start a virtual office
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
