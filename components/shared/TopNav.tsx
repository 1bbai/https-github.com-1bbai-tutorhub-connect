'use client'

import * as React from 'react'
import { Menu, Settings, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell, type Notification } from '@/components/shared/NotificationBell'

interface TopNavProps {
  title: string
  role: string
  userName: string
  userInitials: string
  unreadCount: number
  onMenuClick: () => void
  onSignOut: () => void
  notifications?: Notification[]
  onMarkAllRead?: () => void
  onViewAllNotifications?: () => void
}

export function TopNav({
  title,
  role,
  userName,
  userInitials,
  unreadCount,
  onMenuClick,
  onSignOut,
  notifications = [],
  onMarkAllRead,
  onViewAllNotifications,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8 shrink-0"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Page title */}
      <h1 className="flex-1 text-sm font-semibold text-foreground truncate">
        {title}
      </h1>

      {/* Right side controls */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={onMarkAllRead}
          onViewAll={onViewAllNotifications}
        />

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-full p-0 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52" sideOffset={8}>
            <DropdownMenuLabel className="font-normal py-2">
              <p className="text-sm font-semibold text-foreground leading-none truncate">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground capitalize mt-1">{role}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Profile
            </DropdownMenuItem>
            {role === 'admin' && (
              <DropdownMenuItem className="cursor-pointer gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
