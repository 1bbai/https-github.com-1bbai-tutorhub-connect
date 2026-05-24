'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  User,
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

// ── Validation schemas ─────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[+\d\s\-().]{7,20}$/.test(val),
      'Enter a valid phone number'
    ),
  companyName: z
    .string()
    .max(150, 'Company name is too long')
    .optional(),
})

type PasswordFormValues = z.infer<typeof passwordSchema>
type ProfileFormValues = z.infer<typeof profileSchema>

type Step = 'password' | 'profile' | 'done'

// ── Main component ─────────────────────────────────────────────────────────

export default function AcceptInvitePage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState<Step>('password')
  const [sessionReady, setSessionReady] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Supabase fires INITIAL_SESSION / SIGNED_IN after consuming the invite
  // token from the URL hash automatically.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
        setSessionReady(true)
        setUserEmail(session.user.email ?? '')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
        setUserEmail(session.user.email ?? '')
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Branding */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-medium">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome to Markham Office Services
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Let&apos;s get your account set up
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Step content */}
      {step === 'password' && (
        <PasswordStep
          sessionReady={sessionReady}
          userEmail={userEmail}
          onSuccess={() => setStep('profile')}
        />
      )}
      {step === 'profile' && (
        <ProfileStep onSuccess={() => setStep('done')} />
      )}
      {step === 'done' && (
        <DoneStep router={router} />
      )}
    </div>
  )
}

// ── Step indicator ─────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'password', label: 'Set password' },
    { key: 'profile', label: 'Your profile' },
    { key: 'done', label: 'All done' },
  ]
  const currentIndex = steps.findIndex((s) => s.key === currentStep)

  return (
    <div className="mb-6 flex items-center justify-center gap-0">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${
                i < currentIndex
                  ? 'bg-success text-success-foreground'
                  : i === currentIndex
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < currentIndex ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] font-medium ${
                i === currentIndex
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-2 mb-5 h-px w-10 transition-colors ${
                i < currentIndex ? 'bg-success' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Set password ────────────────────────────────────────────────────

function PasswordStep({
  sessionReady,
  userEmail,
  onSuccess,
}: {
  sessionReady: boolean
  userEmail: string
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  })

  const passwordValue = watch('password', '')

  const checks = [
    { label: 'At least 8 characters', met: passwordValue.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(passwordValue) },
    { label: 'One number', met: /[0-9]/.test(passwordValue) },
  ]

  const onSubmit = async (values: PasswordFormValues) => {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Password set successfully!')
    onSuccess()
  }

  return (
    <Card className="border-border/60 shadow-medium">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">
          Create your password
        </CardTitle>
        <CardDescription>
          {userEmail ? (
            <>
              Setting up account for{' '}
              <span className="font-medium text-foreground">{userEmail}</span>
            </>
          ) : (
            'Choose a strong password to secure your account.'
          )}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
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

            {/* Strength checklist */}
            {passwordValue.length > 0 && (
              <ul className="mt-2 space-y-1">
                {checks.map(({ label, met }) => (
                  <li
                    key={label}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      met ? 'text-success' : 'text-muted-foreground'
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

          {/* Confirm */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
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
                Verifying your invitation link…
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting || !sessionReady}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting password…
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// ── Step 2: Complete profile ────────────────────────────────────────────────

function ProfileStep({ onSuccess }: { onSuccess: () => void }) {
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  })

  const onSubmit = async (values: ProfileFormValues) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Session expired. Please request a new invitation.')
      return
    }

    // Update display name in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: values.fullName },
    })

    if (authError) {
      toast.error(authError.message)
      return
    }

    // Upsert the public users record
    const { error: dbError } = await supabase
      .from('users')
      .update({
        full_name: values.fullName,
        phone: values.phone ?? null,
        company_name: values.companyName ?? null,
      })
      .eq('id', user.id)

    if (dbError) {
      toast.error(dbError.message)
      return
    }

    toast.success('Profile saved!')
    onSuccess()
  }

  return (
    <Card className="border-border/60 shadow-medium">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">
          Complete your profile
        </CardTitle>
        <CardDescription>
          Tell us a bit about yourself so we can personalise your experience.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Jane Smith"
                autoComplete="name"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={!!errors.fullName}
                className="pl-9"
                {...register('fullName')}
              />
            </div>
            {errors.fullName && (
              <p className="field-error" role="alert">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Phone{' '}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (647) 555-0100"
                autoComplete="tel"
                disabled={isSubmitting}
                aria-invalid={!!errors.phone}
                className="pl-9"
                {...register('phone')}
              />
            </div>
            {errors.phone && (
              <p className="field-error" role="alert">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="companyName">
              Company name{' '}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Corp"
                autoComplete="organization"
                disabled={isSubmitting}
                aria-invalid={!!errors.companyName}
                className="pl-9"
                {...register('companyName')}
              />
            </div>
            {errors.companyName && (
              <p className="field-error" role="alert">
                {errors.companyName.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving profile…
              </>
            ) : (
              <>
                Save and continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            disabled={isSubmitting}
            onClick={onSuccess}
          >
            Skip for now
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// ── Step 3: Done ───────────────────────────────────────────────────────────

function DoneStep({ router }: { router: ReturnType<typeof useRouter> }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/client/home')
      router.refresh()
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <Card className="border-border/60 shadow-medium text-center">
      <CardHeader className="pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <CardTitle className="text-lg font-semibold">
          You&apos;re all set!
        </CardTitle>
        <CardDescription className="mt-1">
          Welcome aboard. Taking you to your client portal now…
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Redirecting to your dashboard
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
