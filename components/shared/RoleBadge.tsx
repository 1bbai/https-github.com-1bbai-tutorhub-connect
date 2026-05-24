import { cn } from '@/lib/utils'

type Role = 'admin' | 'staff' | 'client' | string

interface RoleBadgeProps {
  role: Role
  className?: string
}

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: {
    label: 'Admin',
    className:
      'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800',
  },
  staff: {
    label: 'Staff',
    className:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  },
  client: {
    label: 'Client',
    className:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  },
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role.toLowerCase()] ?? {
    label: role,
    className:
      'bg-muted text-muted-foreground border-border',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
