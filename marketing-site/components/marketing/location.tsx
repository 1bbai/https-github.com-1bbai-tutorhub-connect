import { ArrowUpRight, Car, Clock, MapPin, Train } from 'lucide-react'

import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const BUILDING_IMG =
  'https://markhamoffice.com/wp-content/uploads/2024/07/3601-hwy-7.jpg'

const PERKS = [
  { icon: Car, title: 'Free on-site parking', body: 'Easy for you and your clients.' },
  { icon: Train, title: 'Minutes from transit', body: 'Close to Unionville GO & YRT.' },
  { icon: Clock, title: 'Open Mon–Sat', body: '9:30am–4pm, plus Saturdays by appointment.' },
]

export function Location() {
  return (
    <section id="location" className="section bg-background">
      <div className="page-container">
        <SectionHeading
          eyebrow="Visit us"
          title={
            <>
              Our home on{' '}
              <span className="gradient-text">Highway 7</span>
            </>
          }
          description="A professional, well-connected address in the heart of Markham — the kind of place that tells clients you mean business."
        />

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          {/* building photo */}
          <Reveal className="relative">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border shadow-strong">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BUILDING_IMG}
                alt="The Markham Office Services building at 3601 Highway 7 East"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/45 via-transparent to-transparent"
                aria-hidden="true"
              />
              {/* address chip */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-brand-950/70 px-4 py-3 backdrop-blur-xl">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
                  <MapPin className="h-4 w-4 text-gold" />
                  3601 Highway 7 East, Suite 1005
                </span>
                <a
                  href="https://maps.google.com/?q=3601+Highway+7+East+Suite+1005+Markham+ON"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-gold"
                >
                  Directions
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
            {/* floating "Est. 2005" badge */}
            <div className="absolute -right-3 -top-3 hidden rotate-3 rounded-2xl bg-gold px-4 py-3 text-center shadow-strong sm:block">
              <p className="font-display text-lg font-extrabold leading-none text-gold-foreground">
                Est. 2005
              </p>
              <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-gold-foreground/80">
                20+ years
              </p>
            </div>
          </Reveal>

          {/* details */}
          <div>
            <ul className="space-y-5">
              {PERKS.map((perk, i) => {
                const Icon = perk.icon
                return (
                  <Reveal
                    as="li"
                    key={perk.title}
                    delay={i * 80}
                    className="flex items-start gap-4"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">
                        {perk.title}
                      </h3>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {perk.body}
                      </p>
                    </div>
                  </Reveal>
                )
              })}
            </ul>

            <Reveal delay={260} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-brand-700"
              >
                Book a private tour
              </a>
              <a
                href="tel:+19053057800"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Call (905) 305-7800
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
