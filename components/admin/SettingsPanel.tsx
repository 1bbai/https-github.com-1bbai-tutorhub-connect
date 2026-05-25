'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, CheckCircle2, XCircle, Save, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/shared/PageHeader'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface BusinessProfile {
  business_name: string
  logo_url: string
  address: string
  city: string
  province: string
  postal_code: string
  email: string
  phone: string
}

interface SettingsPanelProps {
  businessProfile: BusinessProfile
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${connected ? 'text-emerald-600' : 'text-muted-foreground'}`}>
      {connected ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {connected ? 'Connected' : 'Not configured'}
    </div>
  )
}

function SecretInput({
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'Enter value…'}
          className="pr-10 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Notification events
// ─────────────────────────────────────────────

const NOTIFICATION_EVENTS = [
  { type: 'booking_confirmed', label: 'Room Booking Confirmed' },
  { type: 'booking_cancelled', label: 'Room Booking Cancelled' },
  { type: 'invoice_paid', label: 'Invoice Paid' },
  { type: 'invoice_overdue', label: 'Invoice Overdue' },
  { type: 'subscription_activated', label: 'Subscription Activated' },
  { type: 'subscription_cancelled', label: 'Subscription Cancelled' },
  { type: 'low_credits', label: 'Low Meeting Room Credits' },
  { type: 'task_assigned', label: 'Task Assigned' },
  { type: 'task_completed', label: 'Task Completed' },
  { type: 'new_client', label: 'New Client Registered' },
  { type: 'deal_won', label: 'Deal Won' },
  { type: 'deal_lost', label: 'Deal Lost' },
]

// ─────────────────────────────────────────────
// SettingsPanel (main export)
// ─────────────────────────────────────────────

export function SettingsPanel({ businessProfile: initialProfile }: SettingsPanelProps) {
  const [profile, setProfile] = useState<BusinessProfile>(initialProfile)
  const [savingProfile, setSavingProfile] = useState(false)

  // Integration field values
  const [resend, setResend] = useState({ api_key: '', from_email: '', from_name: '' })
  const [twilio, setTwilio] = useState({ account_sid: '', auth_token: '', from_number: '' })
  const [stripe, setStripe] = useState({ secret_key: '', publishable_key: '', webhook_secret: '' })
  const [savingResend, setSavingResend] = useState(false)
  const [savingTwilio, setSavingTwilio] = useState(false)
  const [savingStripe, setSavingStripe] = useState(false)
  const [loadingIntegrations, setLoadingIntegrations] = useState(true)

  const [notifState, setNotifState] = useState<Record<string, { email: boolean; sms: boolean; in_app: boolean }>>(
    () => Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.type, { email: true, sms: false, in_app: true }]))
  )

  // Derived connected status
  const resendConnected = !!(resend.api_key && resend.api_key !== '')
  const twilioConnected = !!(twilio.account_sid && twilio.auth_token)
  const stripeConnected = !!(stripe.secret_key)

  useEffect(() => {
    fetch('/api/admin/settings/integrations')
      .then((r) => r.json())
      .then((data) => {
        setResend({
          api_key:    data.resend_api_key    ?? '',
          from_email: data.resend_from_email ?? '',
          from_name:  data.resend_from_name  ?? '',
        })
        setTwilio({
          account_sid:  data.twilio_account_sid  ?? '',
          auth_token:   data.twilio_auth_token   ?? '',
          from_number:  data.twilio_from_number  ?? '',
        })
        setStripe({
          secret_key:      data.stripe_secret_key      ?? '',
          publishable_key: data.stripe_publishable_key ?? '',
          webhook_secret:  data.stripe_webhook_secret  ?? '',
        })
      })
      .catch(() => toast.error('Failed to load integration settings'))
      .finally(() => setLoadingIntegrations(false))
  }, [])

  async function saveIntegration(keys: Record<string, string>, setSaving: (v: boolean) => void, label: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      toast.success(`${label} settings saved`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function toggleNotif(type: string, channel: 'email' | 'sms' | 'in_app') {
    setNotifState((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: !prev[type][channel] },
    }))
  }

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/admin/settings/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save')
      toast.success('Business profile saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure integrations, notifications, and business profile"
      />

      <Tabs defaultValue="integrations">
        <TabsList className="mb-6">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
        </TabsList>

        {/* ── Integrations Tab ── */}
        <TabsContent value="integrations" className="space-y-6">
          {loadingIntegrations ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading integration settings…
            </div>
          ) : (
            <>
              {/* Resend */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Resend</CardTitle>
                      <CardDescription>Transactional email delivery</CardDescription>
                    </div>
                    <StatusBadge connected={resendConnected} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SecretInput
                    label="API Key"
                    id="resend_api_key"
                    value={resend.api_key}
                    onChange={(v) => setResend((p) => ({ ...p, api_key: v }))}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <div>
                    <Label htmlFor="resend_from_email">From Email</Label>
                    <Input
                      id="resend_from_email"
                      className="mt-1"
                      value={resend.from_email}
                      onChange={(e) => setResend((p) => ({ ...p, from_email: e.target.value }))}
                      placeholder="no-reply@markhamoffice.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resend_from_name">From Name</Label>
                    <Input
                      id="resend_from_name"
                      className="mt-1"
                      value={resend.from_name}
                      onChange={(e) => setResend((p) => ({ ...p, from_name: e.target.value }))}
                      placeholder="Markham Office Services"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      disabled={savingResend}
                      onClick={() => saveIntegration(
                        { resend_api_key: resend.api_key, resend_from_email: resend.from_email, resend_from_name: resend.from_name },
                        setSavingResend,
                        'Resend'
                      )}
                    >
                      {savingResend ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Twilio */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Twilio</CardTitle>
                      <CardDescription>SMS notifications</CardDescription>
                    </div>
                    <StatusBadge connected={twilioConnected} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SecretInput
                    label="Account SID"
                    id="twilio_account_sid"
                    value={twilio.account_sid}
                    onChange={(v) => setTwilio((p) => ({ ...p, account_sid: v }))}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <SecretInput
                    label="Auth Token"
                    id="twilio_auth_token"
                    value={twilio.auth_token}
                    onChange={(v) => setTwilio((p) => ({ ...p, auth_token: v }))}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <div>
                    <Label htmlFor="twilio_from_number">From Number</Label>
                    <Input
                      id="twilio_from_number"
                      className="mt-1"
                      value={twilio.from_number}
                      onChange={(e) => setTwilio((p) => ({ ...p, from_number: e.target.value }))}
                      placeholder="+14165551234"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      disabled={savingTwilio}
                      onClick={() => saveIntegration(
                        { twilio_account_sid: twilio.account_sid, twilio_auth_token: twilio.auth_token, twilio_from_number: twilio.from_number },
                        setSavingTwilio,
                        'Twilio'
                      )}
                    >
                      {savingTwilio ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stripe */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Stripe</CardTitle>
                      <CardDescription>Payment processing and subscriptions</CardDescription>
                    </div>
                    <StatusBadge connected={stripeConnected} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SecretInput
                    label="Secret Key"
                    id="stripe_secret_key"
                    value={stripe.secret_key}
                    onChange={(v) => setStripe((p) => ({ ...p, secret_key: v }))}
                    placeholder="sk_live_xxxxxxxx"
                  />
                  <div>
                    <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
                    <Input
                      id="stripe_publishable_key"
                      className="mt-1 font-mono text-sm"
                      value={stripe.publishable_key}
                      onChange={(e) => setStripe((p) => ({ ...p, publishable_key: e.target.value }))}
                      placeholder="pk_live_xxxxxxxx"
                    />
                  </div>
                  <SecretInput
                    label="Webhook Secret"
                    id="stripe_webhook_secret"
                    value={stripe.webhook_secret}
                    onChange={(v) => setStripe((p) => ({ ...p, webhook_secret: v }))}
                    placeholder="whsec_xxxxxxxx"
                  />
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      disabled={savingStripe}
                      onClick={() => saveIntegration(
                        { stripe_secret_key: stripe.secret_key, stripe_publishable_key: stripe.publishable_key, stripe_webhook_secret: stripe.webhook_secret },
                        setSavingStripe,
                        'Stripe'
                      )}
                    >
                      {savingStripe ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Channels</CardTitle>
              <CardDescription>
                Configure which channels are enabled for each notification event type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-64">Event</TableHead>
                      <TableHead className="text-center w-28">In-App</TableHead>
                      <TableHead className="text-center w-28">Email</TableHead>
                      <TableHead className="text-center w-28">SMS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {NOTIFICATION_EVENTS.map((event) => (
                      <TableRow key={event.type}>
                        <TableCell className="text-sm font-medium">{event.label}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={notifState[event.type]?.in_app ?? false}
                            onCheckedChange={() => toggleNotif(event.type, 'in_app')}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={notifState[event.type]?.email ?? false}
                            onCheckedChange={() => toggleNotif(event.type, 'email')}
                            disabled={!resendConnected}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={notifState[event.type]?.sms ?? false}
                            onCheckedChange={() => toggleNotif(event.type, 'sms')}
                            disabled={!twilioConnected}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {(!resendConnected || !twilioConnected) && (
                <p className="text-xs text-muted-foreground mt-3">
                  {!resendConnected && 'Email notifications require Resend to be configured. '}
                  {!twilioConnected && 'SMS notifications require Twilio to be configured.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Business Profile Tab ── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Profile</CardTitle>
              <CardDescription>
                Your business details appear on invoices, emails, and the client portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Business Name</Label>
                  <Input
                    value={profile.business_name}
                    onChange={(e) => setProfile((p) => ({ ...p, business_name: e.target.value }))}
                    placeholder="Markham Office Services"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={profile.logo_url}
                    onChange={(e) => setProfile((p) => ({ ...p, logo_url: e.target.value }))}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    placeholder="123 Main Street"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={profile.city}
                    onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Markham"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Province</Label>
                  <Input
                    value={profile.province}
                    onChange={(e) => setProfile((p) => ({ ...p, province: e.target.value }))}
                    placeholder="ON"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={profile.postal_code}
                    onChange={(e) => setProfile((p) => ({ ...p, postal_code: e.target.value }))}
                    placeholder="L3R 0A1"
                    className="mt-1"
                  />
                </div>
                <Separator className="col-span-2" />
                <div>
                  <Label>Business Email</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    placeholder="info@markhamoffice.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Business Phone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 905 555 0100"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
