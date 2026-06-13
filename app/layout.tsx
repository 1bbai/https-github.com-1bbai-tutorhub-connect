import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Toaster } from 'sonner'

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
  title: {
    default: 'Markham Office Services',
    template: '%s | Markham Office Services',
  },
  description:
    'Business management portal for Markham Office Services — manage clients, staff, invoices, and more.',
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f1a' },
  ],
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
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                'group font-sans text-sm shadow-medium border border-border/60',
              title: 'font-medium text-foreground',
              description: 'text-muted-foreground',
              actionButton:
                'bg-primary text-primary-foreground hover:bg-primary/90',
              cancelButton:
                'bg-muted text-muted-foreground hover:bg-muted/80',
              closeButton:
                'text-muted-foreground hover:text-foreground border-border/60',
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  )
}
