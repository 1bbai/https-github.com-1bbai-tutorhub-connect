'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface RevealProps {
  children: React.ReactNode
  className?: string
  /** Stagger delay in ms before the reveal animation starts. */
  delay?: number
  as?: 'div' | 'section' | 'li' | 'span'
}

/**
 * Reveals its children with a subtle upward fade the first time they scroll
 * into view. Falls back to fully visible when IntersectionObserver is missing
 * or the user prefers reduced motion (handled in CSS).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      // @ts-expect-error — ref typing across the union of allowed tags
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={cn('reveal', visible && 'is-visible', className)}
    >
      {children}
    </Tag>
  )
}
