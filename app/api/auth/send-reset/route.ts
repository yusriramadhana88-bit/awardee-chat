import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { createPasswordLink } from '@/lib/auth-links'
import { sendPasswordResetEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Throttle sederhana per email (per instance) supaya endpoint tidak dipakai membanjiri inbox orang lain.
const lastSent = new Map<string, number>()

// Selalu membalas ok (tidak membocorkan apakah email terdaftar).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ ok: false, error: 'Email tidak valid.' }, { status: 400 })
  const now = Date.now()
  if ((lastSent.get(email) ?? 0) > now - 60_000) return NextResponse.json({ ok: true })
  lastSent.set(email, now)
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'))
    const url = await createPasswordLink(supabase, email)
    if (url) await sendPasswordResetEmail(email, url)
  } catch (e) {
    console.error('[send-reset]', e)
  }
  return NextResponse.json({ ok: true })
}
