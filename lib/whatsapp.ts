import crypto from 'crypto'
import { loadEnvKey } from './env'

// WhatsApp Business Cloud API (Meta). Semua fungsi aman dipanggil walau belum dikonfigurasi:
// waConfigured() false -> pemanggil harus jatuh ke mode "hasil tampil di web".
//
// Env yang dibutuhkan (isi di .env.local dan Vercel Environment Variables):
//   WHATSAPP_ACCESS_TOKEN     token System User permanen (bukan token 24 jam)
//   WHATSAPP_PHONE_NUMBER_ID  ID nomor pengirim di WhatsApp Manager (bukan nomor teleponnya)
//   WHATSAPP_VERIFY_TOKEN     string bebas, dipakai saat verifikasi webhook di dashboard Meta
//   WHATSAPP_APP_SECRET       App Secret aplikasi Meta (untuk verifikasi tanda tangan webhook)
const GRAPH = 'https://graph.facebook.com/v21.0'

export function waConfigured(): boolean {
  return !!(loadEnvKey('WHATSAPP_ACCESS_TOKEN') && loadEnvKey('WHATSAPP_PHONE_NUMBER_ID'))
}

/** "0812 3456 7890" / "+62 812..." / "812..." -> "628123456789 0" (digit saja, awalan 62). null bila tidak valid. */
export function toWaNumber(raw: string): string | null {
  let d = String(raw || '').replace(/\D/g, '')
  if (d.startsWith('62')) d = d.slice(2)
  else if (d.startsWith('0')) d = d.slice(1)
  return /^8\d{8,11}$/.test(d) ? '62' + d : null
}

type WaResult = { ok: boolean; error?: string }

async function post(payload: Record<string, unknown>): Promise<WaResult> {
  const token = loadEnvKey('WHATSAPP_ACCESS_TOKEN'), id = loadEnvKey('WHATSAPP_PHONE_NUMBER_ID')
  if (!token || !id) return { ok: false, error: 'WhatsApp belum dikonfigurasi' }
  try {
    const res = await fetch(`${GRAPH}/${id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
    })
    if (res.ok) return { ok: true }
    const j: any = await res.json().catch(() => ({}))
    return { ok: false, error: `${res.status} ${j?.error?.message ?? ''}`.trim().slice(0, 300) }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e).slice(0, 300) }
  }
}

/** Pesan template yang sudah disetujui Meta. bodyParams = nilai {{1}}, {{2}}, ... (tanpa baris baru). */
export function sendTemplate(to: string, name: string, bodyParams: string[], lang = 'id'): Promise<WaResult> {
  return post({
    to, type: 'template',
    template: {
      name, language: { code: lang },
      components: bodyParams.length ? [{ type: 'body', parameters: bodyParams.map((t) => ({ type: 'text', text: t.replace(/\s+/g, ' ').trim() })) }] : [],
    },
  })
}

/** Pesan teks biasa — hanya bisa dalam 24 jam setelah user terakhir membalas. */
export function sendText(to: string, body: string): Promise<WaResult> {
  return post({ to, type: 'text', text: { body: body.slice(0, 4096), preview_url: false } })
}

/** Pesan dengan tombol link (CTA URL) — dalam jendela 24 jam. Badan maks 1024 karakter, label tombol maks 20. */
export function sendCtaUrl(to: string, body: string, label: string, url: string): Promise<WaResult> {
  return post({
    to, type: 'interactive',
    interactive: { type: 'cta_url', body: { text: body.slice(0, 1024) }, action: { name: 'cta_url', parameters: { display_text: label.slice(0, 20), url } } },
  })
}

/** Verifikasi header X-Hub-Signature-256 dari webhook Meta. */
export function verifyMetaSignature(rawBody: string, header: string | null): boolean {
  const secret = loadEnvKey('WHATSAPP_APP_SECRET')
  if (!secret || !header?.startsWith('sha256=')) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const got = header.slice(7)
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))
}

/** Pecah teks panjang (batas WA 4096) di batas paragraf/baris supaya pesan tidak terpotong di tengah kalimat. */
export function splitText(body: string, max = 3800): string[] {
  if (body.length <= max) return [body]
  const out: string[] = []
  let cur = ''
  for (const line of body.split('\n')) {
    if ((cur + '\n' + line).length > max && cur) { out.push(cur); cur = line } else cur = cur ? cur + '\n' + line : line
  }
  if (cur) out.push(cur)
  return out
}

export const sleep =(ms: number) => new Promise((r) => setTimeout(r, ms))
