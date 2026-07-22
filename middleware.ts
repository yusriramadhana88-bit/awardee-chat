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
  const host = request.headers.get('host') || ''

  // Subdomain khusus: root domain langsung ke fitur utamanya
  // member.awardee.id -> /dashboard, chat.awardee.id -> /chat, alumni.awardee.id -> /alumni
  let rewriteTarget: string | null = null
  if (path === '/') {
    if (host.startsWith('member.')) rewriteTarget = '/dashboard'
    else if (host.startsWith('chat.')) rewriteTarget = '/chat'
    else if (host.startsWith('alumni.')) rewriteTarget = '/alumni'
  }
  const effectivePath = rewriteTarget || path

  // Redirect ke login kalau belum auth dan coba akses halaman protected
  if (!user && (effectivePath.startsWith('/chat') || effectivePath.startsWith('/dashboard') || effectivePath.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Proteksi admin: cek is_admin di profiles — redirect non-admin ke /dashboard
  if (user && effectivePath.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect ke chat kalau sudah login dan buka halaman auth
  if (user && (effectivePath === '/login' || effectivePath === '/register')) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  if (rewriteTarget) {
    return NextResponse.rewrite(new URL(rewriteTarget, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/chat', '/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
