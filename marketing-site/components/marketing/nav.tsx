'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Logo } from './logo'

const LINKS = [
  { label: 'Workspaces', href: '#workspaces' },
  { label: 'Services', href: '#services' },
  { label: 'Why us', href: '#why' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/10 bg-brand-950/80 py-2 backdrop-blur-xl supports-[backdrop-filter]:bg-brand-950/65'
          : 'border-b border-transparent bg-transparent py-4'
      )}
    >
      <nav className="page-container flex items-center justify-between">
        <Link href="/" aria-label="Markham Office Services — home">
          <Logo tone="light" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="https://my.markhamoffice.com/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:text-white"
          >
            Client login
          </Link>
          <a
            href="#contact"
            className="group inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-[0_8px_24px_-6px_hsl(var(--gold)/0.7)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-6px_hsl(var(--gold)/0.8)]"
          >
            Book a tour
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          'overflow-hidden border-t border-white/10 bg-brand-950/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden',
          open ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="page-container flex flex-col gap-1 py-4">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="https://my.markhamoffice.com/login"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Client login
            </Link>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-gold px-4 py-3 text-center text-sm font-semibold text-gold-foreground"
            >
              Book a tour
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
