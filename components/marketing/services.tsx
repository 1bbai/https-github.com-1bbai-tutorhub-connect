import {
  Building2,
  CalendarClock,
  Coffee,
  Headset,
  Mails,
  MonitorSmartphone,
  ArrowUpRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const SERVICES = [
  {
    icon: Building2,
    title: 'Private offices',
    description:
      'Fully furnished, lockable offices for 1–20 people. Move in with nothing but your laptop.',
    featured: true,
    points: ['Furnished & cabled', 'Your company name on the door', 'Scale up or down monthly'],
  },
  {
    icon: CalendarClock,
    title: 'Meeting rooms',
    description:
      'Book boardrooms and huddle spaces by the hour — instantly, from the portal.',
    points: ['15 rooms, 2–24 seats'],
  },
  {
    icon: Mails,
    title: 'Virtual office',
    description:
      'A prestige Markham business address with mail handling and call answering.',
    points: ['Mail scanning & forwarding'],
  },
  {
    icon: Headset,
    title: 'Reception & admin',
    description:
      'A professional front desk greeting your guests and handling your calls.',
    points: ['Live receptionist'],
  },
  {
    icon: Coffee,
    title: 'Coworking & day passes',
    description:
      'Hot desks and dedicated desks in a bright, design-led lounge. Barista coffee included.',
    points: ['Drop in or go monthly'],
  },
  {
    icon: MonitorSmartphone,
    title: 'The client portal',
    description:
      'Bookings, billing, credits and support — all self-serve in one tidy dashboard.',
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
          description="From a single hot desk to a full private suite — pick exactly what you need and let us run the rest."
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
                    Tour a private office
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
