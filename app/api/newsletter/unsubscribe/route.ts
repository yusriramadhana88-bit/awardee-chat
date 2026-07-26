import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { computeUnsubscribeToken } from '@/lib/newsletter'

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

// GET (bukan POST) supaya bisa jadi link langsung diklik dari email — public, tanpa login,
// diverifikasi via token HMAC per-profil (lihat lib/newsletter.ts).
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? ''
  const token = req.nextUrl.searchParams.get('token') ?? ''

  const html = (message: string) => new NextResponse(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Berhenti Berlangganan — Awardee.id</title>
    <style>body{font-family:-apple-system,sans-serif;background:#FFFBEF;color:#1d1d1f;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;text-align:center}
    .card{background:#fff;border-radius:18px;padding:32px;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    a{color:#D9A916}</style></head>
    <body><div class="card"><p>${message}</p><p><a href="https://member.awardee.id/dashboard">Kembali ke AWARDEE APP</a></p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )

  if (!uid || !token) {
    return html('Link tidak valid.')
  }

  const expectedToken = computeUnsubscribeToken(uid)
  if (token !== expectedToken) {
    return html('Link tidak valid atau sudah kedaluwarsa.')
  }

  const admin = getAdminSupabase()
  const { error } = await admin
    .from('profiles')
    .update({ newsletter_opt_in: false, newsletter_unsubscribed_at: new Date().toISOString() })
    .eq('id', uid)

  if (error) {
    return html('Gagal memproses permintaan. Coba lagi nanti atau hubungi tim kami.')
  }

  return html('Kamu berhasil berhenti berlangganan newsletter beasiswa Awardee.id. Kamu masih tetap jadi member dan bisa aktifkan lagi kapan saja lewat halaman Profil.')
}
