import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { canAccess } from '@/lib/tier'

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

// GET: konten satu lesson + info modul + lesson sebelumnya/berikutnya + status selesai
export async function GET(req: NextRequest, { params }: { params: { lessonId: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()

  const { data: lesson } = await admin
    .from('lessons')
    .select('id, module_id, slug, title, content, order_index, duration_minutes')
    .eq('id', params.lessonId)
    .single()

  if (!lesson) return NextResponse.json({ error: 'Lesson tidak ditemukan' }, { status: 404 })

  const { data: moduleRow } = await admin
    .from('modules')
    .select('id, slug, title, icon, tier')
    .eq('id', lesson.module_id)
    .single()

  if (!moduleRow) return NextResponse.json({ error: 'Modul tidak ditemukan' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (moduleRow.tier !== 'free' && !canAccess(profile?.subscription_tier, moduleRow.tier)) {
    return NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: moduleRow.tier }, { status: 403 })
  }

  const { data: siblings } = await admin
    .from('lessons')
    .select('id, slug, title, order_index')
    .eq('module_id', lesson.module_id)
    .order('order_index', { ascending: true })

  const { data: progressRow } = await admin
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .eq('lesson_id', lesson.id)
    .maybeSingle()

  const idx = (siblings || []).findIndex(s => s.id === lesson.id)
  const prev = idx > 0 ? siblings![idx - 1] : null
  const next = idx >= 0 && idx < (siblings?.length ?? 0) - 1 ? siblings![idx + 1] : null

  return NextResponse.json({
    lesson,
    module: moduleRow,
    completed: !!progressRow,
    prev,
    next,
    isLastLesson: next === null,
  })
}
