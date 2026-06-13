import { Clock, Mail, MapPin, Phone } from 'lucide-react'

import { ContactForm } from './contact-form'
import { Reveal } from './reveal'

const DETAILS = [
  {
    icon: MapPin,
    label: 'Visit us',
    value: '123 Enterprise Blvd, Suite 1200\nMarkham, ON L3R 0B8',
    href: 'https://maps.google.com/?q=Markham+Ontario',
  },
  {
    icon: Phone,
    label: 'Call us',
    value: '(905) 555-0142',
    href: 'tel:+19055550142',
  },
  {
    icon: Mail,
    label: 'Email us',
    value: 'hello@markhamoffice.com',
    href: 'mailto:hello@markhamoffice.com',
  },
  {
    icon: Clock,
    label: 'Office hours',
    value: 'Mon–Fri · 8:00am – 6:00pm\n24/7 access for members',
  },
]

export function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-brand-950 py-20 text-white lg:py-28"
    >
      {/* aurora accents */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="aurora-blob right-[-8%] top-[-10%] h-[26rem] w-[26rem] animate-aurora bg-brand-600/30" />
        <div
          className="aurora-blob bottom-[-15%] left-[-8%] h-[24rem] w-[24rem] animate-aurora bg-gold/15"
          style={{ animationDelay: '-8s' }}
        />
      </div>

      <div className="page-container grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">
            Book a tour
          </span>
          <h2 className="display mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Come see your{' '}
            <span className="text-gradient-gold">future workspace</span>
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/70">
            Tell us a little about your team and we&apos;ll set up a private
            tour — or answer any question on the spot. No pressure, no
            obligation.
          </p>

          <dl className="mt-9 grid gap-5 sm:grid-cols-2">
            {DETAILS.map((d) => {
              const Icon = d.icon
              const content = (
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-white/45">
                      {d.label}
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-line text-sm font-medium text-white/85">
                      {d.value}
                    </dd>
                  </div>
                </div>
              )
              return d.href ? (
                <a
                  key={d.label}
                  href={d.href}
                  className="rounded-2xl p-1 transition-colors hover:bg-white/5"
                >
                  {content}
                </a>
              ) : (
                <div key={d.label} className="p-1">
                  {content}
                </div>
              )
            })}
          </dl>
        </Reveal>

        <Reveal delay={120}>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  )
}
