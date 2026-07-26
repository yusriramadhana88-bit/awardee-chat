import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'

function getSupabaseWithToken(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

// GET: profil lengkap + ringkasan aktivitas (learning, dokumen, achievement, tracker)
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()

  const { data: profile } = await admin
    .from('profiles')
    .select('name, phone, subscription_tier, subscription_expires_at, created_at, is_admin, newsletter_opt_in')
    .eq('id', user.id)
    .single()

  const [
    { count: lessonsCompleted },
    { count: quizzesPassed },
    { count: achievementsEarned },
    { count: cvAnalyses },
    { count: essayReviews },
    { count: applications },
  ] = await Promise.all([
    admin.from('user_lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('passed', true),
    admin.from('user_achievements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('cv_analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('essay_drafts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('ai_feedback', 'is', null),
    admin.from('scholarship_applications').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return NextResponse.json({
    profile: {
      name: profile?.name || user.email?.split('@')[0] || 'User',
      email: user.email,
      phone: profile?.phone,
      tier: profile?.subscription_tier || 'free',
      expiresAt: profile?.subscription_expires_at,
      memberSince: profile?.created_at,
      isAdmin: profile?.is_admin || false,
      newsletterOptIn: profile?.newsletter_opt_in ?? true,
    },
    stats: {
      lessonsCompleted: lessonsCompleted ?? 0,
      quizzesPassed: quizzesPassed ?? 0,
      achievementsEarned: achievementsEarned ?? 0,
      cvAnalyses: cvAnalyses ?? 0,
      essayReviews: essayReviews ?? 0,
      applications: applications ?? 0,
    },
  })
}

// PATCH: update nama profil
export async function PATCH(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, newsletterOptIn } = await req.json()

  const updates: Record<string, unknown> = {}
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 })
    }
    updates.name = name.trim()
  }
  if (typeof newsletterOptIn === 'boolean') {
    updates.newsletter_opt_in = newsletterOptIn
    updates.newsletter_unsubscribed_at = newsletterOptIn ? null : new Date().toISOString()
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 })
  }

  const admin = getAdminSupabase()
  const { error } = await admin.from('profiles').update(updates).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
