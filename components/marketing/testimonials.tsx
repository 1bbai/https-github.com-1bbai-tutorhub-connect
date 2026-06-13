import { Quote, Star } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const TESTIMONIALS = [
  {
    quote:
      'We moved Horizon Tech in over a weekend and never looked back. Clients are genuinely impressed the moment they walk in, and booking a boardroom takes ten seconds.',
    name: 'Priya Sharma',
    role: 'Founder, Horizon Tech Solutions',
    initials: 'PS',
    accent: 'from-brand-500 to-brand-700',
  },
  {
    quote:
      'The all-inclusive pricing made budgeting effortless. No more chasing utility bills or IT — we just focus on growing Golden Dragon Foods.',
    name: 'Mike Chen',
    role: 'Director, Golden Dragon Foods',
    initials: 'MC',
    accent: 'from-info to-brand-600',
  },
  {
    quote:
      'The reception team treats our patients and partners like their own. For Nova Health, that first impression is everything — and it shows.',
    name: 'Fatima Al-Rashid',
    role: 'Principal, Nova Health Consulting',
    initials: 'FA',
    accent: 'from-brand-400 to-brand-700',
  },
]

export function Testimonials() {
  return (
    <section className="section bg-brand-950">
      <div className="page-container">
        <SectionHeading
          tone="light"
          eyebrow="Loved by members"
          title={
            <>
              Don&apos;t take our word for it —{' '}
              <span className="text-gradient-gold">take theirs</span>
            </>
          }
          description="A 4.9/5 average rating from the businesses that call Markham Office Services home."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 90}
              className="group relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
            >
              <Quote className="h-8 w-8 text-gold/70" />

              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>

              <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-white/80">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                <span
                  className={cn(
                    'grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br font-display text-sm font-bold text-white',
                    t.accent
                  )}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-white">
                    {t.name}
                  </p>
                  <p className="text-xs text-white/55">{t.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
