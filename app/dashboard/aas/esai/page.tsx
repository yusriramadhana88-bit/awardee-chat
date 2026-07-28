'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import { getScoreLevel, scoreToPercent } from '@/lib/gamification'
import { ESSAY_TYPES, type AasEssayType } from '@/lib/aas-requirements'
import FeatureLock from '../../_components/FeatureLock'
import LevelProgressBar from '../../_components/LevelProgressBar'

type EssayReviewRow = {
  essay_type: AasEssayType
  content: string
  feedback: string
  score: number | null
  created_at: string
}

const TABS: AasEssayType[] = ['kepemimpinan_dampak', 'rencana_reintegrasi']

export default function EsaiPage() {
  const { user, loading } = useUser()
  const [tab, setTab] = useState<AasEssayType>('kepemimpinan_dampak')
  const [content, setContent] = useState('')
  const [latest, setLatest] = useState<Record<string, EssayReviewRow>>({})
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState('')
  const [upsell, setUpsell] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [result, setResult] = useState<{ feedback: string; score: number | null; charCount: number } | null>(null)
  const supabase = createClient()

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const headers = { Authorization: `Bearer ${session.access_token}` }
    const res = await fetch('/api/aas/essay-review', { headers })
    if (res.ok) {
      const data = await res.json()
      setLatest(data.latest ?? {})
    }
    setPageLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const existing = latest[tab]
    setContent(existing?.content ?? '')
    setResult(existing ? { feedback: existing.feedback, score: existing.score, charCount: existing.content.length } : null)
    setError('')
  }, [tab, latest])

  async function handleReview() {
    setError('')
    if (content.trim().length < 50) {
      setError('Tulisan terlalu pendek. Minimal 50 karakter.')
      return
    }

    setReviewing(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setReviewing(false); return }

    const res = await fetch('/api/aas/essay-review', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ essayType: tab, content }),
    })

    const data = await res.json()
    if (res.status === 403 && data.error === 'TIER_REQUIRED') {
      setUpsell(true)
      setReviewing(false)
      return
    }
    if (!res.ok) {
      setError(data.error || 'Gagal mereview tulisan.')
      setReviewing(false)
      return
    }
    setResult({ feedback: data.feedback, score: data.score, charCount: data.charCount })
    setReviewing(false)
    loadAll()
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  if (!canAccess(user?.tier, 'starter')) {
    return <FeatureLock requiredTier="starter" featureName="Review Esai AAS" />
  }

  const meta = ESSAY_TYPES[tab]
  const charCount = content.length
  const overLimit = charCount > meta.maxChars

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/aas" className="text-xs text-muted hover:text-ink">← AAS Center</Link>
        <h1 className="text-xl font-bold text-ink mt-1">📝 Review Esai</h1>
        <p className="text-sm text-muted mt-0.5">Supporting statement — form OASIS membatasi tiap pertanyaan maks 2000 karakter.</p>
      </div>

      {upsell && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          Review Esai AAS butuh tier Starter ke atas. <Link href="/dashboard#upgrade" className="font-semibold underline">Upgrade tier</Link> untuk mengakses fitur ini.
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors ${tab === t ? 'bg-navy text-white' : 'bg-white border border-hairline text-muted hover:border-gold'}`}
          >
            {ESSAY_TYPES[t].label}
          </button>
        ))}
      </div>

      <div className="bg-off border border-hairline rounded-xl p-4 mb-4">
        <p className="text-xs font-semibold text-ink mb-2">Pertanyaan resmi form OASIS (tempel jawaban tiap pertanyaan di bawah ini):</p>
        <ol className="space-y-1 list-decimal list-inside">
          {meta.questions.map((q, i) => (
            <li key={i} className="text-xs text-muted">{q}</li>
          ))}
        </ol>
      </div>

      <div className="bg-white rounded-xl border border-hairline p-4 mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="Tempel jawaban kamu di sini..."
          className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${overLimit ? 'text-red-600 font-semibold' : 'text-muted'}`}>
            {charCount.toLocaleString('id-ID')}/{meta.maxChars.toLocaleString('id-ID')} karakter
            {overLimit && ' — melebihi batas gabungan, cek ulang panjang tiap jawaban'}
          </span>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <button
          onClick={handleReview}
          disabled={reviewing}
          className="w-full mt-3 bg-navy hover:bg-navy-2 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          {reviewing ? 'Sedang membaca...' : 'Minta Review AI'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-hairline p-5">
          <h2 className="font-semibold text-ink text-sm mb-3">Hasil Review</h2>
          {result.score !== null && (
            <div className="mb-4">
              <LevelProgressBar
                label="Skor Esai"
                score={result.score}
                maxScore={10}
                percent={scoreToPercent(result.score, 10)}
                {...levelProps(result.score)}
              />
            </div>
          )}
          <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap">{result.feedback}</div>
        </div>
      )}
    </div>
  )
}

function levelProps(score: number) {
  const lvl = getScoreLevel(score)
  return { levelName: lvl.name, emoji: lvl.emoji, color: lvl.color, bgColor: lvl.bgColor, borderColor: lvl.borderColor, message: lvl.message }
}
