import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'

import { CountUp } from './count-up'

// Hosted on the existing WordPress site; loaded directly by the visitor's
// browser. A gradient layer sits behind it as a graceful fallback.
const BUILDING_IMG =
  'https://markhamoffice.com/wp-content/uploads/2024/07/3601-hwy-7.jpg'

const HERO_STATS = [
  { value: 20, suffix: '+', label: 'Years serving Markham' },
  { value: 300, suffix: '', label: 'Sq ft private suites' },
  { value: 100, suffix: '%', label: 'Furnished & serviced' },
]

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-brand-950 text-white">
      {/* ── Background layers ─────────────────────────────────────────────── */}
      {/* fallback gradient (always visible, shows if the photo fails to load) */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-950 to-black"
        aria-hidden="true"
      />
      {/* the building photograph with a slow ken-burns push + cinematic grade */}
      <div
        className="hero-grade animate-kenburns absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${BUILDING_IMG}')` }}
        role="img"
        aria-label="3601 Highway 7 East — the Markham Office Services building"
      />
      {/* colour wash to fuse the photo into the brand palette */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-brand-700/50 via-transparent to-info/25 mix-blend-overlay"
        aria-hidden="true"
      />
      {/* legibility scrims */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/55 to-brand-950/20"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/55 to-transparent"
        aria-hidden="true"
      />
      {/* grain + grid for premium texture */}
      <div
        className="bg-noise absolute inset-0 opacity-[0.12] mix-blend-soft-light"
        aria-hidden="true"
      />
      <div
        className="bg-grid mask-fade absolute inset-0 opacity-25"
        aria-hidden="true"
      />

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="page-container relative flex min-h-[100svh] flex-col justify-center pt-32 pb-14 lg:pt-36">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/85 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            A landmark address on Highway 7 — since 2005
          </span>

          <h1 className="display text-shadow-hero mt-7 text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[5rem] lg:leading-[0.98]">
            Make your business
            <br className="hidden sm:block" />{' '}
            <span className="text-gradient-gold">impossible to ignore</span>.
          </h1>

          <p className="text-shadow-hero mt-7 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
            Prestige executive suites, virtual offices and member-rate meeting
            rooms at{' '}
            <span className="font-semibold text-white">3601 Highway 7</span> —
            plus{' '}
            <span className="font-semibold text-white">
              free company registration
            </span>
            . Everything you need to launch and grow, fully serviced.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contact"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-base font-semibold text-gold-foreground shadow-[0_18px_44px_-10px_hsl(var(--gold)/0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-10px_hsl(var(--gold)/0.9)]"
            >
              Book a private tour
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#workspaces"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-colors hover:bg-white/[0.12]"
            >
              Explore the spaces
            </a>
          </div>

          {/* Trust row */}
          <div className="text-shadow-hero mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gold" />
              3601 Highway 7 E, Markham
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-gold" />
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
        </div>

        {/* Stat strip + floating tour card */}
        <div className="mt-12 flex flex-col gap-8 lg:mt-16 lg:flex-row lg:items-end lg:justify-between">
          <dl className="grid max-w-xl grid-cols-3 gap-6 border-t border-white/15 pt-7">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-3xl font-bold text-white sm:text-4xl">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </dd>
                <p className="mt-1 text-xs text-white/65">{stat.label}</p>
              </div>
            ))}
          </dl>

          {/* glass "now leasing" card */}
          <div className="border-gradient w-full max-w-sm rounded-3xl p-5 backdrop-blur-xl lg:w-80">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Now leasing
              </span>
              <span className="text-xs text-white/55">3601 Hwy 7 E</span>
            </div>
            <p className="mt-3 font-display text-lg font-bold text-white">
              Executive suites &amp; virtual offices
            </p>
            <p className="mt-1 text-sm text-white/65">
              Furnished offices from 150–300 sq ft, ready to move in.
            </p>
            <a
              href="#contact"
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition-transform hover:-translate-y-0.5"
            >
              <CalendarCheck className="h-4 w-4" />
              Check availability
            </a>
          </div>
        </div>
      </div>

      {/* portal sign-in (subtle, top-right) */}
      <Link
        href="https://my.markhamoffice.com/login"
        className="absolute right-4 top-24 z-10 hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur transition-colors hover:bg-white/[0.12] lg:block"
      >
        Member sign-in →
      </Link>
    </section>
  )
}
