import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { checkQuizAchievements } from '@/lib/achievements-server'
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

// POST: submit jawaban kuis. Skor dihitung server-side dari quiz_questions
// (bukan dipercaya dari client) supaya user tidak bisa curang kirim skor palsu.
export async function POST(req: NextRequest, { params }: { params: { quizId: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { answers } = await req.json() as { answers: Record<string, number> }
  if (!answers) return NextResponse.json({ error: 'answers wajib diisi' }, { status: 400 })

  const admin = getAdminSupabase()

  const { data: quiz } = await admin
    .from('quizzes')
    .select('id, module_id, passing_score')
    .eq('id', params.quizId)
    .single()
  if (!quiz) return NextResponse.json({ error: 'Kuis tidak ditemukan' }, { status: 404 })

  const { data: moduleRow } = await admin
    .from('modules')
    .select('tier')
    .eq('id', quiz.module_id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (moduleRow?.tier && moduleRow.tier !== 'free' && !canAccess(profile?.subscription_tier, moduleRow.tier)) {
    return NextResponse.json({ error: 'TIER_REQUIRED', requiredTier: moduleRow.tier }, { status: 403 })
  }

  const { data: questions } = await admin
    .from('quiz_questions')
    .select('id, correct_index, explanation, question, options')
    .eq('quiz_id', quiz.id)

  const total = questions?.length ?? 0
  let score = 0
  const review = (questions || []).map(q => {
    const selectedIndex = answers[q.id]
    const isCorrect = selectedIndex === q.correct_index
    if (isCorrect) score++
    return {
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedIndex: selectedIndex ?? null,
      correctIndex: q.correct_index,
      explanation: q.explanation,
      isCorrect,
    }
  })

  const percent = total > 0 ? Math.round((score / total) * 100) : 0
  const passed = percent >= quiz.passing_score

  await admin.from('quiz_attempts').insert({
    user_id: user.id,
    quiz_id: quiz.id,
    score,
    total,
    passed,
  })

  const newAchievements = await checkQuizAchievements(admin, user.id, passed, score, total)

  return NextResponse.json({ score, total, percent, passed, passingScore: quiz.passing_score, review, newAchievements })
}
