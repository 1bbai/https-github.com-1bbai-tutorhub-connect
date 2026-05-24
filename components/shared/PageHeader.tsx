import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Slot for action button(s) — rendered top-right on desktop */
  action?: React.ReactNode
  /** Alias for action — also accepted */
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  actions,
  className,
}: PageHeaderProps) {
  const slot = action ?? actions

  return (
    <div
      className={cn(
        'flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-8',
        className
      )}
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {slot && (
        <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
          {slot}
        </div>
      )}
    </div>
  )
}
