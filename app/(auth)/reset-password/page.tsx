'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

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

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

const DASHBOARD_MAP: Record<string, string> = {
  admin: '/admin/dashboard',
  staff: '/staff/dashboard',
  client: '/client/home',
}

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  const passwordValue = watch('password', '')

  // Supabase automatically exchanges the recovery token from the URL hash
  // and fires an INITIAL_SESSION / PASSWORD_RECOVERY event.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') {
        setSessionReady(true)
      }
    })

    // Also check if a session is already present (page refresh scenario)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: ResetFormValues) => {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    setSuccess(true)

    // Fetch role and redirect after a brief moment
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = (profile as { role?: string } | null)?.role ?? 'client'
      const destination = DASHBOARD_MAP[role] ?? DASHBOARD_MAP.client

      setTimeout(() => {
        router.push(destination)
        router.refresh()
      }, 1500)
    }
  }

  // ── Password strength indicators ──────────────────────────────────────────
  const checks = [
    { label: 'At least 8 characters', met: passwordValue.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(passwordValue) },
    { label: 'One number', met: /[0-9]/.test(passwordValue) },
  ]

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="w-full max-w-sm animate-fade-in">
        <BrandLogo />
        <Card className="border-border/60 shadow-medium text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-lg font-semibold">
              Password updated
            </CardTitle>
            <CardDescription className="mt-1">
              Your password has been changed successfully. Redirecting you to
              your dashboard…
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <BrandLogo />

      <Card className="border-border/60 shadow-medium">
        <CardHeader className="space-y-1 pb-4">
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">
            Set a new password
          </CardTitle>
          <CardDescription>
            Choose a strong password to secure your account.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  autoFocus
                  disabled={isSubmitting || !sessionReady}
                  aria-invalid={!!errors.password}
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="field-error" role="alert">
                  {errors.password.message}
                </p>
              )}

              {/* Password strength checklist */}
              {passwordValue.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {checks.map(({ label, met }) => (
                    <li
                      key={label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        met
                          ? 'text-success'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          met ? 'bg-success' : 'bg-muted-foreground/40'
                        }`}
                      />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isSubmitting || !sessionReady}
                  aria-invalid={!!errors.confirmPassword}
                  className="pr-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="field-error" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {!sessionReady && (
              <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verifying your reset link…
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !sessionReady}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password…
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

function BrandLogo() {
  return (
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
  )
}
