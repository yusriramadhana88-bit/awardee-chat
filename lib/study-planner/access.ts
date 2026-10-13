import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'

const admin = () => createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'))

/** 10 digit terakhir tanpa awalan 0/62 — sama dengan normalizePhone di lib/lynk-webhook.ts. */
export const normPhone = (p: string) => String(p || '').replace(/\D/g, '').replace(/^(62|0)/, '').slice(-10)

/** Dari bearer token Supabase -> user + hak akses database berbayar (admin selalu boleh). */
export async function getStudyPlannerAccess(token: string): Promise<{ ok: boolean; reason?: 'unauth' | 'no_access'; email?: string }> {
  if (!token) return { ok: false, reason: 'unauth' }
  const anon = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return { ok: false, reason: 'unauth' }

  const db = admin()
  const email = (user.email ?? '').toLowerCase()
  const { data: profile } = await db.from('profiles').select('is_admin, phone').eq('id', user.id).maybeSingle()
  if (profile?.is_admin) return { ok: true, email }

  const nowIso = new Date().toISOString()
  const phone = profile?.phone ? normPhone(profile.phone) : ''
  const ors = [email && `email.eq."${email.replace(/["\\]/g, '')}"`, phone.length === 10 && `phone.eq.${phone}`].filter(Boolean) as string[]
  if (!ors.length) return { ok: false, reason: 'no_access', email }
  const { data } = await db.from('study_planner_access').select('id, expires_at').or(ors.join(',')).limit(5)
  const valid = (data ?? []).some((r) => !r.expires_at || r.expires_at > nowIso)
  return valid ? { ok: true, email } : { ok: false, reason: 'no_access', email }
}

export const STUDY_PLANNER_PRODUCT = /study\s*planner/i

/** Dipanggil webhook lynk.id untuk produk Study Planner. Idempoten lewat ref_id unik. */
export async function grantStudyPlannerAccess(p: { refId: string; email?: string | null; phone?: string | null; name?: string | null; amount?: number | null }) {
  const db = admin()
  const { error } = await db.from('study_planner_access').insert({
    ref_id: p.refId, email: p.email ? p.email.trim().toLowerCase() : null, phone: p.phone ? normPhone(p.phone) : null,
    name: p.name ?? null, amount: p.amount ?? null, source: 'lynk',
  })
  if (error && !/duplicate key|unique/i.test(error.message)) throw error
  const { count } = await db.from('study_planner_access').select('id', { count: 'exact', head: true })
  return { count: count ?? 0 }
}
