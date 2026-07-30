// Kuota AI ditampilkan sebagai persentase di UI (bukan Rupiah) — lebih gampang dicerna user.
// Perhitungan biaya asli (IDR) tetap di lib/ai-quota.ts; ini murni fungsi format tampilan.

export function quotaRemainingPercent(usedIdr: number, budgetIdr: number): number {
  if (budgetIdr <= 0) return 100
  return Math.max(0, Math.min(100, Math.round(((budgetIdr - usedIdr) / budgetIdr) * 100)))
}

export function quotaUsedPercent(usedIdr: number, budgetIdr: number): number {
  if (budgetIdr <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((usedIdr / budgetIdr) * 100)))
}
