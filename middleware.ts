import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Redirect ke login kalau belum auth dan coba akses halaman protected
  if (!user && (path.startsWith('/chat') || path.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect ke chat kalau sudah login dan buka halaman auth
  if (user && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/chat', '/dashboard', '/login', '/register'],
}
