import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'

import { CountUp } from './count-up'

const HERO_STATS = [
  { value: 20, suffix: '+', label: 'Years serving Markham' },
  { value: 300, suffix: '', label: 'Sq ft private suites' },
  { value: 100, suffix: '%', label: 'Furnished & serviced' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-950 pt-32 pb-24 text-white sm:pt-36 lg:pt-44 lg:pb-32">
      {/* Animated aurora background */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="aurora-blob left-[-10%] top-[-10%] h-[34rem] w-[34rem] animate-aurora bg-brand-600/40" />
        <div
          className="aurora-blob right-[-12%] top-[6%] h-[30rem] w-[30rem] animate-aurora bg-info/30"
          style={{ animationDelay: '-6s' }}
        />
        <div
          className="aurora-blob bottom-[-18%] left-[28%] h-[28rem] w-[28rem] animate-aurora bg-gold/20"
          style={{ animationDelay: '-12s' }}
        />
      </div>
      {/* Grid + vignette */}
      <div className="absolute inset-0 -z-10 bg-grid mask-fade opacity-60" aria-hidden="true" />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/0 via-brand-950/40 to-brand-950"
        aria-hidden="true"
      />

      <div className="page-container grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Helping Markham businesses start &amp; grow since 2005
          </span>

          <h1 className="display mt-6 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Workspaces that make your business{' '}
            <span className="text-gradient-gold">look the part</span>.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-white/70">
            A prestige Markham business address, fully-furnished executive
            suites, and member-rate meeting rooms — plus{' '}
            <span className="font-semibold text-white">free company
            registration</span> when you start a virtual office. Everything you
            need to launch and grow, in one place.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contact"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-gold-foreground shadow-[0_12px_34px_-8px_hsl(var(--gold)/0.75)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_hsl(var(--gold)/0.85)]"
            >
              Book a private tour
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              href="https://my.markhamoffice.com/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              <PlayCircle className="h-5 w-5 text-white/80" />
              Client portal
            </Link>
          </div>

          {/* Trust signals */}
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/65">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-300" />
              3601 Highway 7 E, Markham
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-300" />
              Markham Board of Trade member
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </span>
              Trusted since 2005
            </span>
          </div>

          {/* Stat row */}
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-7">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-3xl font-bold text-white">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
                <p className="mt-1 text-xs text-white/55">{stat.label}</p>
              </div>
            ))}
          </dl>
        </div>

        {/* Floating glass mockup */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="animate-float-slow">
            <div className="glass-card relative overflow-hidden p-5 shadow-strong">
              {/* mock window chrome */}
              <div className="flex items-center gap-1.5 pb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                <span className="ml-3 text-xs text-white/50">
                  my.markhamoffice.com
                </span>
              </div>

              {/* booking card */}
              <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white/80">
                    Boardroom · 12th Floor
                  </p>
                  <span className="rounded-full bg-green-400/20 px-2.5 py-0.5 text-[0.65rem] font-semibold text-green-300">
                    Available
                  </span>
                </div>
                <p className="mt-3 font-display text-2xl font-bold">
                  Tomorrow · 10:00–11:30
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {['JM', 'AK', 'RP', '+4'].map((p) => (
                      <span
                        key={p}
                        className="grid h-7 w-7 place-items-center rounded-full border-2 border-brand-700 bg-brand-500 text-[0.6rem] font-semibold text-white"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-700">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Confirm
                  </button>
                </div>
              </div>

              {/* mini stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-white/55">Credits left</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">
                    18 hrs
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-brand-400 to-info" />
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-white/55">This month</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">
                    7 bookings
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 text-[0.65rem] font-medium text-green-300">
                    ▲ 24% vs last
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* floating accent badge */}
          <div className="absolute -left-4 bottom-10 hidden animate-float rounded-2xl bg-white p-3 shadow-strong sm:block">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-foreground">
                  All-inclusive
                </p>
                <p className="text-xs text-muted-foreground">
                  Wifi · Reception · Coffee
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
