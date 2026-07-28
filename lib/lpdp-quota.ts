import { SupabaseClient } from '@supabase/supabase-js'

// Kuota LPDP Center dihitung dari cost token Claude sebenarnya (bukan hitung baris),
// dengan budget bulanan (IDR) ~30% dari harga NORMAL tier — lihat cost-benefit analysis project.
// Hard block: begitu cost bulan berjalan >= budget, fitur ditolak sampai bulan berikutnya.

const SONNET_INPUT_USD_PER_MTOK = 3
const SONNET_OUTPUT_USD_PER_MTOK = 15
const USD_IDR_RATE = 17000

export const TIER_MONTHLY_BUDGET_IDR: Record<string, number> = {
  free: 1700,     // cicip gratis — nominal kecil, bukan 30% dari Rp0
  starter: 14700, // 30% x Rp49.000
  vip: 44700,     // 30% x Rp149.000
  vvip: 72000,    // 30% x Rp240.000
}

export function calcCostIdr(inputTokens: number, outputTokens: number): number {
  const usd = (inputTokens / 1_000_000) * SONNET_INPUT_USD_PER_MTOK + (outputTokens / 1_000_000) * SONNET_OUTPUT_USD_PER_MTOK
  return Math.round(usd * USD_IDR_RATE)
}

function monthStartIso(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export async function getMonthToDateCostIdr(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase
    .from('lpdp_token_usage')
    .select('cost_idr')
    .eq('user_id', userId)
    .gte('created_at', monthStartIso())
  return (data ?? []).reduce((sum, row) => sum + Number(row.cost_idr), 0)
}

export async function checkLpdpQuota(
  supabase: SupabaseClient,
  userId: string,
  tier: string
): Promise<{ allowed: boolean; usedIdr: number; budgetIdr: number }> {
  const budgetIdr = TIER_MONTHLY_BUDGET_IDR[tier] ?? TIER_MONTHLY_BUDGET_IDR.free
  const usedIdr = await getMonthToDateCostIdr(supabase, userId)
  return { allowed: usedIdr < budgetIdr, usedIdr, budgetIdr }
}

// Panggil dengan admin client (service role) — tabel lpdp_token_usage tidak punya insert policy untuk user.
export async function logLpdpUsage(
  admin: SupabaseClient,
  userId: string,
  feature: 'doc_check' | 'essay_review',
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  await admin.from('lpdp_token_usage').insert({
    user_id: userId,
    feature,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_idr: calcCostIdr(inputTokens, outputTokens),
  })
}
