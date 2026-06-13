import { cn } from '@/lib/utils'
import { Reveal } from './reveal'

interface SectionHeadingProps {
  eyebrow: string
  title: React.ReactNode
  description?: string
  align?: 'center' | 'left'
  tone?: 'light' | 'dark'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'dark',
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
          tone === 'dark'
            ? 'bg-brand-50 text-brand-700'
            : 'bg-white/10 text-brand-200'
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          'display mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]',
          tone === 'dark' ? 'text-foreground' : 'text-white'
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-lg leading-relaxed',
            tone === 'dark' ? 'text-muted-foreground' : 'text-white/70'
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  )
}
