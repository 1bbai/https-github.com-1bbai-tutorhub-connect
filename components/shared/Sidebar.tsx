'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  DoorOpen,
  Wrench,
  BarChart3,
  Settings,
  Home,
  CreditCard,
  HeadphonesIcon,
  UserCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  Contact,
  HandshakeIcon,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/components/shared/RoleBadge'
import { getInitials } from '@/lib/utils'

// ─── Nav config ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  children?: NavItem[]
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'CRM',
    href: '/crm',
    icon: Briefcase,
    children: [
      { label: 'Contacts', href: '/crm/contacts', icon: Contact },
      { label: 'Deals', href: '/crm/deals', icon: HandshakeIcon },
    ],
  },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Rooms', href: '/rooms', icon: DoorOpen },
  { label: 'Services', href: '/services', icon: Wrench },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const staffNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'CRM', href: '/crm', icon: Briefcase },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
]

const clientNav: NavItem[] = [
  { label: 'Home', href: '/client/home', icon: Home },
  { label: 'My Plan', href: '/client/plan', icon: FileText },
  { label: 'Billing', href: '/client/billing', icon: CreditCard },
  { label: 'Rooms', href: '/client/rooms', icon: DoorOpen },
  { label: 'Services', href: '/client/services', icon: Wrench },
  { label: 'Support', href: '/client/support', icon: HeadphonesIcon },
  { label: 'Profile', href: '/client/profile', icon: UserCircle },
]

function getNavItems(role: string): NavItem[] {
  if (role === 'admin') return adminNav
  if (role === 'staff') return staffNav
  return clientNav
}

// ─── NavLink ────────────────────────────────────────────────────────────────

function NavLink({
  item,
  currentPath,
  depth = 0,
  onNavigate,
}: {
  item: NavItem
  currentPath: string
  depth?: number
  onNavigate?: () => void
}) {
  const hasChildren = !!item.children?.length
  const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/')
  const isChildActive = item.children?.some(
    (c) => currentPath === c.href || currentPath.startsWith(c.href + '/')
  )
  const [open, setOpen] = React.useState(isChildActive || isActive)

  const Icon = item.icon

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'text-muted-foreground hover:text-foreground hover:bg-accent',
            (isActive || isChildActive) && 'text-foreground bg-accent'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        {open && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
            {item.children!.map((child) => (
              <NavLink
                key={child.href}
                item={child}
                currentPath={currentPath}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const isExactActive = currentPath === item.href

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isExactActive || isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

// ─── Sidebar inner content ────────────────────────────────────────────────────

function SidebarContent({
  role,
  currentPath,
  userName,
  onSignOut,
  onNavigate,
}: {
  role: string
  currentPath: string
  userName: string
  onSignOut: () => void
  onNavigate?: () => void
}) {
  const navItems = getNavItems(role)
  const initials = getInitials(userName)

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-4 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shrink-0 select-none">
          MO
        </div>
        <span className="text-sm font-semibold text-foreground leading-tight">
          Markham Office
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-1 mb-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-none mb-0.5">
              {userName}
            </p>
            <RoleBadge role={role} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
          onClick={onSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

// ─── Main Sidebar export ─────────────────────────────────────────────────────

interface SidebarProps {
  role: string
  currentPath: string
  userName: string
  onSignOut: () => void
  /** Controls whether the mobile overlay is open (passed down from TopNav hamburger) */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({
  role,
  currentPath,
  userName,
  onSignOut,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — fixed, always visible on lg+ */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-r lg:border-border lg:bg-background lg:z-20">
        <SidebarContent
          role={role}
          currentPath={currentPath}
          userName={userName}
          onSignOut={onSignOut}
        />
      </aside>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar — slides in from left */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0 shadow-strong' : '-translate-x-full'
        )}
        aria-label="Navigation sidebar"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <SidebarContent
          role={role}
          currentPath={currentPath}
          userName={userName}
          onSignOut={onSignOut}
          onNavigate={onMobileClose}
        />
      </aside>
    </>
  )
}
