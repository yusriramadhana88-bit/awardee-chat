import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { checkLessonAchievements } from '@/lib/achievements-server'

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

// POST: tandai lesson selesai untuk user saat ini
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'lessonId wajib diisi' }, { status: 400 })

  const admin = getAdminSupabase()

  const { data: lesson } = await admin.from('lessons').select('id, module_id').eq('id', lessonId).single()
  if (!lesson) return NextResponse.json({ error: 'Lesson tidak ditemukan' }, { status: 404 })

  await admin
    .from('user_lesson_progress')
    .upsert({ user_id: user.id, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id' })

  const newAchievements = await checkLessonAchievements(admin, user.id, lesson.module_id)

  return NextResponse.json({ success: true, newAchievements })
}
