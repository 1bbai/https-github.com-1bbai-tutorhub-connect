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
  title: 'MarkhamOffice.com — Virtual Offices, Executive Suites & Meeting Rooms',
  description:
    'Prestige Markham business address, furnished executive office suites, and member-rate meeting rooms — plus FREE business registration with a virtual office. Helping Markham businesses start and grow since 2005. 3601 Highway 7 East, Markham, ON.',
  keywords: [
    'virtual office Markham',
    'business address Markham',
    'executive office suites Markham',
    'meeting room rental Markham',
    'business registration Markham',
    'company incorporation Ontario',
  ],
  metadataBase: new URL('https://markhamoffice.com'),
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://markhamoffice.com' },
  openGraph: {
    type: 'website',
    title: 'MarkhamOffice.com — Workspaces that make your business look the part',
    description:
      'Virtual offices, executive suites, meeting rooms and free business registration in Markham, Ontario. Trusted since 2005.',
    url: 'https://markhamoffice.com',
    siteName: 'MarkhamOffice.com',
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
