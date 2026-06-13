import { ArrowRight, Award, Building, CalendarRange, Quote } from 'lucide-react'

import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const PROOF = [
  {
    icon: CalendarRange,
    stat: 'Est. 2005',
    label: 'Serving Markham businesses for over 20 years',
  },
  {
    icon: Award,
    stat: 'MBT Member',
    label: 'Proud member of the Markham Board of Trade',
  },
  {
    icon: Building,
    stat: 'Executive + Virtual',
    label: 'Office suites and virtual services under one roof',
  },
]

export function Testimonials() {
  return (
    <section className="section bg-brand-950">
      <div className="page-container">
        <SectionHeading
          tone="light"
          eyebrow="Trusted in Markham"
          title={
            <>
              A trusted business home{' '}
              <span className="text-gradient-gold">since 2005</span>
            </>
          }
          description="Founded as a property management company and grown into one of Markham's established providers of executive office suites and virtual office services."
        />

        <Reveal className="mx-auto mt-12 max-w-3xl text-center">
          <Quote className="mx-auto h-10 w-10 text-gold/70" />
          <blockquote className="mt-5 font-display text-xl font-medium leading-relaxed text-white sm:text-2xl">
            &ldquo;Our mission is to let your company focus on its core
            competencies — we provide fully furnished offices with a
            well-appointed conference room, meeting room and reception area,
            backed by friendly staff services.&rdquo;
          </blockquote>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
            MarkhamOffice.com
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {PROOF.map((item, i) => {
            const Icon = item.icon
            return (
              <Reveal
                key={item.stat}
                delay={i * 90}
                className="group flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="mt-4 font-display text-xl font-bold text-white">
                  {item.stat}
                </p>
                <p className="mt-1.5 text-sm text-white/60">{item.label}</p>
              </Reveal>
            )
          })}
        </div>

        <Reveal className="mt-12 text-center">
          <a
            href="#contact"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-gold-foreground shadow-[0_12px_30px_-8px_hsl(var(--gold)/0.8)] transition-all hover:-translate-y-0.5"
          >
            Book your private tour
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
