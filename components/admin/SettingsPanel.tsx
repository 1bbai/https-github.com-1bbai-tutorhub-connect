'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
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

interface IntegrationStatus {
  sendgrid: boolean
  twilio: boolean
  stripe: boolean
}

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
  integrationStatus: IntegrationStatus
  businessProfile: BusinessProfile
}

// ─────────────────────────────────────────────
// MaskedInput
// ─────────────────────────────────────────────

function MaskedInput({
  label,
  value,
  name,
  placeholder,
}: {
  label: string
  value: string
  name: string
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="relative mt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id={name}
            type={show ? 'text' : 'password'}
            value={value || ''}
            readOnly
            placeholder={placeholder ?? 'Not configured'}
            className="pr-10 font-mono text-sm bg-muted/30"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={handleCopy}
          disabled={!value}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${connected ? 'text-emerald-600' : 'text-red-500'}`}>
      {connected ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      {connected ? 'Connected' : 'Not configured'}
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

export function SettingsPanel({ integrationStatus, businessProfile: initialProfile }: SettingsPanelProps) {
  const [profile, setProfile] = useState<BusinessProfile>(initialProfile)
  const [savingProfile, setSavingProfile] = useState(false)

  // Notification toggles (display-only, just UI state)
  const [notifState, setNotifState] = useState<Record<string, { email: boolean; sms: boolean; in_app: boolean }>>(
    () =>
      Object.fromEntries(
        NOTIFICATION_EVENTS.map((e) => [
          e.type,
          { email: true, sms: false, in_app: true },
        ])
      )
  )

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

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="rounded-md bg-muted/40 border border-border px-4 py-3 text-sm text-muted-foreground">
            Integration credentials are configured via environment variables. These values are read-only at runtime. Update your <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> file and restart the server to change them.
          </div>

          {/* SendGrid */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">SendGrid</CardTitle>
                  <CardDescription>Transactional email delivery</CardDescription>
                </div>
                <StatusBadge connected={integrationStatus.sendgrid} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <MaskedInput
                label="API Key"
                name="sendgrid_api_key"
                value={integrationStatus.sendgrid ? '••••••••••••••••••••••••••' : ''}
                placeholder="SG.xxxxxxxxxxxxxxxx"
              />
              <MaskedInput
                label="Verified Sender Email"
                name="sendgrid_from_email"
                value={integrationStatus.sendgrid ? 'noreply@markhamoffice.com' : ''}
                placeholder="noreply@yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                Set <code className="font-mono bg-muted px-1 py-0.5 rounded">SENDGRID_API_KEY</code> and <code className="font-mono bg-muted px-1 py-0.5 rounded">SENDGRID_FROM_EMAIL</code> in your environment.
              </p>
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
                <StatusBadge connected={integrationStatus.twilio} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <MaskedInput
                label="Account SID"
                name="twilio_account_sid"
                value={integrationStatus.twilio ? 'AC••••••••••••••••••••••••••••••' : ''}
                placeholder="ACxxxxxxxxxxxxxxxx"
              />
              <MaskedInput
                label="Auth Token"
                name="twilio_auth_token"
                value={integrationStatus.twilio ? '••••••••••••••••••••••••••••••••' : ''}
                placeholder="xxxxxxxxxxxxxxxx"
              />
              <MaskedInput
                label="From Number"
                name="twilio_from_number"
                value={integrationStatus.twilio ? '+1416xxxxxxx' : ''}
                placeholder="+14165551234"
              />
              <p className="text-xs text-muted-foreground">
                Set <code className="font-mono bg-muted px-1 py-0.5 rounded">TWILIO_ACCOUNT_SID</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">TWILIO_AUTH_TOKEN</code>, and <code className="font-mono bg-muted px-1 py-0.5 rounded">TWILIO_FROM_NUMBER</code> in your environment.
              </p>
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
                <StatusBadge connected={integrationStatus.stripe} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <MaskedInput
                label="Publishable Key"
                name="stripe_pub_key"
                value={integrationStatus.stripe ? 'pk_live_••••••••••••••••••••••••' : ''}
                placeholder="pk_live_xxxxxxxx"
              />
              <MaskedInput
                label="Secret Key"
                name="stripe_secret_key"
                value={integrationStatus.stripe ? 'sk_live_••••••••••••••••••••••••' : ''}
                placeholder="sk_live_xxxxxxxx"
              />
              <MaskedInput
                label="Webhook Secret"
                name="stripe_webhook_secret"
                value={integrationStatus.stripe ? 'whsec_••••••••••••••••••••••••' : ''}
                placeholder="whsec_xxxxxxxx"
              />
              <p className="text-xs text-muted-foreground">
                Set <code className="font-mono bg-muted px-1 py-0.5 rounded">STRIPE_SECRET_KEY</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>, and <code className="font-mono bg-muted px-1 py-0.5 rounded">STRIPE_WEBHOOK_SECRET</code> in your environment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
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
                            disabled={!integrationStatus.sendgrid}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={notifState[event.type]?.sms ?? false}
                            onCheckedChange={() => toggleNotif(event.type, 'sms')}
                            disabled={!integrationStatus.twilio}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {(!integrationStatus.sendgrid || !integrationStatus.twilio) && (
                <p className="text-xs text-muted-foreground mt-3">
                  {!integrationStatus.sendgrid && 'Email notifications require SendGrid to be configured. '}
                  {!integrationStatus.twilio && 'SMS notifications require Twilio to be configured.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Profile Tab */}
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
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
