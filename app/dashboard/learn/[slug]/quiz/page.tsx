'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess, Tier } from '@/lib/use-user'
import FeatureLock from '../../../_components/FeatureLock'

type ModuleItem = { slug: string; title: string; tier: Tier; quiz: { id: string; title: string; passing_score: number } | null }
type Question = { id: string; question: string; options: string[]; order_index: number }
type ReviewItem = { questionId: string; question: string; options: string[]; selectedIndex: number | null; correctIndex: number; explanation: string | null; isCorrect: boolean }
type SubmitResult = { score: number; total: number; percent: number; passed: boolean; passingScore: number; review: ReviewItem[]; newAchievements: string[] }

export default function QuizPage() {
  const { loading } = useUser()
  const params = useParams()
  const slug = params.slug as string
  const [moduleTitle, setModuleTitle] = useState('')
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lockedTier, setLockedTier] = useState<Tier | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const modulesRes = await fetch('/api/learn/modules', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!modulesRes.ok) return setPageLoading(false)
      const modulesData = await modulesRes.json()
      const moduleItem: ModuleItem | undefined = modulesData.modules.find((m: ModuleItem) => m.slug === slug)
      if (!moduleItem?.quiz) return setPageLoading(false)

      const userRes = await fetch('/api/user', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const userData = userRes.ok ? await userRes.json() : null
      if (moduleItem.tier !== 'free' && !canAccess(userData?.tier, moduleItem.tier)) {
        setLockedTier(moduleItem.tier)
        return setPageLoading(false)
      }

      setModuleTitle(moduleItem.title)
      setQuizId(moduleItem.quiz.id)
      setQuizTitle(moduleItem.quiz.title)

      const qRes = await fetch(`/api/learn/quiz/${moduleItem.quiz.id}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (qRes.ok) {
        const qData = await qRes.json()
        setQuestions(qData.questions)
      }
      setPageLoading(false)
    }
    load()
  }, [slug])

  async function submit() {
    if (!quizId) return
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch(`/api/learn/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
    if (res.ok) {
      const data = await res.json()
      setResult(data)
    }
    setSubmitting(false)
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat kuis...</div></div>
  }

  if (lockedTier) {
    return <FeatureLock requiredTier={lockedTier as 'starter' | 'vip' | 'vvip'} featureName="Kuis ini" />
  }

  if (!quizId) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Kuis tidak ditemukan untuk modul ini.</div></div>
  }

  if (result) {
    return (
      <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
        <Link href={`/dashboard/learn/${slug}`} className="text-xs text-muted hover:text-ink">&larr; {moduleTitle}</Link>

        <div className={`rounded-xl border p-6 mt-4 mb-6 text-center ${result.passed ? 'bg-off border-gold' : 'bg-white border-hairline'}`}>
          <div className="text-3xl mb-2">{result.passed ? '🎉' : '📝'}</div>
          <div className="text-2xl font-bold text-ink">{result.score}/{result.total}</div>
          <div className="text-sm text-muted mt-1">
            {result.passed ? `Lulus! (min. ${result.passingScore}%)` : `Belum lulus, minimal ${result.passingScore}%. Coba lagi ya.`}
          </div>
          {result.newAchievements.length > 0 && (
            <div className="text-xs text-gold-2 font-semibold mt-2">🏆 Achievement baru terbuka!</div>
          )}
        </div>

        <div className="space-y-4">
          {result.review.map((r, idx) => (
            <div key={r.questionId} className="bg-white rounded-xl border border-hairline p-4">
              <div className="text-sm font-medium text-ink mb-2">{idx + 1}. {r.question}</div>
              <div className="space-y-1.5">
                {r.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`text-xs px-3 py-2 rounded-lg ${
                      i === r.correctIndex ? 'bg-green-50 text-green-700 font-medium'
                      : i === r.selectedIndex ? 'bg-red-50 text-red-600'
                      : 'text-muted'
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
              {r.explanation && <p className="text-xs text-muted mt-2 italic">{r.explanation}</p>}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => { setResult(null); setAnswers({}) }} className="text-sm font-semibold text-ink border border-hairline px-4 py-2.5 rounded-xl hover:border-gold transition-colors">
            Coba Lagi
          </button>
          <Link href={`/dashboard/learn/${slug}`} className="text-sm font-semibold bg-navy hover:bg-navy-2 text-white px-4 py-2.5 rounded-xl transition-colors">
            Kembali ke Modul
          </Link>
        </div>
      </div>
    )
  }

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id] !== undefined)

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <Link href={`/dashboard/learn/${slug}`} className="text-xs text-muted hover:text-ink">&larr; {moduleTitle}</Link>
      <h1 className="text-xl font-bold text-ink mt-3 mb-6">{quizTitle}</h1>

      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border border-hairline p-4">
            <div className="text-sm font-medium text-ink mb-3">{idx + 1}. {q.question}</div>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: i }))}
                  className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                    answers[q.id] === i ? 'border-gold bg-off text-ink font-medium' : 'border-hairline text-muted hover:border-gold'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={!allAnswered || submitting}
        className="w-full mt-6 bg-navy hover:bg-navy-2 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
      >
        {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
      </button>
    </div>
  )
}
