import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { loadEnvKey } from '@/lib/env'
import { studyPlannerBuyUrl } from '@/lib/study-planner/buy'
import { sanitizeAnswers, runPlanner, resultItems } from '@/lib/study-planner/planner'
import { waConfigured, toWaNumber, sendTemplate } from '@/lib/whatsapp'

// Halaman kuis di https://awardee.id/study-planner/ (situs statis, origin terpisah) mem-POST ke sini.
// Jawaban dihitung DI SERVER — database lengkap tidak pernah dikirim ke browser.
export const maxDuration = 30

const ALLOWED_ORIGINS = ['https://awardee.id', 'https://www.awardee.id']
if (process.env.NODE_ENV !== 'production') ALLOWED_ORIGINS.push('http://127.0.0.1:8765', 'http://localhost:8765')

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

const admin = () => createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'))

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get('origin')) })
}

export async function POST(req: NextRequest) {
  const headers = cors(req.headers.get('origin'))
  const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status, headers })
  try {
    const origin = req.headers.get('origin')
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) return fail('Origin tidak diizinkan', 403)

    const body = await req.json().catch(() => null)
    if (!body) return fail('Permintaan tidak valid')
    if (body.hp) return NextResponse.json({ ok: true, mode: 'web', items: [] }, { headers }) // honeypot: bot diam-diam dibuang

    const name = String(body.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
    const phone = toWaNumber(String(body.phone ?? ''))
    if (!name) return fail('Isi nama panggilanmu dulu ya.')
    if (!phone) return fail('Nomor WhatsApp belum valid. Contoh: 812 3456 7890')
    if (body.consent !== true) return fail('Centang persetujuan dulu supaya kami bisa mengirim hasilnya.')
    const answers = sanitizeAnswers(body.answers)
    if (!answers) return fail('Jawaban kuis tidak lengkap. Muat ulang halaman lalu coba lagi.')

    const db = admin()
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const ipHash = crypto.createHash('sha256').update(ip + '|sp-salt').digest('hex').slice(0, 32)

    // Batas laju: cegah penyalahgunaan (kirim WA ke nomor orang lain / membakar kuota template).
    const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const hourAgo = new Date(Date.now() - 3600 * 1000).toISOString()
    const [byIp, byPhone] = await Promise.all([
      db.from('study_planner_leads').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', hourAgo),
      db.from('study_planner_leads').select('id', { count: 'exact', head: true }).eq('phone', phone).gte('created_at', dayAgo),
    ])
    if ((byIp.count ?? 0) >= 8) return fail('Terlalu banyak percobaan dari jaringan ini. Coba lagi nanti.', 429)
    if ((byPhone.count ?? 0) >= 3) return fail('Nomor ini sudah beberapa kali dipakai hari ini. Coba lagi besok.', 429)

    // Nomor yang pernah STOP tidak boleh dikirimi WA lagi — hasil ditampilkan di halaman saja.
    const { data: optedOut } = await db.from('study_planner_leads').select('id').eq('phone', phone).not('opted_out_at', 'is', null).limit(1)
    const blocked = !!optedOut?.length

    const { items, picks, total, unis } = runPlanner(answers, name)
    const useWa = waConfigured() && !blocked
    const utm = typeof body.utm === 'object' && body.utm ? Object.fromEntries(Object.entries(body.utm).slice(0, 8).map(([k, v]) => [String(k).slice(0, 30), String(v).slice(0, 120)])) : null
    const now = new Date().toISOString()

    const { data: row, error } = await db.from('study_planner_leads').insert({
      name, phone, consent: true, consent_at: now, answers, picks: { picks, total, unis },
      mode: useWa ? 'whatsapp' : 'web', wa_status: 'none', utm,
      fbp: String(body.fbp ?? '').slice(0, 120) || null, fbc: String(body.fbc ?? '').slice(0, 200) || null,
      event_id: String(body.event_id ?? '').slice(0, 80) || null, ip_hash: ipHash,
      user_agent: (req.headers.get('user-agent') || '').slice(0, 300),
    }).select('id').single()
    if (error || !row) return fail('Gagal menyimpan. Coba lagi sebentar lagi.', 500)

    const buyUrl = studyPlannerBuyUrl()
    const waNumber = loadEnvKey('STUDY_PLANNER_WA_NUMBER') || '6281287212755'

    if (useWa) {
      // Pesan pembuka = template (disetujui Meta) dengan tombol balasan cepat. Ketukan user membuka jendela 24 jam,
      // lalu webhook mengirim hasil lengkap. Jika template gagal terkirim, jatuh ke tampilan di halaman.
      const r = await sendTemplate(phone, loadEnvKey('WHATSAPP_TEMPLATE_RESULT') || 'study_planner_hasil', [name])
      if (r.ok) {
        await db.from('study_planner_leads').update({ wa_status: 'template_sent' }).eq('id', row.id)
        return NextResponse.json({ ok: true, mode: 'whatsapp', total, unis, wa_link: `https://wa.me/${waNumber}?text=${encodeURIComponent('Halo, saya mau terima hasil Mini Study Planner')}` }, { headers })
      }
      await db.from('study_planner_leads').update({ wa_status: 'failed', wa_last_error: r.error ?? null, mode: 'web' }).eq('id', row.id)
    }

    return NextResponse.json({ ok: true, mode: 'web', total, unis, items: resultItems(items), cta: buyUrl, wa_link: `https://wa.me/${waNumber}` }, { headers })
  } catch {
    return fail('Server error', 500)
  }
}
