import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DASHBOARD_MAP: Record<string, string> = {
  admin: '/admin/dashboard',
  staff: '/staff/dashboard',
  client: '/client/home',
}

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  return (profile as { role?: string } | null)?.role ?? 'client'
}

export async function middleware(request: NextRequest) {
  // Bootstrap the response so Supabase SSR can mutate cookies.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propagate to request first (required by @supabase/ssr internals)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Rebuild the response with the updated request so cookies propagate
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() refreshes the session token and must come before any
  // routing logic.  Do NOT use getSession() here — it trusts the cookie and
  // doesn't validate with the Supabase server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = isPublicRoute(pathname)

  // Helper: create a redirect that carries Supabase session cookies through.
  function redirect(url: URL) {
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie))
    return res
  }

  // ── API routes — never redirect, let the handler decide ─────────────────
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!user) {
    if (pathname === '/') {
      return redirect(new URL('/login', request.url))
    }
    if (!isPublic) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return redirect(loginUrl)
    }
    return supabaseResponse
  }

  // ── Authenticated ────────────────────────────────────────────────────────

  // Redirect away from auth pages and root to the appropriate dashboard
  if (isPublic || pathname === '/') {
    const role = await getUserRole(supabase, user.id)
    const destination = DASHBOARD_MAP[role] ?? DASHBOARD_MAP.client
    return redirect(new URL(destination, request.url))
  }

  // Role-based access control for protected sub-trees
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/client')
  ) {
    const role = await getUserRole(supabase, user.id)

    if (pathname.startsWith('/admin') && role !== 'admin') {
      const destination = DASHBOARD_MAP[role] ?? '/login'
      return redirect(new URL(destination, request.url))
    }

    if (pathname.startsWith('/staff') && !['admin', 'staff'].includes(role)) {
      const destination = DASHBOARD_MAP[role] ?? '/login'
      return redirect(new URL(destination, request.url))
    }

    if (pathname.startsWith('/client') && role !== 'client') {
      const destination = DASHBOARD_MAP[role] ?? '/login'
      return redirect(new URL(destination, request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimization)
     *  - favicon.ico
     *  - common image extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
