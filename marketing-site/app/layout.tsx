import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Display typeface for marketing headings (Trust & Authority pairing).
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://markhamoffice.com'),
  title: {
    default: 'MarkhamOffice.com — Virtual Offices, Executive Suites & Meeting Rooms',
    template: '%s | MarkhamOffice.com',
  },
  description:
    'Prestige Markham business address, furnished executive office suites, and member-rate meeting rooms — plus FREE business registration with a virtual office. Helping Markham businesses start and grow since 2005.',
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0f1b3d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
