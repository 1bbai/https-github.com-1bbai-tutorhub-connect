import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: StatColor
  className?: string
}

const colorMap: Record<StatColor, { container: string; icon: string }> = {
  blue:   { container: 'bg-blue-50 dark:bg-blue-950/30',   icon: 'text-blue-600 dark:text-blue-400' },
  green:  { container: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'text-emerald-600 dark:text-emerald-400' },
  yellow: { container: 'bg-amber-50 dark:bg-amber-950/30', icon: 'text-amber-600 dark:text-amber-400' },
  red:    { container: 'bg-red-50 dark:bg-red-950/30',     icon: 'text-red-600 dark:text-red-400' },
  purple: { container: 'bg-violet-50 dark:bg-violet-950/30', icon: 'text-violet-600 dark:text-violet-400' },
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'blue',
  className,
}: StatCardProps) {
  const colors = colorMap[color]
  const trendPositive = trend ? trend.value >= 0 : null

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight mt-1">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
          {trend && (
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium mt-2',
                trendPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {trendPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value > 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
            colors.container
          )}
        >
          <Icon className={cn('h-5 w-5', colors.icon)} strokeWidth={1.75} />
        </div>
      </div>
    </div>
  )
}
