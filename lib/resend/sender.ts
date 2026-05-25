import { Resend } from 'resend'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'no-reply@markhamoffice.com'
const FROM_NAME  = process.env.RESEND_FROM_NAME  ?? 'Markham Office Services'
const from = `${FROM_NAME} <${FROM_EMAIL}>`

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[resend] RESEND_API_KEY not configured — skipping email send')
    return null
  }
  return new Resend(key)
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export async function sendInviteEmail(params: {
  to: string
  fullName: string
  inviteUrl: string
}) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from,
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
  const resend = getResend()
  if (!resend) return

  const pdfLine = params.invoicePdfUrl
    ? `<p><a href="${params.invoicePdfUrl}">Download your invoice (PDF)</a></p>`
    : ''

  await resend.emails.send({
    from,
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
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from,
    to: params.to,
    subject: `Booking confirmed — ${params.roomName}`,
    html: `
      <p>Hi ${params.fullName},</p>
      <p>Your meeting room booking is confirmed:</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Room</td><td><strong>${params.roomName}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Start</td><td>${params.startTime}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">End</td><td>${params.endTime}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Credits used</td><td>${params.creditsUsed}</td></tr>
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
  const resend = getResend()
  if (!resend) return

  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://my.markhamoffice.com'}/client/plan`

  await resend.emails.send({
    from,
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
