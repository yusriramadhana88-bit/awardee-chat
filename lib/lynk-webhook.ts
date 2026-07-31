import crypto from 'crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from './env'
import { sendTierUpgradeEmail } from './email'

// Durasi upgrade tier — samakan dengan konvensi app/api/admin/users/route.ts (30 hari flat,
// bukan kalender bulan) supaya perilakunya konsisten dengan upgrade manual oleh admin.
const TIER_DURATION_MS = 30 * 24 * 60 * 60 * 1000

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

export function verifyLynkSignature(refId: string, grandTotal: string, messageId: string, receivedSignature: string): boolean {
  const secret = loadEnvKey('LYNK_MERCHANT_KEY')
  if (!secret || !receivedSignature) return false
  const signatureString = grandTotal + refId + messageId + secret
  const calculated = crypto.createHash('sha256').update(signatureString).digest('hex')
  return calculated === receivedSignature
}

// Normalisasi nomor HP Indonesia ke 10 digit terakhir (tanpa awalan 0/62/+62) supaya
// "0812xxxx", "62812xxxx", dan "+62812xxxx" semua dianggap sama saat dicocokkan.
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.replace(/^(62|0)/, '').slice(-10)
}

function detectTier(title: string): 'starter' | 'vip' | 'vvip' | null {
  const t = title.toLowerCase()
  if (t.includes('vvip')) return 'vvip'
  if (t.includes('vip')) return 'vip'
  if (t.includes('starter')) return 'starter'
  return null
}

type ProfileRow = { id: string; phone: string | null; subscription_tier: string; subscription_expires_at: string | null }

async function findUserByPhone(supabase: any, phone: string): Promise<ProfileRow | null> {
  const normTarget = normalizePhone(phone)
  if (!normTarget) return null
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, phone, subscription_tier, subscription_expires_at')
    .not('phone', 'is', null)
  const rows = (profiles ?? []) as unknown as ProfileRow[]
  return rows.find((p) => normalizePhone(p.phone as string) === normTarget) ?? null
}

async function findUserByEmail(supabase: any, email: string): Promise<ProfileRow | null> {
  const target = email.trim().toLowerCase()
  if (!target) return null
  // Supabase admin API tidak punya "get user by email" langsung — paginasi listUsers()
  // (dibatasi 20 halaman/1000 user, cukup untuk skala bisnis ini) lalu cocokkan manual.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 50 })
    if (error || !data?.users?.length) break
    const found = data.users.find((u: any) => u.email?.toLowerCase() === target)
    if (found) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, phone, subscription_tier, subscription_expires_at')
        .eq('id', found.id)
        .single()
      return (profile as unknown as ProfileRow) ?? null
    }
    if (data.users.length < 50) break
  }
  return null
}

async function notifyAdminUnmatched(reason: string, log: Record<string, unknown>) {
  await sendTierUpgradeEmail({
    to: 'yusri.ramadhana88@gmail.com',
    kind: 'admin_unmatched',
    reason,
    log,
  })
}

export async function processLynkPayment(payload: any) {
  const supabase = getAdminSupabase()
  const data = payload?.data
  const messageId: string | undefined = data?.message_id
  const md = data?.message_data
  const refId: string | undefined = md?.refId
  const customer = md?.customer ?? {}
  const items = md?.items ?? []
  const grandTotal: number | null = md?.totals?.grandTotal ?? null
  const itemTitle: string = items[0]?.title ?? ''

  if (!messageId || !refId) {
    console.error('[lynk-webhook] Payload tidak lengkap, skip:', payload)
    return
  }

  // Idempotency: cek dulu sebelum memproses apa pun, supaya retry dari lynk.id (non-200
  // response) tidak menambah durasi tier dua kali untuk transaksi yang sama.
  const { data: existing } = await supabase
    .from('lynk_webhook_log')
    .select('id')
    .eq('message_id', messageId)
    .maybeSingle()
  if (existing) return

  const logBase = {
    message_id: messageId,
    ref_id: refId,
    customer_phone: customer.phone ?? null,
    customer_email: customer.email ?? null,
    customer_name: customer.name ?? null,
    item_title: itemTitle,
    grand_total: grandTotal,
    raw_payload: payload,
  }

  const tier = detectTier(itemTitle)
  if (!tier) {
    const reason = `Produk "${itemTitle}" tidak dikenali sebagai tier membership (starter/vip/vvip)`
    const { error } = await supabase.from('lynk_webhook_log').insert({ ...logBase, status: 'unmatched_product', error: reason })
    if (!error) await notifyAdminUnmatched(reason, logBase)
    return
  }

  let matchedUser = customer.phone ? await findUserByPhone(supabase, customer.phone) : null
  let matchedVia = matchedUser ? 'phone' : null

  if (!matchedUser && customer.email) {
    matchedUser = await findUserByEmail(supabase, customer.email)
    if (matchedUser) matchedVia = 'email'
  }

  if (!matchedUser) {
    const reason = `Tidak ada akun AWARDEE APP yang cocok dengan HP "${customer.phone ?? '-'}" atau email "${customer.email ?? '-'}"`
    const { error } = await supabase.from('lynk_webhook_log').insert({ ...logBase, status: 'unmatched_user', matched_tier: tier, error: reason })
    if (!error) await notifyAdminUnmatched(reason, { ...logBase, matched_tier: tier })
    return
  }

  // Stacking: kalau tier masih aktif, tambahkan durasi dari sisa waktu aktif — bukan reset
  // ke 30 hari dari sekarang — supaya user tidak rugi waktu yang sudah dibayar sebelumnya.
  const now = Date.now()
  const currentExpiry = matchedUser.subscription_expires_at ? new Date(matchedUser.subscription_expires_at as string).getTime() : 0
  const baseTime = currentExpiry > now ? currentExpiry : now
  const newExpiry = new Date(baseTime + TIER_DURATION_MS).toISOString()

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ subscription_tier: tier, subscription_expires_at: newExpiry })
    .eq('id', matchedUser.id as string)

  if (updateError) {
    await supabase.from('lynk_webhook_log').insert({
      ...logBase,
      status: 'update_failed',
      matched_tier: tier,
      matched_user_id: matchedUser.id as string,
      matched_via: matchedVia,
      error: updateError.message,
    })
    return
  }

  await supabase.from('lynk_webhook_log').insert({
    ...logBase,
    status: 'upgraded',
    matched_tier: tier,
    matched_user_id: matchedUser.id as string,
    matched_via: matchedVia,
  })

  if (customer.email) {
    await sendTierUpgradeEmail({ to: customer.email, kind: 'user_upgraded', tier, expiresAt: newExpiry, name: customer.name })
  }
}
