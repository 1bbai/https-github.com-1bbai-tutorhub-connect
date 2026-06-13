'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const PLAN_OPTIONS = [
  'Private office',
  'Flex membership',
  'Virtual office',
  'Meeting rooms',
  'Not sure yet',
]

/**
 * Lead-capture form. With no marketing backend wired up, submitting composes a
 * pre-filled email to the sales inbox — functional on every device, no API
 * surface to maintain.
 */
export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '')
    const company = String(data.get('company') ?? '')
    const interest = String(data.get('interest') ?? '')
    const message = String(data.get('message') ?? '')

    const subject = encodeURIComponent(`Tour request — ${interest || 'Workspace'}`)
    const body = encodeURIComponent(
      `Name: ${name}\nCompany: ${company}\nInterested in: ${interest}\n\n${message}`
    )
    window.location.href = `mailto:hello@markhamoffice.com?subject=${subject}&body=${body}`
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur">
        <CheckCircle2 className="h-12 w-12 text-green-400" />
        <h3 className="mt-4 font-display text-xl font-bold text-white">
          Thank you — check your email client
        </h3>
        <p className="mt-2 max-w-sm text-sm text-white/65">
          We&apos;ve opened a pre-filled message to our team. Hit send and
          we&apos;ll reply within one business day to arrange your tour.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-semibold text-gold underline-offset-4 hover:underline"
        >
          Send another request
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Jordan Avery"
            className={inputClass}
          />
        </Field>
        <Field label="Company" htmlFor="company">
          <input
            id="company"
            name="company"
            placeholder="Acme Inc."
            autoComplete="organization"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="I'm interested in" htmlFor="interest">
          <select id="interest" name="interest" className={inputClass} defaultValue="">
            <option value="" disabled>
              Select an option
            </option>
            {PLAN_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="text-foreground">
                {opt}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Anything we should know? (optional)" htmlFor="message">
          <textarea
            id="message"
            name="message"
            rows={3}
            placeholder="Team size, move-in date, must-haves…"
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>

      <button
        type="submit"
        className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-gold-foreground shadow-[0_12px_30px_-8px_hsl(var(--gold)/0.8)] transition-all hover:-translate-y-0.5"
      >
        Request my tour
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </button>
      <p className="mt-3 text-center text-xs text-white/45">
        No obligation. We typically reply within one business day.
      </p>
    </form>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-gold/60 focus:ring-2 focus:ring-gold/30'

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/70">
        {label}
      </span>
      {children}
    </label>
  )
}
