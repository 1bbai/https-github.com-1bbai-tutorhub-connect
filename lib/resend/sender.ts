import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

async function getResendConfig(): Promise<{ resend: Resend; from: string } | null> {
  // Try DB settings first, fall back to env vars
  let apiKey = process.env.RESEND_API_KEY ?? ''
  let fromEmail = process.env.RESEND_FROM_EMAIL ?? 'no-reply@markhamoffice.com'
  let fromName = process.env.RESEND_FROM_NAME ?? 'Markham Office Services'

  try {
    const admin = createAdminClient()
    const { data: rows } = await admin
      .from('app_settings')
      .select('key, value')
      .in('key', ['resend_api_key', 'resend_from_email', 'resend_from_name'])
    for (const row of rows ?? []) {
      if (row.key === 'resend_api_key'    && row.value) apiKey    = row.value
      if (row.key === 'resend_from_email' && row.value) fromEmail = row.value
      if (row.key === 'resend_from_name'  && row.value) fromName  = row.value
    }
  } catch {
    // DB unavailable — use env vars only
  }

  if (!apiKey) {
    console.warn('[resend] No API key configured — skipping email send')
    return null
  }

  return {
    resend: new Resend(apiKey),
    from: `${fromName} <${fromEmail}>`,
  }
}

// ─── Welcome / registration ───────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string
  fullName: string
}) {
  const cfg = await getResendConfig()
  if (!cfg) return

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://my.markhamoffice.com'}/client/home`

  await cfg.resend.emails.send({
    from: cfg.from,
    to: params.to,
    subject: 'Welcome to Markham Office Services',
    html: `
      <p>Hi ${params.fullName},</p>
      <p>Your Markham Office Services account has been created and is ready to use.</p>
      <p>
        <a href="${portalUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
          Access your client portal
        </a>
      </p>
      <p>From the portal you can book meeting rooms, view your plan, check invoices, and request support.</p>
      <p>If you have any questions, contact us at <a href="mailto:support@markhamoffice.com">support@markhamoffice.com</a>.</p>
      <p>— Markham Office Services</p>
    `,
  })
}

// ─── Welcome / registration ───────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string
  fullName: string
}) {
  const resend = getResend()
  if (!resend) return

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://my.markhamoffice.com'}/client/home`

  await resend.emails.send({
    from,
    to: params.to,
    subject: 'Welcome to Markham Office Services',
    html: `
      <p>Hi ${params.fullName},</p>
      <p>Your Markham Office Services account has been created and is ready to use.</p>
      <p>
        <a href="${portalUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
          Access your client portal
        </a>
      </p>
      <p>From the portal you can book meeting rooms, view your plan, check invoices, and request support.</p>
      <p>If you have any questions, contact us at <a href="mailto:support@markhamoffice.com">support@markhamoffice.com</a>.</p>
      <p>— Markham Office Services</p>
    `,
  })
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export async function sendInviteEmail(params: {
  to: string
  fullName: string
  inviteUrl: string
}) {
  const cfg = await getResendConfig()
  if (!cfg) return

  await cfg.resend.emails.send({
    from: cfg.from,
    to: params.to,
    subject: "You've been invited to Markham Office Services",
    html: `
      <p>Hi ${params.fullName},</p>
      <p>You have been invited to access the Markham Office Services client portal.</p>
      <p><a href="${params.inviteUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Accept Invitation</a></p>
      <p>This link expires in 24 hours. If you did not expect this invitation, you can safely ignore it.</p>
      <p>— Markham Office Services</p>
    `,
  })
}

// ─── Invoice paid ─────────────────────────────────────────────────────────────

export async function sendInvoicePaidEmail(params: {
  to: string
  fullName: string
  amount: string
  invoicePdfUrl?: string
}) {
  const cfg = await getResendConfig()
  if (!cfg) return

  const pdfLine = params.invoicePdfUrl
    ? `<p><a href="${params.invoicePdfUrl}">Download your invoice (PDF)</a></p>`
    : ''

  await cfg.resend.emails.send({
    from: cfg.from,
    to: params.to,
    subject: `Payment received — ${params.amount}`,
    html: `
      <p>Hi ${params.fullName},</p>
      <p>We've received your payment of <strong>${params.amount}</strong>. Thank you!</p>
      ${pdfLine}
      <p>If you have any questions, reply to this email or contact support@markhamoffice.com.</p>
      <p>— Markham Office Services</p>
    `,
  })
}

// ─── Booking confirmation ─────────────────────────────────────────────────────

export async function sendBookingConfirmationEmail(params: {
  to: string
  fullName: string
  roomName: string
  startTime: string
  endTime: string
  creditsUsed: number
}) {
  const cfg = await getResendConfig()
  if (!cfg) return

  await cfg.resend.emails.send({
    from: cfg.from,
    to: params.to,
    subject: `Booking confirmed — ${params.roomName}`,
    html: `
      <p>Hi ${params.fullName},</p>
      <p>Your meeting room booking is confirmed:</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Room</td><td><strong>${params.roomName}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Start</td><td>${params.startTime}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">End</td><td>${params.endTime}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Meeting room credits used</td><td>${params.creditsUsed} (1 credit = 1 hr)</td></tr>
      </table>
      <p>To cancel or manage your booking, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://my.markhamoffice.com'}/client/rooms">client portal</a>.</p>
      <p>— Markham Office Services</p>
    `,
  })
}

// ─── Low credits ──────────────────────────────────────────────────────────────

export async function sendLowCreditsEmail(params: {
  to: string
  fullName: string
  creditsRemaining: number
}) {
  const cfg = await getResendConfig()
  if (!cfg) return

  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://my.markhamoffice.com'}/client/plan`

  await cfg.resend.emails.send({
    from: cfg.from,
    to: params.to,
    subject: 'Your meeting room credits are running low',
    html: `
      <p>Hi ${params.fullName},</p>
      <p>You have <strong>${params.creditsRemaining} meeting room credit${params.creditsRemaining === 1 ? '' : 's'}</strong> remaining.</p>
      <p>Upgrade your plan to get more credits and keep booking rooms without interruption.</p>
      <p><a href="${upgradeUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View Plans</a></p>
      <p>— Markham Office Services</p>
    `,
  })
}
