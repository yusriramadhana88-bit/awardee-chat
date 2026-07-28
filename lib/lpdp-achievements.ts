// Server-only: cek & beri achievement "lpdp_ready" (Skor Kesiapan >= 80) dan "lpdp_docs_clear"
// (semua dokumen wajib applicable verdict sesuai) — dipakai dari route doc-check & essay-review.
import type { SupabaseClient } from '@supabase/supabase-js'
import { awardAchievement } from './achievements-server'
import { applicableDocs, type LpdpProfileLite } from './lpdp-requirements'
import { docCompletionScore, essayScore, kesiapanScore, type LatestDocCheck, type LatestEssayReview } from './lpdp-scoring'

// rows harus sudah terurut created_at DESC — ambil kemunculan pertama per key sebagai "terbaru"
function latestByKey<T extends Record<string, unknown>>(rows: T[], key: string): T[] {
  const seen = new Set<unknown>()
  const result: T[] = []
  for (const row of rows) {
    if (seen.has(row[key])) continue
    seen.add(row[key])
    result.push(row)
  }
  return result
}

async function getLatestDocsAndEssays(supabase: SupabaseClient, userId: string) {
  const [{ data: docChecks }, { data: essayReviews }] = await Promise.all([
    supabase.from('lpdp_doc_checks').select('doc_key, verdict, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('lpdp_essay_reviews').select('essay_type, score, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ])
  return {
    latestDocs: latestByKey((docChecks ?? []) as LatestDocCheck[], 'doc_key'),
    latestEssays: latestByKey((essayReviews ?? []) as LatestEssayReview[], 'essay_type'),
  }
}

export async function checkLpdpReadyAchievement(supabase: SupabaseClient, admin: SupabaseClient, userId: string, profile: LpdpProfileLite): Promise<void> {
  const { latestDocs, latestEssays } = await getLatestDocsAndEssays(supabase, userId)
  const total = kesiapanScore(docCompletionScore(profile, latestDocs), essayScore(latestEssays))
  if (total >= 80) await awardAchievement(admin, userId, 'lpdp_ready')
}

export async function checkLpdpDocsClearAchievement(supabase: SupabaseClient, admin: SupabaseClient, userId: string, profile: LpdpProfileLite): Promise<void> {
  const required = applicableDocs(profile).filter((d) => d.wajib)
  if (required.length === 0) return
  const { latestDocs } = await getLatestDocsAndEssays(supabase, userId)
  const latestByDocKey = new Map(latestDocs.map((c) => [c.doc_key, c.verdict]))
  const allClear = required.every((d) => latestByDocKey.get(d.key) === 'sesuai')
  if (allClear) await awardAchievement(admin, userId, 'lpdp_docs_clear')
}
