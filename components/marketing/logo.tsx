import { cn } from '@/lib/utils'

/**
 * Markham Office Services wordmark + monogram.
 * `tone` switches the wordmark color for dark (hero) vs light surfaces.
 */
export function Logo({
  className,
  tone = 'light',
}: {
  className?: string
  tone?: 'light' | 'dark'
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_18px_-4px_hsl(var(--brand-600)/0.6)]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-white"
          aria-hidden="true"
        >
          <path
            d="M4 20V7.5L12 3l8 4.5V20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 20v-5h6v5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 10.5h.01M15 10.5h.01"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-[0.95rem] font-bold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-foreground'
          )}
        >
          Markham<span className="text-gold">.</span>
        </span>
        <span
          className={cn(
            'text-[0.62rem] font-medium uppercase tracking-[0.22em]',
            tone === 'light' ? 'text-white/55' : 'text-muted-foreground'
          )}
        >
          Office Services
        </span>
      </span>
    </span>
  )
}
