'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Building2, CheckCircle2, Loader2, Mail } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (values: ForgotFormValues) => {
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSubmittedEmail(values.email)
    setSubmitted(true)
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-medium">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>

        <Card className="border-border/60 shadow-medium text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-lg font-semibold">Check your inbox</CardTitle>
            <CardDescription className="mt-1">
              We&apos;ve sent a password reset link to{' '}
              <span className="font-medium text-foreground">{submittedEmail}</span>.
              It may take a minute or two to arrive.
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-2">
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-left">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The link expires in 1 hour. If you don&apos;t see the email,
                  check your spam folder.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSubmitted(false)
                setSubmittedEmail('')
              }}
            >
              Try a different email
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Logo / Branding */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-medium">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Markham Office Services
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Business management portal
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-medium">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-semibold">Reset your password</CardTitle>
          <CardDescription>
            Enter the email associated with your account and we&apos;ll send a
            reset link.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="field-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link…
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
