// Client-safe: kalkulasi Skor Kelengkapan Dokumen, Skor Esai, dan Skor Kesiapan LPDP gabungan.
import { getScoreLevel, type Level } from './gamification'
import { applicableDocs, type LpdpProfileLite } from './lpdp-requirements'

export type LatestDocCheck = { doc_key: string; verdict: 'sesuai' | 'perlu_perbaikan' | 'tidak_sesuai' }
export type LatestEssayReview = { essay_type: 'profil_diri' | 'esai_komitmen'; score: number | null }

// % dokumen WAJIB & applicable yang verdict TERBARU-nya "sesuai" (dokumen opsional seperti Surat
// Rekomendasi tetap muncul di checklist tapi tidak dihitung ke skor — supaya tidak menghambat 100%).
export function docCompletionScore(profile: LpdpProfileLite, latestChecks: LatestDocCheck[]): number {
  const required = applicableDocs(profile).filter((d) => d.wajib)
  if (required.length === 0) return 0
  const latestByKey = new Map(latestChecks.map((c) => [c.doc_key, c.verdict]))
  const sesuaiCount = required.filter((d) => latestByKey.get(d.key) === 'sesuai').length
  return Math.round((sesuaiCount / required.length) * 100)
}

// Rata-rata skor esai terbaru (profil_diri + esai_komitmen) x 10, dalam skala 0-100
export function essayScore(latestReviews: LatestEssayReview[]): number {
  const scores = latestReviews.map((r) => r.score).filter((s): s is number => s !== null && s !== undefined)
  if (scores.length === 0) return 0
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return Math.round(avg * 10)
}

// Skor Kesiapan LPDP gabungan: 60% dokumen + 40% esai
export function kesiapanScore(docScore: number, essayScoreValue: number): number {
  return Math.round(docScore * 0.6 + essayScoreValue * 0.4)
}

export function kesiapanLevel(score: number): Level {
  return getScoreLevel(Math.round(score / 10))
}
