import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'


// ---- Pembeli "Akses Database STUDY PLANNER" saja (tanpa langganan bulanan) ----
// Mereka hanya boleh memakai /planner. Dicek di server (edge) untuk halaman member lain, bukan hanya di klien.
const LITE_BLOCKED = ['/dashboard', '/tracker', '/chat/', '/assessment', '/alumni']
const normPhone = (p: string) => String(p || '').replace(/\D/g, '').replace(/^(62|0)/, '').slice(-10)

async function isLiteBuyer(userId: string, email: string): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) return false
  const h = { apikey: key, Authorization: `Bearer ${key}` }
  try {
    const pr = await fetch(`${base}/rest/v1/profiles?id=eq.${userId}&select=is_admin,phone,subscription_tier,subscription_expires_at`, { headers: h })
    const prof = (await pr.json())?.[0]
    if (!prof || prof.is_admin) return false
    const now = new Date().toISOString()
    if ((prof.subscription_tier ?? 'free') !== 'free' && prof.subscription_expires_at && prof.subscription_expires_at > now) return false   // pelanggan bulanan aktif
    const phone = prof.phone ? normPhone(prof.phone) : ''
    const ors = [email && `email.eq."${email.toLowerCase().replace(/["\\]/g, '')}"`, phone.length === 10 && `phone.eq.${phone}`].filter(Boolean) as string[]
    if (!ors.length) return false
    const ar = await fetch(`${base}/rest/v1/study_planner_access?or=(${encodeURIComponent(ors.join(','))})&select=id,expires_at&limit=5`, { headers: h })
    const rows = await ar.json()
    return Array.isArray(rows) && rows.some((r: any) => !r.expires_at || r.expires_at > now)
  } catch {
    return false
  }
}

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
    else if (host.startsWith('alumnihub.')) rewriteTarget = '/alumni'
  }
  const effectivePath = rewriteTarget || path

  // Redirect ke login kalau belum auth dan coba akses halaman protected.
  // '/chat' persis (bot CS) boleh diakses guest — lihat BOTS.cs.guestAllowed di lib/bots.ts.
  // '/chat/aas' dan '/chat/lpdp' (subpath apa pun di bawah /chat/) tetap member-only.
  if (!user && (effectivePath.startsWith('/chat/') || effectivePath.startsWith('/dashboard') || effectivePath.startsWith('/admin'))) {
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

  // Corong khusus pembeli database: /planner wajib login; pembeli "lite" tidak boleh ke halaman member lain.
  if (!user && effectivePath.startsWith('/planner')) {
    return NextResponse.redirect(new URL('/login?next=/planner', request.url))
  }
  let lite: boolean | null = null
  if (user && LITE_BLOCKED.some((b) => effectivePath === b.replace(/\/$/, '') || effectivePath.startsWith(b.endsWith('/') ? b : b + '/'))) {
    lite = await isLiteBuyer(user.id, user.email ?? '')
    if (lite) return NextResponse.redirect(new URL('/planner', request.url))
  }

  // Redirect kalau sudah login dan buka halaman auth (hormati ?next=, pembeli lite selalu ke /planner)
  if (user && (effectivePath === '/login' || effectivePath === '/register')) {
    if (lite === null) lite = await isLiteBuyer(user.id, user.email ?? '')
    const nx = request.nextUrl.searchParams.get('next')
    const safeNext = nx && nx.startsWith('/') && !nx.startsWith('//') ? nx : null
    return NextResponse.redirect(new URL(lite ? '/planner' : (safeNext ?? '/chat'), request.url))
  }

  if (rewriteTarget) {
    return NextResponse.rewrite(new URL(rewriteTarget, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/chat/:path*', '/dashboard/:path*', '/admin/:path*', '/tracker/:path*', '/assessment/:path*', '/alumni/:path*', '/planner/:path*', '/login', '/register'],
}
