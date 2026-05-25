'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Building2, Eye, EyeOff } from 'lucide-react'

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

const signupSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^[+\d\s\-().]{7,20}$/, 'Enter a valid phone number'),
    company_name: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (values: SignupFormValues) => {
    const full_name = `${values.first_name.trim()} ${values.last_name.trim()}`

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name, role: 'client' },
      },
    })

    if (error) {
      toast.error(error.message)
      return
    }

    if (!data.user) {
      toast.error('Something went wrong. Please try again.')
      return
    }

    // Update phone + company on the profile row the trigger just created
    const { error: profileError } = await supabase
      .from('users')
      .update({
        phone: values.phone,
        company_name: values.company_name?.trim() || null,
      })
      .eq('id', data.user.id)

    if (profileError) {
      // Non-fatal: user exists, profile partially set
      console.error('Profile update failed:', profileError.message)
    }

    if (data.session) {
      // Email confirmation is disabled — user is immediately active
      toast.success('Account created! Welcome to Markham Office Services.')
      window.location.href = '/client/home'
    } else {
      // Email confirmation is enabled — ask them to check their inbox
      toast.success('Almost there! Check your email to confirm your account.')
    }
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      {/* Branding */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-medium">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Markham Office Services
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Create your client account</p>
        </div>
      </div>

      <Card className="border-border/60 shadow-medium">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-semibold">Sign up</CardTitle>
          <CardDescription>Fill in your details to get started</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  placeholder="Jane"
                  autoComplete="given-name"
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={!!errors.first_name}
                  {...register('first_name')}
                />
                {errors.first_name && (
                  <p className="field-error" role="alert">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  placeholder="Smith"
                  autoComplete="family-name"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.last_name}
                  {...register('last_name')}
                />
                {errors.last_name && (
                  <p className="field-error" role="alert">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="field-error" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (416) 555-0100"
                autoComplete="tel"
                disabled={isSubmitting}
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="field-error" role="alert">{errors.phone.message}</p>
              )}
            </div>

            {/* Business name */}
            <div className="space-y-1.5">
              <Label htmlFor="company_name">
                Business name{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="company_name"
                placeholder="Acme Corp"
                autoComplete="organization"
                disabled={isSubmitting}
                {...register('company_name')}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  disabled={isSubmitting}
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="field-error" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.confirm_password}
                  className="pr-10"
                  {...register('confirm_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="field-error" role="alert">{errors.confirm_password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Need help?{' '}
        <a
          href="mailto:support@markhamoffice.com"
          className="underline underline-offset-4 hover:text-primary transition-colors"
        >
          Contact support
        </a>
      </p>
    </div>
  )
}
