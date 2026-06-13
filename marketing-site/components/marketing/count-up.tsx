'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  /** Target value to count toward. */
  value: number
  /** Rendered before the number, e.g. "$". */
  prefix?: string
  /** Rendered after the number, e.g. "+", "%", "k". */
  suffix?: string
  /** Decimal places to display. */
  decimals?: number
  durationMs?: number
  className?: string
}

/**
 * Animates a number from 0 to `value` once it scrolls into view.
 * Respects reduced-motion by snapping straight to the final value.
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  durationMs = 1800,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const run = () => {
      if (started.current) return
      started.current = true

      if (prefersReduced) {
        setDisplay(value)
        return
      }

      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1)
        // easeOutExpo for a snappy, premium settle
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setDisplay(value * eased)
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run()
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [value, durationMs])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
