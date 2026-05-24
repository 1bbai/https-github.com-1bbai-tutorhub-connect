'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Building2,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/shared/NotificationBell'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  children?: { href: string; label: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/staff/crm',
    label: 'CRM',
    icon: Briefcase,
    children: [
      { href: '/staff/crm/contacts', label: 'Contacts' },
      { href: '/staff/crm/deals', label: 'Deals' },
    ],
  },
  { href: '/staff/clients', label: 'Clients', icon: Users },
  { href: '/staff/tasks', label: 'Tasks', icon: CheckSquare },
]

interface StaffSidebarProps {
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

function StaffSidebar({ open, onToggle, forceOpen = false, profile, className }: StaffSidebarProps) {
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
        {/* Logo */}
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
                pathname === item.href ||
                pathname.startsWith(item.href + '/') ||
                (item.children?.some((c) => pathname.startsWith(c.href)) ?? false)
              const Icon = item.icon

              const linkContent = (
                <div>
                  <Link
                    href={item.children ? item.children[0].href : item.href}
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
                  {isExpanded && item.children && isActive && (
                    <ul className="ml-7 mt-0.5 space-y-0.5">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              'block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                              pathname.startsWith(child.href)
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )

              return (
                <li key={item.href}>
                  {!isExpanded ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>{linkContent}</div>
                      </TooltipTrigger>
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
                <p className="text-xs font-medium text-foreground truncate">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{profile.role}</p>
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

// ─────────────────────────────────────────────
// StaffShell
// ─────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/staff/dashboard': 'Dashboard',
  '/staff/crm/contacts': 'Contacts',
  '/staff/crm/deals': 'Deals',
  '/staff/clients': 'Clients',
  '/staff/tasks': 'Tasks',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + '/')) return title
  }
  return 'Staff Portal'
}

interface StaffShellProps {
  children: React.ReactNode
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    avatar_url: string | null
    company_name: string | null
  }
}

export function StaffShell({ children, profile }: StaffShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <StaffSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        profile={profile}
        className="hidden md:flex"
      />

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <StaffSidebar
        open={mobileSidebarOpen}
        onToggle={() => setMobileSidebarOpen(false)}
        profile={profile}
        className="fixed inset-y-0 left-0 z-50 flex md:hidden"
        forceOpen
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top nav */}
        <header className="h-14 border-b border-border bg-card px-4 flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <h1 className="text-sm font-semibold text-foreground flex-1">{pageTitle}</h1>
          <NotificationBell userId={profile.id} />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 md:px-8 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
