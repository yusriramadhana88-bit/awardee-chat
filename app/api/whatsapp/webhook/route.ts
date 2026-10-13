import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { verifyMetaSignature, sendText, sendCtaUrl, splitText, sleep } from '@/lib/whatsapp'
import { runPlanner, resultItems, type Answers } from '@/lib/study-planner/planner'

// Webhook WhatsApp Cloud API (Meta). Daftarkan di App Dashboard > WhatsApp > Configuration:
//   Callback URL  : https://member.awardee.id/api/whatsapp/webhook
//   Verify token  : isi sama dengan env WHATSAPP_VERIFY_TOKEN
//   Subscribe     : field "messages"
// Alur: user mengetuk tombol di template pembuka (atau mengirim pesan) -> jendela 24 jam terbuka ->
// kita kirim hasil lengkap sebagai pesan biasa + tombol "Akses Database" (CTA URL ke lynk.id).
export const maxDuration = 60

const admin = () => createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'))
const STOP_WORDS = ['STOP', 'BERHENTI', 'UNSUBSCRIBE', 'BATAL']

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const token = loadEnvKey('WHATSAPP_VERIFY_TOKEN')
  if (token && q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === token) {
    return new NextResponse(q.get('hub.challenge') ?? '', { status: 200 })
  }
  return new NextResponse('forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!verifyMetaSignature(raw, req.headers.get('x-hub-signature-256'))) return new NextResponse('bad signature', { status: 403 })
  let payload: any
  try { payload = JSON.parse(raw) } catch { return NextResponse.json({ ok: true }) }

  const msgs: { from: string; text: string }[] = []
  for (const en of payload?.entry ?? []) for (const ch of en?.changes ?? []) for (const m of ch?.value?.messages ?? []) {
    const text = m?.text?.body ?? m?.button?.text ?? m?.button?.payload ?? m?.interactive?.button_reply?.title ?? m?.interactive?.button_reply?.id ?? ''
    if (m?.from) msgs.push({ from: String(m.from), text: String(text).trim() })
  }

  // Selalu balas 200 agar Meta tidak mengirim ulang; kegagalan dicatat di kolom wa_last_error.
  for (const m of msgs) {
    try { await handle(m.from, m.text) } catch (e: any) { console.error('[wa-webhook]', e?.message ?? e) }
  }
  return NextResponse.json({ ok: true })
}

async function handle(phone: string, text: string) {
  const db = admin()
  const up = text.toUpperCase()
  const buyUrl = loadEnvKey('STUDY_PLANNER_LYNK_URL')
  const now = new Date().toISOString()

  if (STOP_WORDS.some((w) => up === w || up.startsWith(w + ' '))) {
    await db.from('study_planner_leads').update({ wa_status: 'opted_out', opted_out_at: now }).eq('phone', phone)
    await sendText(phone, 'Baik, kamu tidak akan menerima pesan lagi dari Awardee.id. Terima kasih sudah mencoba Mini Study Planner 🙏')
    return
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: lead } = await db.from('study_planner_leads').select('id,name,answers,wa_status,results_sent_at,opted_out_at')
    .eq('phone', phone).gte('created_at', weekAgo).is('opted_out_at', null).order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (!lead) {
    await sendText(phone, 'Halo! Ini Awardee.id 👋 Untuk mendapat 2 pilihan kampus & program Australia yang cocok untukmu, isi kuis singkatnya dulu di https://awardee.id/study-planner/ (2 menit, gratis).')
    return
  }

  if (lead.results_sent_at) {
    if (up.includes('AKSES') && buyUrl) {
      await sendCtaUrl(phone, '🔓 Akses Database STUDY PLANNER by Awardee.id — sekali bayar Rp97.000, akses selamanya (promo 88 user pertama). Ketuk tombol di bawah:', 'Akses Database', buyUrl)
    }
    return
  }

  // Klaim atomik: hanya satu eksekusi yang boleh mengirim hasil (webhook Meta bisa terkirim ganda).
  const { data: claimed } = await db.from('study_planner_leads').update({ wa_status: 'results_sent', results_sent_at: now })
    .eq('id', lead.id).is('results_sent_at', null).select('id').maybeSingle()
  if (!claimed) return

  const { items } = runPlanner(lead.answers as Answers, lead.name)
  for (const it of resultItems(items)) {
    let r
    if (it.btn && buyUrl) r = await sendCtaUrl(phone, it.text, 'Akses Database', buyUrl)
    else {
      r = { ok: true } as { ok: boolean; error?: string }
      for (const part of splitText(it.text)) { r = await sendText(phone, part); if (!r.ok) break }
    }
    if (!r.ok) {
      await db.from('study_planner_leads').update({ wa_status: 'failed', wa_last_error: r.error ?? null, results_sent_at: null }).eq('id', lead.id)
      return
    }
    await sleep(900)
  }
}
