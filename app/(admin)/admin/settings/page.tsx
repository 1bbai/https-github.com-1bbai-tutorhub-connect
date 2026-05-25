import { SettingsPanel } from '@/components/admin/SettingsPanel'

export default async function SettingsPage() {
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

  return <SettingsPanel businessProfile={businessProfile} />
}
