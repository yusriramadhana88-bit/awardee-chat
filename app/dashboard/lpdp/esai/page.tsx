'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/use-user'
import { getScoreLevel, scoreToPercent } from '@/lib/gamification'
import { ESSAY_TYPES, MAX_FILE_BYTES, type LpdpEssayType } from '@/lib/lpdp-requirements'
import LevelProgressBar from '../../_components/LevelProgressBar'

type EssayReviewRow = {
  essay_type: LpdpEssayType
  content: string
  feedback: string
  score: number | null
  created_at: string
}

type ProfileInfo = { target_kampus: string | null; target_prodi: string | null; cv_text: string | null }

const TABS: LpdpEssayType[] = ['profil_diri', 'esai_komitmen']

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function EsaiPage() {
  const { loading } = useUser()
  const [tab, setTab] = useState<LpdpEssayType>('profil_diri')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'paste' | 'upload'>('paste')
  const [latest, setLatest] = useState<Record<string, EssayReviewRow>>({})
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null)
  const [usedIdr, setUsedIdr] = useState(0)
  const [budgetIdr, setBudgetIdr] = useState<number | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState('')
  const [upsell, setUpsell] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [result, setResult] = useState<{ feedback: string; score: number | null; wordCount: number } | null>(null)
  const supabase = createClient()

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const headers = { Authorization: `Bearer ${session.access_token}` }
    const [essayRes, profileRes] = await Promise.all([
      fetch('/api/lpdp/essay-review', { headers }),
      fetch('/api/lpdp/profile', { headers }),
    ])
    if (essayRes.ok) {
      const data = await essayRes.json()
      setUsedIdr(data.usedIdr ?? 0)
      setBudgetIdr(data.budgetIdr ?? null)
      setLatest(data.latest ?? {})
    }
    if (profileRes.ok) {
      const data = await profileRes.json()
      if (data.profile) setProfileInfo(data.profile)
    }
    setPageLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    const existing = latest[tab]
    setContent(existing?.content ?? '')
    setResult(existing ? { feedback: existing.feedback, score: existing.score, wordCount: countWords(existing.content) } : null)
    setFile(null)
    setError('')
  }, [tab, latest])

  async function handleReview() {
    setError('')
    if (mode === 'paste' && content.trim().length < 50) {
      setError('Tulisan terlalu pendek. Minimal 50 karakter.')
      return
    }
    if (mode === 'upload' && !file) {
      setError('Pilih file .docx dulu.')
      return
    }
    if (mode === 'upload' && file && file.size > MAX_FILE_BYTES) {
      setError(`File terlalu besar (maks ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB).`)
      return
    }

    setReviewing(true)
    setResult(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55000)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      let res: Response
      if (mode === 'upload' && file) {
        const fd = new FormData()
        fd.append('essayType', tab)
        fd.append('file', file)
        res = await fetch('/api/lpdp/essay-review', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: fd, signal: controller.signal })
      } else {
        res = await fetch('/api/lpdp/essay-review', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ essayType: tab, content }),
          signal: controller.signal,
        })
      }

      if (!res.ok) {
        let data: Record<string, unknown> = {}
        try {
          data = await res.json()
        } catch {
          setError(`Server tidak merespons dengan benar (status ${res.status}). Coba lagi ya.`)
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
      let finalWordCount = countWords(content)
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
            setResult({ feedback, score: null, wordCount: finalWordCount })
          } else if (evt.type === 'done') {
            finalScore = evt.score
            finalWordCount = evt.wordCount
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
      setResult({ feedback, score: finalScore, wordCount: finalWordCount })
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
  const wordCount = countWords(content)
  const overRange = meta.maxWords && wordCount > meta.maxWords
  const underRange = meta.minWords && wordCount > 0 && wordCount < meta.minWords

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/lpdp" className="text-xs text-muted hover:text-ink">← LPDP Center</Link>
        <h1 className="text-xl font-bold text-ink mt-1">📝 Review Esai</h1>
        <p className="text-sm text-muted mt-0.5">
          {budgetIdr !== null && (
            <span className="font-medium text-ink">
              Kuota AI bulan ini (gabungan AAS+LPDP): Rp{usedIdr.toLocaleString('id-ID')}/Rp{budgetIdr.toLocaleString('id-ID')} terpakai.
            </span>
          )}
        </p>
      </div>

      {upsell && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          Kuota AI kamu bulan ini sudah habis. <Link href="/dashboard#upgrade" className="font-semibold underline">Upgrade tier</Link> untuk kuota lebih besar, beli <Link href="/dashboard#booster" className="font-semibold underline">Booster Kuota AI</Link>, atau tunggu reset bulan depan.
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

      <div className="flex gap-2 mb-3 flex-wrap">
        {profileInfo?.cv_text && <span className="text-[10px] bg-off border border-hairline rounded-full px-2 py-1 text-muted">CV kamu ✓</span>}
        {profileInfo?.target_kampus && <span className="text-[10px] bg-off border border-hairline rounded-full px-2 py-1 text-muted">Target: {profileInfo.target_kampus} ✓</span>}
      </div>

      <div className="bg-white rounded-xl border border-hairline p-5 mb-5">
        <p className="text-xs text-muted mb-3">{meta.hint}</p>

        <div className="flex gap-2 mb-3">
          <button onClick={() => setMode('paste')} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${mode === 'paste' ? 'bg-off text-navy border border-gold' : 'text-muted border border-transparent'}`}>Tempel Teks</button>
          <button onClick={() => setMode('upload')} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${mode === 'upload' ? 'bg-off text-navy border border-gold' : 'text-muted border border-transparent'}`}>Upload .docx</button>
        </div>

        {mode === 'paste' ? (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Tempel isi tulisan kamu di sini..."
              className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${overRange || underRange ? 'text-red-500 font-medium' : 'text-muted'}`}>
                {wordCount} kata{meta.minWords && meta.maxWords ? ` (target ${meta.minWords}–${meta.maxWords})` : ''}
              </span>
            </div>
          </>
        ) : (
          <input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        )}

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mt-3">{error}</div>}

        <button onClick={handleReview} disabled={reviewing} className="mt-4 bg-navy text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-navy-2 transition-colors disabled:bg-hairline">
          {reviewing ? 'Sedang membaca...' : 'Minta Review AI'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border border-gold p-5">
          <div className="mb-3">
            <h2 className="font-semibold text-ink text-sm">Hasil Review</h2>
            <p className="text-xs text-muted">{result.wordCount} kata</p>
          </div>
          {result.score !== null && (() => {
            const lvl = getScoreLevel(result.score)
            return (
              <div className="mb-4">
                <LevelProgressBar
                  label="Skor Kesiapan Tulisan" score={result.score} maxScore={10} percent={scoreToPercent(result.score, 10)}
                  levelName={lvl.name} emoji={lvl.emoji} color={lvl.color} bgColor={lvl.bgColor} borderColor={lvl.borderColor} message={lvl.message}
                  barColor={result.score >= 7 ? 'bg-purple-500' : result.score >= 5 ? 'bg-blue-500' : 'bg-yellow-400'}
                />
              </div>
            )
          })()}
          <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{result.feedback}</div>
        </div>
      )}
    </div>
  )
}
