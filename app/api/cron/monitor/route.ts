import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { sendMonitorEmail } from '@/lib/email'
import { createPasswordLink } from '@/lib/auth-links'
import { LYNK_MEMBERSHIP_LINKS } from '@/lib/payment-links'

// Pemantau harian (vercel.json, 01:00 UTC = 08:00 WIB). Menutup masalah client yang paling sering terjadi
// tanpa menunggu laporan manual, dan hanya melapor ke admin bila ada yang butuh keputusan manusia.
// 1) Akun berbayar yang belum pernah login (>=24 jam) -> kirim ulang link buat password (maks 2x).
// 2) Tier habis <=3 hari -> email pengingat + link perpanjang (sekali per masa aktif).
// 3) Kegagalan webhook lynk 25 jam terakhir -> ringkasan ke admin.
export const maxDuration = 60

const ADMIN_EMAIL = 'yusri.ramadhana88@gmail.com'
const TIER_LABEL: Record<string, string> = { starter: 'Starter', vip: 'VIP', vvip: 'VVIP' }

export async function GET(req: NextRequest) {
  const secret = loadEnvKey('CRON_SECRET')
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse('forbidden', { status: 403 })

  const db = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'))
  const now = Date.now()
  const report: string[] = []
  let pwSent = 0, expSent = 0

  // Profil berbayar (tier != free)
  const { data: paid } = await db.from('profiles').select('id, subscription_tier, subscription_expires_at').neq('subscription_tier', 'free')
  const paidMap = new Map((paid ?? []).map((p: any) => [p.id, p]))

  // Pengguna auth (dipaginasi, cukup untuk skala ini)
  const users: any[] = []
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) break
    users.push(...data.users)
    if (data.users.length < 200) break
  }

  for (const u of users) {
    const prof: any = paidMap.get(u.id)
    if (!prof || !u.email) continue
    const mon = (u.app_metadata?.monitor ?? {}) as { pw_reminders?: number; pw_last?: string; expiry_notice?: string }
    let changed = false

    // 1) Belum pernah login
    const age = now - new Date(u.created_at).getTime()
    const lastTry = mon.pw_last ? now - new Date(mon.pw_last).getTime() : Infinity
    if (!u.last_sign_in_at && age >= 24 * 3600e3 && age <= 14 * 24 * 3600e3 && (mon.pw_reminders ?? 0) < 2 && lastTry >= 24 * 3600e3) {
      const url = await createPasswordLink(db as any, u.email)
      if (url) {
        const ok = await sendMonitorEmail(u.email, 'Akun AWARDEE APP kamu sudah siap, tinggal buat password',
          `<h2 style="color:#0f172a;">Akunmu sudah aktif 🎉</h2><p>Paket <strong>${TIER_LABEL[prof.subscription_tier] ?? prof.subscription_tier}</strong> kamu sudah aktif, tapi kamu belum pernah masuk. Klik tombol di bawah untuk membuat password. Link berlaku 1 jam; kalau sudah kedaluwarsa, buka halaman tersebut lalu masukkan emailmu untuk minta link baru. Gunakan email yang paling baru saja.</p>`,
          { label: 'Buat password & masuk', url })
        if (ok) { pwSent++; mon.pw_reminders = (mon.pw_reminders ?? 0) + 1; mon.pw_last = new Date().toISOString(); changed = true }
      }
    }

    // 2) Tier hampir habis
    const exp = prof.subscription_expires_at ? new Date(prof.subscription_expires_at).getTime() : 0
    if (exp && exp > now && exp - now <= 3 * 24 * 3600e3 && mon.expiry_notice !== prof.subscription_expires_at) {
      const tier = (prof.subscription_tier as 'starter' | 'vip' | 'vvip')
      const label = new Date(exp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      const ok = await sendMonitorEmail(u.email, `Paket ${TIER_LABEL[tier] ?? tier} kamu berakhir ${label}`,
        `<h2 style="color:#0f172a;">Paketmu segera berakhir</h2><p>Paket <strong>${TIER_LABEL[tier] ?? tier}</strong> kamu aktif sampai <strong>${label}</strong>. Perpanjang sebelum tanggal itu supaya tracker, modul, dan fitur lainnya tetap terbuka. Pakai email yang sama dengan akunmu saat bayar, dan akses akan otomatis diperpanjang.</p>`,
        LYNK_MEMBERSHIP_LINKS[tier] ? { label: 'Perpanjang paket', url: LYNK_MEMBERSHIP_LINKS[tier] } : undefined)
      if (ok) { expSent++; mon.expiry_notice = prof.subscription_expires_at; changed = true }
    }

    if (changed) await db.auth.admin.updateUserById(u.id, { app_metadata: { ...(u.app_metadata ?? {}), monitor: mon } })
  }

  // 3) Kegagalan webhook
  const since = new Date(now - 25 * 3600e3).toISOString()
  const { data: fails } = await db.from('lynk_webhook_log').select('status, customer_email, item_title, error, created_at')
    .in('status', ['unmatched_user', 'unmatched_product', 'update_failed']).gte('created_at', since).limit(20)
  if (fails?.length) report.push(`${fails.length} pembayaran lynk gagal diproses otomatis:<br>` + fails.map((f: any) => `• ${f.customer_email ?? '-'} — ${f.item_title} — ${f.status}: ${f.error ?? ''}`).join('<br>'))
  if (pwSent) report.push(`${pwSent} client belum pernah login dan sudah dikirimi ulang link buat password.`)
  if (expSent) report.push(`${expSent} client diingatkan paketnya hampir habis.`)

  if (report.length) await sendMonitorEmail(ADMIN_EMAIL, 'Laporan pemantau AWARDEE APP', `<h2 style="color:#0f172a;">Laporan harian</h2><p>${report.join('</p><p>')}</p>`)
  return NextResponse.json({ ok: true, pwSent, expSent, failures: fails?.length ?? 0 })
}
