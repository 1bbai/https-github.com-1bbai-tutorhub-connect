'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { TopNav } from '@/components/shared/TopNav'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { User } from '@/types/database'
import type { Notification as BellNotification } from '@/components/shared/NotificationBell'

const PAGE_TITLES: Record<string, string> = {
  '/client/home': 'Home',
  '/client/plan': 'My Plan',
  '/client/billing': 'Billing',
  '/client/rooms': 'Book a Room',
  '/client/services': 'My Services',
  '/client/support': 'Support',
  '/client/profile': 'Profile',
}

function getPageTitle(pathname: string): string {
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + '/')) return title
  }
  return 'Portal'
}

interface ClientShellProps {
  children: React.ReactNode
  user: User
}

export function ClientShell({ children, user }: ClientShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState<BellNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const pageTitle = getPageTitle(pathname)

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription for notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      const mapped: BellNotification[] = data.map((n) => ({
        id: n.id,
        type: mapNotificationType(n.type),
        title: n.title,
        message: n.message,
        read: n.is_read ?? false,
        created_at: n.created_at,
      }))
      setNotifications(mapped)
      setUnreadCount(mapped.filter((n) => !n.read).length)
    }
  }

  function mapNotificationType(type: string): BellNotification['type'] {
    if (type === 'booking_confirmed') return 'calendar'
    if (type === 'booking_cancelled') return 'warning'
    if (type === 'payment_success') return 'success'
    if (type === 'payment_failed') return 'warning'
    if (type === 'task_updated') return 'message'
    if (type === 'low_credits') return 'warning'
    return 'info'
  }

  async function handleMarkAllRead() {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        role="client"
        currentPath={pathname}
        userName={user.full_name}
        onSignOut={handleSignOut}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden lg:pl-60">
        <TopNav
          title={pageTitle}
          role="client"
          userName={user.full_name}
          userInitials={getInitials(user.full_name)}
          unreadCount={unreadCount}
          onMenuClick={() => setMobileOpen(true)}
          onSignOut={handleSignOut}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onViewAllNotifications={() => router.push('/notifications')}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 md:px-8 max-w-screen-xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
