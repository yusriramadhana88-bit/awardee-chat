'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/use-user'
import { getScoreLevel, scoreToPercent } from '@/lib/gamification'
import { ESSAY_TYPES, MAX_CHARS_PER_QUESTION, type AasEssayType } from '@/lib/aas-requirements'
import LevelProgressBar from '../../_components/LevelProgressBar'

type EssayReviewRow = {
  essay_type: AasEssayType
  content: string
  answers: string[] | null
  feedback: string
  score: number | null
  created_at: string
}

const TABS: AasEssayType[] = ['kepemimpinan_dampak', 'rencana_reintegrasi']

function emptyAnswers(essayType: AasEssayType): string[] {
  return ESSAY_TYPES[essayType].questions.map(() => '')
}

export default function EsaiPage() {
  const { loading } = useUser()
  const [tab, setTab] = useState<AasEssayType>('kepemimpinan_dampak')
  const [answers, setAnswers] = useState<string[]>(emptyAnswers('kepemimpinan_dampak'))
  const [latest, setLatest] = useState<Record<string, EssayReviewRow>>({})
  const [usedIdr, setUsedIdr] = useState(0)
  const [budgetIdr, setBudgetIdr] = useState<number | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState('')
  const [upsell, setUpsell] = useState(false)
  const [freeLimitReached, setFreeLimitReached] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [result, setResult] = useState<{ feedback: string; score: number | null } | null>(null)
  const supabase = createClient()

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const headers = { Authorization: `Bearer ${session.access_token}` }
    const res = await fetch('/api/aas/essay-review', { headers })
    if (res.ok) {
      const data = await res.json()
      setLatest(data.latest ?? {})
      setUsedIdr(data.usedIdr ?? 0)
      setBudgetIdr(data.budgetIdr ?? null)
    }
    setPageLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const existing = latest[tab]
    setAnswers(existing?.answers && existing.answers.length === ESSAY_TYPES[tab].questions.length ? existing.answers : emptyAnswers(tab))
    setResult(existing ? { feedback: existing.feedback, score: existing.score } : null)
    setError('')
  }, [tab, latest])

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = value.slice(0, MAX_CHARS_PER_QUESTION)
      return next
    })
  }

  async function handleReview() {
    setError('')
    setFreeLimitReached(false)
    const totalChars = answers.reduce((sum, a) => sum + a.trim().length, 0)
    if (totalChars < 50) {
      setError('Tulisan terlalu pendek. Minimal 50 karakter.')
      return
    }

    setReviewing(true)
    setResult(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/aas/essay-review', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ essayType: tab, answers }),
        signal: controller.signal,
      })

      if (!res.ok) {
        let data: Record<string, unknown> = {}
        try {
          data = await res.json()
        } catch {
          setError(`Server tidak merespons dengan benar (status ${res.status}). Coba lagi ya.`)
          return
        }
        if (res.status === 403 && data.error === 'FREE_LIMIT_REACHED') {
          setFreeLimitReached(true)
          return
        }
        if (res.status === 403 && data.error === 'TIER_REQUIRED') {
          setUpsell(true)
          return
        }
        setError((data.error as string) || 'Gagal mereview tulisan.')
        return
      }
      if (!res.body) {
        setError('Server tidak mengirim data. Coba lagi ya.')
        return
      }

      // Respons di-stream (NDJSON) supaya koneksi tetap "hidup" selama Claude menulis — esai
      // panjang + konteks handbook besar bisa kena idle-timeout jaringan edge kalau ditunggu utuh.
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let feedback = ''
      let finalScore: number | null = null
      let streamError: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          const evt = JSON.parse(line)
          if (evt.type === 'delta') {
            feedback += evt.text
            setResult({ feedback, score: null })
          } else if (evt.type === 'done') {
            finalScore = evt.score
            setUsedIdr(evt.usedIdr)
            setBudgetIdr(evt.budgetIdr)
          } else if (evt.type === 'error') {
            streamError = evt.error
          }
        }
      }

      if (streamError) {
        setError(streamError)
        setResult(null)
        return
      }
      setResult({ feedback, score: finalScore })
      loadAll()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Waktu tunggu habis (>55 detik). Coba lagi ya — kalau tulisannya sangat panjang, coba persingkat dulu.')
      } else {
        setError('Gagal menghubungi server. Cek koneksi kamu dan coba lagi.')
      }
    } finally {
      clearTimeout(timeoutId)
      setReviewing(false)
    }
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  const meta = ESSAY_TYPES[tab]

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/aas" className="text-xs text-muted hover:text-ink">← AAS Center</Link>
        <h1 className="text-xl font-bold text-ink mt-1">📝 Review Esai</h1>
        <p className="text-sm text-muted mt-0.5">
          Supporting statement — form OASIS membatasi tiap pertanyaan maks {MAX_CHARS_PER_QUESTION.toLocaleString('id-ID')} karakter (tidak bisa dinegosiasi sistem).
          {budgetIdr !== null && (
            <span className="block mt-1 font-medium text-ink">
              Kuota AI bulan ini (gabungan AAS+LPDP): Rp{usedIdr.toLocaleString('id-ID')}/Rp{budgetIdr.toLocaleString('id-ID')} terpakai.
            </span>
          )}
        </p>
      </div>

      {freeLimitReached && (
        <div className="bg-gradient-to-br from-navy to-navy-2 text-white rounded-xl p-5 mb-5">
          <h2 className="font-semibold mb-1">🔥 Jatah review gratis kamu udah kepakai!</h2>
          <p className="text-white/80 text-sm mb-4">
            Gimana, kebantu kan lihat langsung kekuatan & kelemahan esai kamu? Itu baru satu kali review — bayangin kalau kamu bisa revisi berkali-kali sampai esai kamu benar-benar solid. Upgrade ke Starter, dan review esai kamu jadi sepuasnya.
          </p>
          <Link href="/dashboard#upgrade" className="inline-block bg-gold text-navy text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gold-2 transition-colors">
            Upgrade Sekarang
          </Link>
        </div>
      )}

      {upsell && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          {budgetIdr !== null && usedIdr >= budgetIdr
            ? <>Kuota AI kamu bulan ini sudah habis. <Link href="/dashboard#upgrade" className="font-semibold underline">Upgrade tier</Link> untuk kuota lebih besar, beli <Link href="/dashboard#booster" className="font-semibold underline">Booster Kuota AI</Link>, atau tunggu reset bulan depan.</>
            : <>Review Esai AAS butuh tier Starter ke atas. <Link href="/dashboard#upgrade" className="font-semibold underline">Upgrade tier</Link> untuk mengakses fitur ini.</>}
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

      <div className="space-y-4 mb-4">
        {meta.questions.map((q, i) => {
          const charCount = answers[i]?.length ?? 0
          const nearLimit = charCount > MAX_CHARS_PER_QUESTION * 0.9
          return (
            <div key={i} className="bg-white rounded-xl border border-hairline p-4">
              <p className="text-xs font-semibold text-ink mb-2">{i + 1}. {q}</p>
              <textarea
                value={answers[i] ?? ''}
                onChange={(e) => setAnswer(i, e.target.value)}
                rows={6}
                maxLength={MAX_CHARS_PER_QUESTION}
                placeholder="Tulis jawabanmu di sini..."
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
              />
              <div className="flex items-center justify-end mt-1">
                <span className={`text-xs ${nearLimit ? 'text-red-600 font-semibold' : 'text-muted'}`}>
                  {charCount.toLocaleString('id-ID')}/{MAX_CHARS_PER_QUESTION.toLocaleString('id-ID')} karakter
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-hairline p-4 mb-4">
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <button
          onClick={handleReview}
          disabled={reviewing}
          className="w-full bg-navy hover:bg-navy-2 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
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
