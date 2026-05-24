'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { User, NotificationPreference } from '@/types/database'

interface ProfilePageProps {
  user: User
  notificationPreferences: NotificationPreference[]
}

interface NotificationEvent {
  key: string
  label: string
  hasEmail: boolean
  hasSms: boolean
}

const NOTIFICATION_EVENTS: NotificationEvent[] = [
  { key: 'booking_confirmed', label: 'Booking Confirmed', hasEmail: true, hasSms: true },
  { key: 'booking_cancelled', label: 'Booking Cancelled', hasEmail: true, hasSms: true },
  { key: 'payment_success', label: 'Payment Successful', hasEmail: true, hasSms: false },
  { key: 'payment_failed', label: 'Payment Failed', hasEmail: true, hasSms: true },
  { key: 'task_updated', label: 'Support Request Updated', hasEmail: true, hasSms: false },
  { key: 'low_credits', label: 'Low Credits', hasEmail: true, hasSms: true },
]

function getPref(
  prefs: NotificationPreference[],
  eventType: string,
  channel: 'email' | 'sms'
): boolean {
  const pref = prefs.find((p) => p.event_type === eventType)
  if (!pref) return true // default to enabled
  return channel === 'email' ? (pref.email_enabled ?? true) : (pref.sms_enabled ?? true)
}

export function ProfilePage({ user, notificationPreferences }: ProfilePageProps) {
  const router = useRouter()
  const supabase = createClient()

  // Profile form
  const [fullName, setFullName] = React.useState(user.full_name)
  const [phone, setPhone] = React.useState(user.phone ?? '')
  const [companyName, setCompanyName] = React.useState(user.company_name ?? '')
  const [profileLoading, setProfileLoading] = React.useState(false)

  // Password form
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [passwordLoading, setPasswordLoading] = React.useState(false)

  // Notification prefs state
  const [prefs, setPrefs] = React.useState<NotificationPreference[]>(notificationPreferences)
  const [prefLoading, setPrefLoading] = React.useState<string | null>(null)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Full name is required.')
      return
    }
    setProfileLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          company_name: companyName.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update profile')
      }
      toast.success('Profile updated successfully.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword) {
      toast.error('Please enter a new password.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleTogglePref(eventType: string, channel: 'email' | 'sms', enabled: boolean) {
    const key = `${eventType}-${channel}`
    setPrefLoading(key)

    const existing = prefs.find((p) => p.event_type === eventType)
    const update = {
      ...(channel === 'email' ? { email_enabled: enabled } : { sms_enabled: enabled }),
    }

    try {
      const res = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, ...update }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update preference')
      }

      // Optimistic update
      setPrefs((prev) => {
        const existing = prev.find((p) => p.event_type === eventType)
        if (existing) {
          return prev.map((p) =>
            p.event_type === eventType ? { ...p, ...update } : p
          )
        }
        return [
          ...prev,
          {
            id: `temp-${eventType}`,
            user_id: user.id,
            event_type: eventType,
            email_enabled: channel === 'email' ? enabled : true,
            sms_enabled: channel === 'sms' ? enabled : true,
            in_app_enabled: true,
          },
        ]
      })

      toast.success('Preference updated.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update preference')
    } finally {
      setPrefLoading(null)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h2 className="text-xl font-bold text-foreground">Profile Settings</h2>

      {/* Edit Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed. Contact support if needed.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (416) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name (optional)"
              />
            </div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Event
                  </th>
                  <th className="text-center py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-center py-2.5 pl-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    SMS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {NOTIFICATION_EVENTS.map((event) => {
                  const emailEnabled = getPref(prefs, event.key, 'email')
                  const smsEnabled = getPref(prefs, event.key, 'sms')
                  return (
                    <tr key={event.key}>
                      <td className="py-3 pr-4 text-foreground font-medium">{event.label}</td>
                      <td className="py-3 px-4 text-center">
                        {event.hasEmail ? (
                          <Switch
                            checked={emailEnabled}
                            onCheckedChange={(v) => handleTogglePref(event.key, 'email', v)}
                            disabled={prefLoading === `${event.key}-email`}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pl-4 text-center">
                        {event.hasSms ? (
                          <Switch
                            checked={smsEnabled}
                            onCheckedChange={(v) => handleTogglePref(event.key, 'sms', v)}
                            disabled={prefLoading === `${event.key}-sms`}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
