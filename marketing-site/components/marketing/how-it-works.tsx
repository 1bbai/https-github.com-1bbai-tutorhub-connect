import { ClipboardList, KeyRound, Rocket } from 'lucide-react'

import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const STEPS = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Choose your plan',
    body: 'Tell us your team size and how you like to work. We will recommend the right mix of space and credits.',
  },
  {
    icon: KeyRound,
    step: '02',
    title: 'Tour & sign in minutes',
    body: 'Book a private tour, pick your office, and sign a simple month-to-month agreement online.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Move in & get to work',
    body: 'Walk into a ready workspace. Book rooms, manage billing and request support from your portal.',
  },
]

export function HowItWorks() {
  return (
    <section className="section bg-brand-50/60">
      <div className="page-container">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Up and running in{' '}
              <span className="gradient-text">three simple steps</span>
            </>
          }
          description="No brokers, no build-outs, no months of waiting. Just a professional home for your business — fast."
        />

        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* connecting line */}
          <div
            className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent md:block"
            aria-hidden="true"
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <Reveal
                key={step.step}
                delay={i * 110}
                className="relative flex flex-col items-center text-center"
              >
                <span className="relative grid h-16 w-16 place-items-center rounded-2xl border border-brand-200 bg-white text-brand-600 shadow-soft">
                  <Icon className="h-7 w-7" />
                  <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-gold text-[0.7rem] font-bold text-gold-foreground shadow-soft">
                    {step.step}
                  </span>
                </span>
                <h3 className="mt-6 font-display text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
