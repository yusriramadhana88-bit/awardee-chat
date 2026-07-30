import { SupabaseClient } from '@supabase/supabase-js'

// Kuota AI gabungan untuk AAS Center + LPDP Center (satu subscription, satu ceiling biaya AI —
// lihat CHANGELOG). Dihitung dari cost token Claude sebenarnya, budget bulanan (IDR) ~30% dari
// harga NORMAL tier. Hard block begitu cost bulan berjalan >= budget (base tier + Booster aktif
// bulan ini) — user harus naik tier atau beli Booster Kuota AI sampai reset bulan berikutnya.

const SONNET_INPUT_USD_PER_MTOK = 3
const SONNET_OUTPUT_USD_PER_MTOK = 15
const USD_IDR_RATE = 17000

export const TIER_MONTHLY_BUDGET_IDR: Record<string, number> = {
  free: 1700,     // cicip gratis — nominal kecil, bukan 30% dari Rp0
  starter: 14700, // 30% x Rp49.000
  vip: 44700,     // 30% x Rp149.000
  vvip: 72000,    // 30% x Rp240.000
}

// Booster Kuota AI — top-up dijual manual via lynk.id (WhatsApp konfirmasi bayar, sama seperti
// membership), diaktivasi admin via /admin/users setelah verifikasi. Rasio biaya ~28% dari harga
// jual -> margin ~72%, dijaga di atas target minimal 70% meski ada variasi panjang esai/dokumen
// antar panggilan. Berlaku hanya untuk bulan kalender saat diaktivasi (month_key), tidak roll-over.
export type TopupPackage = { id: string; label: string; priceIdr: number; budgetIdr: number }
export const TOPUP_PACKAGES: TopupPackage[] = [
  { id: 'booster_kecil', label: 'Booster Kecil', priceIdr: 20000, budgetIdr: 5500 },
  { id: 'booster_sedang', label: 'Booster Sedang', priceIdr: 50000, budgetIdr: 14000 },
  { id: 'booster_besar', label: 'Booster Besar', priceIdr: 100000, budgetIdr: 28000 },
]

export function calcCostIdr(inputTokens: number, outputTokens: number): number {
  const usd = (inputTokens / 1_000_000) * SONNET_INPUT_USD_PER_MTOK + (outputTokens / 1_000_000) * SONNET_OUTPUT_USD_PER_MTOK
  return Math.round(usd * USD_IDR_RATE)
}

function monthStartIso(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function getMonthToDateCostIdr(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase
    .from('ai_token_usage')
    .select('cost_idr')
    .eq('user_id', userId)
    .gte('created_at', monthStartIso())
  return (data ?? []).reduce((sum, row) => sum + Number(row.cost_idr), 0)
}

export async function getMonthToDateTopupIdr(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase
    .from('token_topups')
    .select('budget_idr')
    .eq('user_id', userId)
    .eq('month_key', currentMonthKey())
  return (data ?? []).reduce((sum, row) => sum + Number(row.budget_idr), 0)
}

export async function checkAiQuota(
  supabase: SupabaseClient,
  userId: string,
  tier: string
): Promise<{ allowed: boolean; usedIdr: number; budgetIdr: number; topupIdr: number }> {
  const baseBudget = TIER_MONTHLY_BUDGET_IDR[tier] ?? TIER_MONTHLY_BUDGET_IDR.free
  const [usedIdr, topupIdr] = await Promise.all([
    getMonthToDateCostIdr(supabase, userId),
    getMonthToDateTopupIdr(supabase, userId),
  ])
  const budgetIdr = baseBudget + topupIdr
  return { allowed: usedIdr < budgetIdr, usedIdr, budgetIdr, topupIdr }
}

// Panggil dengan admin client (service role) — tabel ai_token_usage tidak punya insert policy untuk user.
export async function logAiUsage(
  admin: SupabaseClient,
  userId: string,
  product: 'aas' | 'lpdp',
  feature: 'doc_check' | 'essay_review',
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  await admin.from('ai_token_usage').insert({
    user_id: userId,
    product,
    feature,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_idr: calcCostIdr(inputTokens, outputTokens),
  })
}

// Free tier boleh coba Review Esai (AAS+LPDP gabungan) 1x total, biar kepincut upgrade — bukan
// digated total seperti fitur Starter lainnya. Dipanggil SEBELUM insert baris baru, jadi cek
// count yang SUDAH ADA (bukan termasuk request yang sedang diproses).
export async function freeTierEssayReviewUsed(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const [aas, lpdp] = await Promise.all([
    supabase.from('aas_essay_reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('lpdp_essay_reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  const total = (aas.count ?? 0) + (lpdp.count ?? 0)
  return total >= 1
}

// Panggil dengan admin client — dipakai admin panel saat mengaktivasi Booster Kuota AI setelah
// konfirmasi bayar manual via WhatsApp (sama seperti aktivasi tier).
export async function grantTopup(
  admin: SupabaseClient,
  userId: string,
  packageId: string,
  grantedBy: string
): Promise<{ ok: boolean; error?: string }> {
  const pkg = TOPUP_PACKAGES.find((p) => p.id === packageId)
  if (!pkg) return { ok: false, error: 'Paket tidak dikenali' }
  const { error } = await admin.from('token_topups').insert({
    user_id: userId,
    package_id: pkg.id,
    price_idr: pkg.priceIdr,
    budget_idr: pkg.budgetIdr,
    month_key: currentMonthKey(),
    granted_by: grantedBy,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
