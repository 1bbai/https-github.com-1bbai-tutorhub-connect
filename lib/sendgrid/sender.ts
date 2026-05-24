/**
 * SendGrid email sender using the v3 API directly (no SDK dependency).
 * Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in your environment.
 */

export interface SendEmailParams {
  to: string
  templateId: string
  dynamicTemplateData: Record<string, unknown>
  subject?: string
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL
  const fromName = process.env.SENDGRID_FROM_NAME ?? 'Markham Office Services'

  if (!apiKey || !fromEmail) {
    console.warn('[sendgrid] SENDGRID_API_KEY or SENDGRID_FROM_EMAIL not configured — skipping email send')
    return
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: {
        email: fromEmail,
        name: fromName,
      },
      personalizations: [
        {
          to: [{ email: params.to }],
          dynamic_template_data: params.dynamicTemplateData,
        },
      ],
      template_id: params.templateId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[sendgrid] Send failed:', error)
    throw new Error('Failed to send email')
  }
}

/**
 * Common email template wrappers
 */

export async function sendInviteEmail(params: {
  to: string
  fullName: string
  inviteUrl: string
}) {
  const templateId = process.env.SENDGRID_TEMPLATE_INVITE ?? ''
  if (!templateId) {
    console.warn('[sendgrid] SENDGRID_TEMPLATE_INVITE not set')
    return
  }
  await sendEmail({
    to: params.to,
    templateId,
    dynamicTemplateData: {
      full_name: params.fullName,
      invite_url: params.inviteUrl,
      business_name: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Markham Office Services',
    },
  })
}

export async function sendInvoicePaidEmail(params: {
  to: string
  fullName: string
  amount: string
  invoicePdfUrl?: string
}) {
  const templateId = process.env.SENDGRID_TEMPLATE_INVOICE_PAID ?? ''
  if (!templateId) {
    console.warn('[sendgrid] SENDGRID_TEMPLATE_INVOICE_PAID not set')
    return
  }
  await sendEmail({
    to: params.to,
    templateId,
    dynamicTemplateData: {
      full_name: params.fullName,
      amount: params.amount,
      invoice_pdf_url: params.invoicePdfUrl ?? null,
    },
  })
}

export async function sendBookingConfirmationEmail(params: {
  to: string
  fullName: string
  roomName: string
  startTime: string
  endTime: string
  creditsUsed: number
}) {
  const templateId = process.env.SENDGRID_TEMPLATE_BOOKING_CONFIRMED ?? ''
  if (!templateId) {
    console.warn('[sendgrid] SENDGRID_TEMPLATE_BOOKING_CONFIRMED not set')
    return
  }
  await sendEmail({
    to: params.to,
    templateId,
    dynamicTemplateData: {
      full_name: params.fullName,
      room_name: params.roomName,
      start_time: params.startTime,
      end_time: params.endTime,
      credits_used: params.creditsUsed,
    },
  })
}

export async function sendLowCreditsEmail(params: {
  to: string
  fullName: string
  creditsRemaining: number
}) {
  const templateId = process.env.SENDGRID_TEMPLATE_LOW_CREDITS ?? ''
  if (!templateId) {
    console.warn('[sendgrid] SENDGRID_TEMPLATE_LOW_CREDITS not set')
    return
  }
  await sendEmail({
    to: params.to,
    templateId,
    dynamicTemplateData: {
      full_name: params.fullName,
      credits_remaining: params.creditsRemaining,
      upgrade_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/plan`,
    },
  })
}
