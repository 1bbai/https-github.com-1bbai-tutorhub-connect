import { SettingsPanel } from '@/components/admin/SettingsPanel'

export default async function SettingsPage() {
  // Check which integrations are configured via env vars
  const integrationStatus = {
    sendgrid: !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL),
    twilio: !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
    ),
    stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  }

  // Default business profile (would be fetched from DB in production)
  const businessProfile = {
    business_name: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Markham Office Services',
    logo_url: process.env.NEXT_PUBLIC_LOGO_URL ?? '',
    address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? '',
    city: process.env.NEXT_PUBLIC_BUSINESS_CITY ?? 'Markham',
    province: process.env.NEXT_PUBLIC_BUSINESS_PROVINCE ?? 'ON',
    postal_code: process.env.NEXT_PUBLIC_BUSINESS_POSTAL ?? '',
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL ?? '',
    phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? '',
  }

  return (
    <SettingsPanel
      integrationStatus={integrationStatus}
      businessProfile={businessProfile}
    />
  )
}
