import Link from 'next/link'
import { Linkedin, Mail, MapPin, Phone } from 'lucide-react'

import { Logo } from './logo'

const COLUMNS = [
  {
    title: 'Workspaces',
    links: [
      { label: 'Private offices', href: '#workspaces' },
      { label: 'Meeting rooms', href: '#services' },
      { label: 'Coworking', href: '#services' },
      { label: 'Virtual office', href: '#services' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Why us', href: '#why' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Book a tour', href: '#contact' },
      { label: 'Client login', href: '/login' },
    ],
  },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/10 bg-brand-950 text-white">
      <div className="page-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Premium serviced offices, meeting rooms and business services in
              the heart of Markham, Ontario.
            </p>
            <a
              href="https://www.linkedin.com"
              aria-label="Markham Office Services on LinkedIn"
              className="mt-5 inline-grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-bold text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="text-sm text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-display text-sm font-bold text-white">
              Get in touch
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/55">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                123 Enterprise Blvd, Suite 1200, Markham, ON
              </li>
              <li>
                <a
                  href="tel:+19055550142"
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0 text-brand-300" />
                  (905) 555-0142
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@markhamoffice.com"
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0 text-brand-300" />
                  hello@markhamoffice.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/45 sm:flex-row">
          <p>© {year} Markham Office Services. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors hover:text-white">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Terms
            </a>
            <a href="#contact" className="transition-colors hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
