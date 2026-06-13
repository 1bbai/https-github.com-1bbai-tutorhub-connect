const COMPANIES = [
  'Horizon Tech',
  'Golden Dragon Foods',
  'Nova Health',
  'Maple Ridge Legal',
  'Apex Consulting',
  'Lakeside Realty',
  'Quanta Labs',
  'Northwind Capital',
]

export function TrustedBy() {
  return (
    <section className="border-y border-border bg-brand-950 py-10">
      <div className="page-container">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
          Trusted by ambitious teams across the GTA
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
