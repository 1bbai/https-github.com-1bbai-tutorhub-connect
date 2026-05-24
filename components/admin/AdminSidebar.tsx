'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  DoorOpen,
  Briefcase,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/admin/rooms', label: 'Rooms', icon: DoorOpen },
  { href: '/admin/services', label: 'Services', icon: Briefcase },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

interface AdminSidebarProps {
  open: boolean
  onToggle: () => void
  forceOpen?: boolean
  profile: {
    full_name: string
    email: string
    avatar_url: string | null
    role: string
  }
  className?: string
}

export function AdminSidebar({
  open,
  onToggle,
  forceOpen = false,
  profile,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const isExpanded = forceOpen || open

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
          isExpanded ? 'w-60' : 'w-16',
          className
        )}
      >
        {/* Logo / brand */}
        <div
          className={cn(
            'flex items-center h-14 px-4 border-b border-border shrink-0 gap-3',
            !isExpanded && 'justify-center px-0'
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          {isExpanded && (
            <span className="font-semibold text-sm text-foreground truncate">
              Markham Office
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    !isExpanded && 'justify-center px-0 w-10 mx-auto'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {isExpanded && <span>{item.label}</span>}
                </Link>
              )

              return (
                <li key={item.href}>
                  {!isExpanded ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Profile + toggle */}
        <div className="border-t border-border p-3 shrink-0">
          {isExpanded ? (
            <div className="flex items-center gap-2.5">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {profile.full_name}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {profile.role}
                </p>
              </div>
              <button
                onClick={onToggle}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={onToggle}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
