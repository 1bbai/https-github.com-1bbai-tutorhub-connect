'use client'

import * as React from 'react'
import { Bell, Info, AlertTriangle, CheckCircle2, MessageSquare, Calendar } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'message' | 'calendar'
  title: string
  message: string
  read: boolean
  created_at: string
}

interface NotificationBellProps {
  notifications?: Notification[]
  unreadCount?: number
  onMarkAllRead?: () => void
  onViewAll?: () => void
  loading?: boolean
}

const typeIcon: Record<Notification['type'], React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  message: MessageSquare,
  calendar: Calendar,
}

const typeColor: Record<Notification['type'], string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  success: 'text-emerald-500',
  message: 'text-violet-500',
  calendar: 'text-indigo-500',
}

export function NotificationBell({
  notifications = [],
  unreadCount = 0,
  onMarkAllRead,
  onViewAll,
  loading = false,
}: NotificationBellProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium"
              onClick={() => {
                onMarkAllRead()
              }}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[340px]">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Bell className="h-7 w-7 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">All caught up</p>
              <p className="text-xs text-muted-foreground mt-0.5">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.slice(0, 10).map((n, idx) => {
                const Icon = typeIcon[n.type]
                return (
                  <React.Fragment key={n.id}>
                    <div
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer',
                        !n.read && 'bg-muted/30'
                      )}
                    >
                      <div className={cn('mt-0.5 shrink-0', typeColor[n.type])}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {formatRelativeTime(n.created_at)}
                        </p>
                      </div>
                    </div>
                    {idx < notifications.length - 1 && (
                      <Separator className="mx-4 w-auto" />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && onViewAll && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setOpen(false)
                  onViewAll()
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
