// Client-safe: kalkulasi Skor Kelengkapan Dokumen, Skor Esai, dan Skor Kesiapan AAS gabungan.
// Formula identik dengan lib/lpdp-scoring.ts (60% dokumen + 40% esai) — lihat file itu untuk
// rasionalnya.
import { getScoreLevel, type Level } from './gamification'
import { applicableDocs, type AasProfileLite } from './aas-requirements'

export type LatestDocCheck = { doc_key: string; verdict: 'sesuai' | 'perlu_perbaikan' | 'tidak_sesuai' }
export type LatestEssayReview = { essay_type: 'kepemimpinan_dampak' | 'rencana_reintegrasi'; score: number | null }

export function docCompletionScore(profile: AasProfileLite, latestChecks: LatestDocCheck[]): number {
  const required = applicableDocs(profile).filter((d) => d.wajib)
  if (required.length === 0) return 0
  const latestByKey = new Map(latestChecks.map((c) => [c.doc_key, c.verdict]))
  const sesuaiCount = required.filter((d) => latestByKey.get(d.key) === 'sesuai').length
  return Math.round((sesuaiCount / required.length) * 100)
}

export function essayScore(latestReviews: LatestEssayReview[]): number {
  const scores = latestReviews.map((r) => r.score).filter((s): s is number => s !== null && s !== undefined)
  if (scores.length === 0) return 0
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return Math.round(avg * 10)
}

export function kesiapanScore(docScore: number, essayScoreValue: number): number {
  return Math.round(docScore * 0.6 + essayScoreValue * 0.4)
}

export function kesiapanLevel(score: number): Level {
  return getScoreLevel(Math.round(score / 10))
}
