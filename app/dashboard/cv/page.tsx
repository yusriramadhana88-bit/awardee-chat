'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import FeatureLock from '../_components/FeatureLock'
import LevelProgressBar from '../_components/LevelProgressBar'
import { getScoreLevel, scoreToPercent } from '@/lib/gamification'

type CvHistory = { id: string; target_scholarship: string | null; analysis: string; score: number | null; created_at: string }

const MAX_FILE_BYTES = 5 * 1024 * 1024

export default function CvAnalyzerPage() {
  const { user, loading } = useUser()
  const [mode, setMode] = useState<'paste' | 'upload'>('paste')
  const [cvContent, setCvContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [target, setTarget] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [history, setHistory] = useState<CvHistory[]>([])
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const tier = user?.tier || 'free'
  const allowed = canAccess(tier, 'vip')

  useEffect(() => {
    if (!allowed) return
    loadHistory()
  }, [allowed])

  async function loadHistory() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/cv-analyze', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setUsage({ used: data.used, limit: data.limit })
      setHistory(data.history || [])
    }
  }

  async function handleAnalyze() {
    if (mode === 'paste' && cvContent.trim().length < 50) {
      setError('CV terlalu pendek. Minimal 50 karakter.')
      return
    }
    if (mode === 'upload' && !file) {
      setError('Pilih file PDF atau .docx dulu.')
      return
    }
    if (mode === 'upload' && file && file.size > MAX_FILE_BYTES) {
      setError(`File terlalu besar (maks ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB).`)
      return
    }
    setAnalyzing(true)
    setError('')
    setAnalysis('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    let res: Response
    if (mode === 'upload' && file) {
      const fd = new FormData()
      fd.append('file', file)
      if (target.trim()) fd.append('targetScholarship', target.trim())
      res = await fetch('/api/cv-analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      })
    } else {
      res = await fetch('/api/cv-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ cvContent, targetScholarship: target.trim() || undefined }),
      })
    }

    const data = await res.json()
    if (res.ok) {
      setAnalysis(data.analysis)
      setCurrentScore(data.score ?? null)
      setUsage({ used: data.used, limit: data.limit })
      loadHistory()
    } else if (data.error === 'LIMIT_REACHED') {
      setError(`Batas analisis bulan ini sudah habis (${data.limit}x/bulan). Upgrade ke Pro untuk unlimited.`)
    } else {
      setError(data.error || 'Gagal menganalisis CV.')
    }
    setAnalyzing(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  const atLimit = usage ? usage.used >= usage.limit : false

  return (
    <FeatureLock locked={!allowed} requiredTier="vip" featureName="CV Analyzer">
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">CV Analyzer</h1>
        <p className="text-sm text-muted mt-0.5">
          Tempel CV kamu, dapatkan analisis kekuatan & kelemahan untuk aplikasi beasiswa.
          {usage && (
            <span className="ml-1 text-muted">
              ({usage.used}/{usage.limit === 999 ? '∞' : usage.limit} analisis bulan ini)
            </span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-hairline p-5 mb-6">
        <label className="block text-sm font-medium text-ink mb-1.5">
          Target Beasiswa <span className="text-muted font-normal">(opsional)</span>
        </label>
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Contoh: AAS, LPDP Reguler, Chevening"
          className="w-full border border-hairline rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold mb-4"
        />

        <label className="block text-sm font-medium text-ink mb-1.5">Isi CV</label>
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setMode('paste')} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${mode === 'paste' ? 'bg-off text-navy border border-gold' : 'text-muted border border-transparent'}`}>Tempel Teks</button>
          <button type="button" onClick={() => setMode('upload')} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${mode === 'upload' ? 'bg-off text-navy border border-gold' : 'text-muted border border-transparent'}`}>Upload PDF/.docx</button>
        </div>

        {mode === 'paste' ? (
          <>
            <textarea
              value={cvContent}
              onChange={e => setCvContent(e.target.value)}
              placeholder="Tempel seluruh isi CV kamu di sini (pengalaman kerja, pendidikan, organisasi, prestasi, dll)..."
              rows={12}
              className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none font-mono"
            />
            <div className="flex items-center justify-between mt-1 mb-4">
              <span className="text-xs text-muted">{cvContent.length} karakter</span>
            </div>
          </>
        ) : (
          <div className="mb-4">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="text-xs text-muted mt-1">PDF atau Word (.docx), maks {(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={analyzing || atLimit || (mode === 'paste' ? cvContent.trim().length < 50 : !file)}
          className="w-full bg-navy hover:bg-navy-2 disabled:bg-hairline text-white rounded-xl py-3 text-sm font-semibold transition-colors"
        >
          {analyzing ? 'Menganalisis...' : atLimit ? 'Batas bulanan tercapai' : 'Analisis CV'}
        </button>
      </div>

      {analysis && (
        <div className="bg-white rounded-xl border border-gold p-5 mb-6">
          <h2 className="font-semibold text-ink mb-3 text-sm">Hasil Analisis</h2>
          {currentScore !== null && (() => {
            const lvl = getScoreLevel(currentScore)
            return (
              <div className="mb-4">
                <LevelProgressBar
                  label="Skor Kesiapan CV"
                  score={currentScore}
                  maxScore={10}
                  percent={scoreToPercent(currentScore, 10)}
                  levelName={lvl.name}
                  emoji={lvl.emoji}
                  color={lvl.color}
                  bgColor={lvl.bgColor}
                  borderColor={lvl.borderColor}
                  message={lvl.message}
                  barColor={currentScore >= 7 ? 'bg-purple-500' : currentScore >= 5 ? 'bg-blue-500' : 'bg-yellow-400'}
                />
              </div>
            )
          })()}
          <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap leading-relaxed">
            {analysis}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-hairline p-5">
          <h2 className="font-semibold text-ink mb-3 text-sm">Riwayat Analisis</h2>
          <div className="space-y-3">
            {history.map(h => (
              <details key={h.id} className="border border-hairline rounded-lg group">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-ink flex items-center justify-between">
                  <span>{h.target_scholarship || 'Analisis CV'} — {new Date(h.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <div className="flex items-center gap-2">
                    {h.score !== null && (() => {
                      const lvl = getScoreLevel(h.score)
                      return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvl.bgColor} ${lvl.color}`}>{lvl.emoji} {h.score}/10</span>
                    })()}
                    <span className="text-muted group-open:rotate-180 transition-transform">▾</span>
                  </div>
                </summary>
                <div className="px-4 pb-4 text-sm text-muted whitespace-pre-wrap leading-relaxed">{h.analysis}</div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
    </FeatureLock>
  )
}
