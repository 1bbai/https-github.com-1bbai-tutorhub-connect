import type { Metadata } from 'next'

import { MarketingNav } from '@/components/marketing/nav'
import { Hero } from '@/components/marketing/hero'
import { TrustedBy } from '@/components/marketing/trusted-by'
import { Services } from '@/components/marketing/services'
import { Workspaces } from '@/components/marketing/workspaces'
import { WhyUs } from '@/components/marketing/why-us'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Pricing } from '@/components/marketing/pricing'
import { Testimonials } from '@/components/marketing/testimonials'
import { Contact } from '@/components/marketing/contact'
import { Footer } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Markham Office Services — Premium Serviced Offices & Meeting Rooms',
  description:
    'Private offices, meeting rooms, coworking and a prestige business address in the heart of Markham, Ontario. Flexible month-to-month plans, all-inclusive pricing, managed through one effortless portal.',
  keywords: [
    'serviced offices Markham',
    'meeting room rental Markham',
    'coworking Markham',
    'virtual office Ontario',
    'private office space',
    'business address Markham',
  ],
  metadataBase: new URL('https://markhamoffice.com'),
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://markhamoffice.com' },
  openGraph: {
    type: 'website',
    title: 'Markham Office Services — Workspaces that make your business look the part',
    description:
      'Premium serviced offices, meeting rooms and business services in Markham, Ontario. Move in today, scale on your terms.',
    url: 'https://markhamoffice.com',
    siteName: 'Markham Office Services',
  },
}

export default function HomePage() {
  return (
    <main className="bg-background">
      {/* Ensure scroll-reveal content is visible if JavaScript is unavailable */}
      <noscript>
        <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
      <MarketingNav />
      <Hero />
      <TrustedBy />
      <Services />
      <Workspaces />
      <WhyUs />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  )
}
