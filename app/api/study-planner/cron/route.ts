import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { waConfigured, sendTemplate, sleep } from '@/lib/whatsapp'

// Vercel Cron (lihat vercel.json), 02:00 UTC = 09:00 WIB. Mengirim penawaran "Akses Database" ke lead yang
// sudah menerima hasil >= 20 jam lalu. Pesan di luar jendela 24 jam wajib template (kategori marketing).
export const maxDuration = 60

const admin = () => createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'))

export async function GET(req: NextRequest) {
  const secret = loadEnvKey('CRON_SECRET')
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse('forbidden', { status: 403 })
  if (!waConfigured()) return NextResponse.json({ ok: true, skipped: 'whatsapp belum dikonfigurasi' })

  const db = admin()
  const from = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const to = new Date(Date.now() - 20 * 3600 * 1000).toISOString()
  const { data: leads } = await db.from('study_planner_leads').select('id,name,phone')
    .eq('wa_status', 'results_sent').is('offer_sent_at', null).is('opted_out_at', null)
    .gte('results_sent_at', from).lte('results_sent_at', to).limit(150)

  let sent = 0, failed = 0
  for (const l of leads ?? []) {
    const r = await sendTemplate(l.phone, loadEnvKey('WHATSAPP_TEMPLATE_OFFER') || 'study_planner_penawaran', [l.name])
    if (r.ok) { sent++; await db.from('study_planner_leads').update({ wa_status: 'offer_sent', offer_sent_at: new Date().toISOString() }).eq('id', l.id) }
    else { failed++; await db.from('study_planner_leads').update({ offer_sent_at: new Date().toISOString(), wa_last_error: r.error ?? null }).eq('id', l.id) }
    await sleep(250)
  }
  return NextResponse.json({ ok: true, sent, failed })
}
