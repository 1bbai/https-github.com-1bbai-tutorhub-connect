const COMPANIES = [
  'Virtual Offices',
  'Executive Suites',
  'Meeting Rooms',
  'Free Business Registration',
  'Mail Forwarding',
  'Prestige Highway 7 Address',
  'Markham Board of Trade Member',
  'Established 2005',
]

export function TrustedBy() {
  return (
    <section className="border-y border-border bg-brand-950 py-10">
      <div className="page-container">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
          Everything your business needs in Markham
        </p>

        <div className="group relative mt-7 overflow-hidden mask-fade">
          <div className="flex w-max animate-marquee items-center gap-14 group-hover:[animation-play-state:paused]">
            {[...COMPANIES, ...COMPANIES].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="whitespace-nowrap font-display text-lg font-semibold text-white/40 transition-colors hover:text-white/80"
                aria-hidden={i >= COMPANIES.length}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
