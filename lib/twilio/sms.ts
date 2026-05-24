/**
 * Twilio SMS sender using the Twilio REST API directly (no SDK dependency).
 * Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in your environment.
 */

export interface SendSMSParams {
  to: string
  body: string
}

export async function sendSMS(params: SendSMSParams): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    console.warn('[twilio] Twilio not configured — skipping SMS send')
    return
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: params.to,
        From: from,
        Body: params.body,
      }).toString(),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('[twilio] SMS send failed:', error)
    // Non-throwing — SMS failures shouldn't crash the calling operation
  }
}

/**
 * Common SMS notification helpers
 */

export async function sendBookingConfirmationSMS(params: {
  to: string
  fullName: string
  roomName: string
  startTime: string
}) {
  const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Markham Office Services'
  await sendSMS({
    to: params.to,
    body: `Hi ${params.fullName}, your booking at ${params.roomName} is confirmed for ${params.startTime}. - ${businessName}`,
  })
}

export async function sendLowCreditsSMS(params: {
  to: string
  fullName: string
  creditsRemaining: number
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  await sendSMS({
    to: params.to,
    body: `Hi ${params.fullName}, you have ${params.creditsRemaining} meeting room credit${params.creditsRemaining === 1 ? '' : 's'} remaining. Upgrade your plan at ${appUrl}/plan`,
  })
}

export async function sendTaskAssignedSMS(params: {
  to: string
  fullName: string
  taskTitle: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  await sendSMS({
    to: params.to,
    body: `Hi ${params.fullName}, a new task has been assigned to you: "${params.taskTitle}". View it at ${appUrl}/staff/tasks`,
  })
}
