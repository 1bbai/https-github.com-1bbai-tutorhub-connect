import { ArrowUpRight, Users, Maximize, Wifi } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { SectionHeading } from './section-heading'

const SPACES = [
  {
    name: 'The Executive Suite',
    blurb: 'Corner private office with skyline views and a dedicated meeting nook.',
    seats: 'Up to 6',
    size: '320 sq ft',
    gradient: 'from-brand-500 via-brand-700 to-brand-950',
    tall: true,
  },
  {
    name: 'Boardroom No. 12',
    blurb: 'Premium boardroom with 4K display and video-conferencing built in.',
    seats: 'Up to 14',
    size: '480 sq ft',
    gradient: 'from-info via-brand-600 to-brand-900',
  },
  {
    name: 'The Lounge',
    blurb: 'Design-led coworking floor with barista bar and phone booths.',
    seats: 'Flexible',
    size: 'Open plan',
    gradient: 'from-brand-400 via-brand-600 to-brand-800',
  },
]

export function Workspaces() {
  return (
    <section id="workspaces" className="section bg-brand-950">
      <div className="page-container">
        <SectionHeading
          tone="light"
          eyebrow="The spaces"
          title={
            <>
              Spaces designed to{' '}
              <span className="text-gradient-gold">impress</span>
            </>
          }
          description="Natural light, premium finishes and tech that just works — environments your clients remember and your team loves."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {SPACES.map((space, i) => (
            <Reveal
              key={space.name}
              delay={i * 90}
              className={cn(
                'group relative overflow-hidden rounded-3xl border border-white/10',
                space.tall && 'lg:row-span-2'
              )}
            >
              {/* gradient "photo" */}
              <div
                className={cn(
                  'relative bg-gradient-to-br',
                  space.gradient,
                  space.tall ? 'aspect-[4/5] lg:aspect-auto lg:h-full' : 'aspect-[16/11]'
                )}
              >
                <div className="absolute inset-0 bg-dots opacity-40" aria-hidden="true" />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/30 to-transparent"
                  aria-hidden="true"
                />

                {/* hover sheen */}
                <div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display text-xl font-bold text-white">
                    {space.name}
                  </h3>
                  <p className="mt-1.5 max-w-xs text-sm text-white/75">
                    {space.blurb}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      <Users className="h-3.5 w-3.5" /> {space.seats}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      <Maximize className="h-3.5 w-3.5" /> {space.size}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      <Wifi className="h-3.5 w-3.5" /> Gigabit
                    </span>
                  </div>

                  <a
                    href="#contact"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold transition-transform group-hover:translate-x-0.5"
                  >
                    Reserve a viewing
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
