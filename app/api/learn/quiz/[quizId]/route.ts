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

// GET: soal kuis TANPA correct_index/explanation (dikirim ke client saat submit divalidasi server-side)
export async function GET(req: NextRequest, { params }: { params: { quizId: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()

  const { data: quiz } = await admin
    .from('quizzes')
    .select('id, module_id, title, passing_score')
    .eq('id', params.quizId)
    .single()
  if (!quiz) return NextResponse.json({ error: 'Kuis tidak ditemukan' }, { status: 404 })

  const { data: questions } = await admin
    .from('quiz_questions')
    .select('id, question, options, order_index')
    .eq('quiz_id', quiz.id)
    .order('order_index', { ascending: true })

  return NextResponse.json({ quiz, questions: questions || [] })
}
