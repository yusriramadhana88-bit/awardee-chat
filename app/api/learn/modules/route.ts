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

// GET: semua modul + lesson (tanpa content) + progres user + status quiz
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()

  const { data: modules } = await admin
    .from('modules')
    .select('id, slug, title, description, icon, order_index, tier')
    .order('order_index', { ascending: true })

  const { data: lessons } = await admin
    .from('lessons')
    .select('id, module_id, slug, title, order_index, duration_minutes')
    .order('order_index', { ascending: true })

  const { data: quizzes } = await admin
    .from('quizzes')
    .select('id, module_id, title, passing_score')

  const { data: progress } = await admin
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id)

  const { data: quizAttempts } = await admin
    .from('quiz_attempts')
    .select('quiz_id, score, total, passed, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const completedLessonIds = new Set((progress || []).map(p => p.lesson_id))
  const bestAttemptByQuiz = new Map<string, { score: number; total: number; passed: boolean }>()
  for (const a of quizAttempts || []) {
    const existing = bestAttemptByQuiz.get(a.quiz_id)
    if (!existing || a.passed && !existing.passed) bestAttemptByQuiz.set(a.quiz_id, a)
  }

  const result = (modules || []).map(m => {
    const moduleLessons = (lessons || [])
      .filter(l => l.module_id === m.id)
      .map(l => ({ ...l, completed: completedLessonIds.has(l.id) }))
    const quiz = (quizzes || []).find(q => q.module_id === m.id) || null
    const bestAttempt = quiz ? bestAttemptByQuiz.get(quiz.id) ?? null : null
    return {
      ...m,
      lessons: moduleLessons,
      lessonCount: moduleLessons.length,
      completedCount: moduleLessons.filter(l => l.completed).length,
      quiz: quiz ? { ...quiz, bestAttempt } : null,
    }
  })

  return NextResponse.json({ modules: result })
}
