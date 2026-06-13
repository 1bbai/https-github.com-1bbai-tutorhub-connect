import Link from 'next/link'
import { Linkedin, Mail, MapPin, Phone } from 'lucide-react'

import { Logo } from './logo'

const COLUMNS = [
  {
    title: 'Services',
    links: [
      { label: 'Virtual office', href: '#services' },
      { label: 'Executive suites', href: '#workspaces' },
      { label: 'Meeting rooms', href: '#services' },
      { label: 'Business registration', href: '#services' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Why us', href: '#why' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Book a tour', href: '#contact' },
      { label: 'Client login', href: 'https://my.markhamoffice.com/login' },
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
              Virtual offices, executive suites, meeting rooms and free business
              registration in Markham, Ontario — helping businesses start and
              grow since 2005.
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
                3601 Highway 7 East, Suite 1005, Markham, ON L3R 0M3
              </li>
              <li>
                <a
                  href="tel:+19053057800"
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4 shrink-0 text-brand-300" />
                  (905) 305-7800
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@markhamoffice.com"
                  className="flex items-center gap-2.5 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0 text-brand-300" />
                  info@markhamoffice.com
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
