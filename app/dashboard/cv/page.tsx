'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import FeatureLock from '../_components/FeatureLock'
import LevelProgressBar from '../_components/LevelProgressBar'
import { getScoreLevel, scoreToPercent } from '@/lib/gamification'

type CvHistory = { id: string; target_scholarship: string | null; analysis: string; score: number | null; created_at: string }

export default function CvAnalyzerPage() {
  const { user, loading } = useUser()
  const [cvContent, setCvContent] = useState('')
  const [target, setTarget] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [history, setHistory] = useState<CvHistory[]>([])
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const tier = user?.tier || 'free'
  const allowed = canAccess(tier, 'starter')

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
    if (cvContent.trim().length < 50) {
      setError('CV terlalu pendek. Minimal 50 karakter.')
      return
    }
    setAnalyzing(true)
    setError('')
    setAnalysis('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/cv-analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ cvContent, targetScholarship: target.trim() || undefined }),
    })

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
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 text-sm">Memuat...</div></div>
  }

  if (!allowed) {
    return <FeatureLock requiredTier="starter" featureName="CV Analyzer" />
  }

  const atLimit = usage ? usage.used >= usage.limit : false

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">CV Analyzer</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tempel CV kamu, dapatkan analisis kekuatan & kelemahan untuk aplikasi beasiswa.
          {usage && (
            <span className="ml-1 text-gray-400">
              ({usage.used}/{usage.limit === 999 ? '∞' : usage.limit} analisis bulan ini)
            </span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Target Beasiswa <span className="text-gray-400 font-normal">(opsional)</span>
        </label>
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Contoh: AAS, LPDP Reguler, Chevening"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1.5">Isi CV</label>
        <textarea
          value={cvContent}
          onChange={e => setCvContent(e.target.value)}
          placeholder="Tempel seluruh isi CV kamu di sini (pengalaman kerja, pendidikan, organisasi, prestasi, dll)..."
          rows={12}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-mono"
        />
        <div className="flex items-center justify-between mt-1 mb-4">
          <span className="text-xs text-gray-400">{cvContent.length} karakter</span>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={analyzing || atLimit || cvContent.trim().length < 50}
          className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
        >
          {analyzing ? 'Menganalisis...' : atLimit ? 'Batas bulanan tercapai' : 'Analisis CV'}
        </button>
      </div>

      {analysis && (
        <div className="bg-white rounded-xl border border-sky-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Hasil Analisis</h2>
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
                  barColor={currentScore >= 7 ? 'bg-purple-500' : currentScore >= 5 ? 'bg-sky-500' : 'bg-yellow-400'}
                />
              </div>
            )
          })()}
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
            {analysis}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Riwayat Analisis</h2>
          <div className="space-y-3">
            {history.map(h => (
              <details key={h.id} className="border border-gray-100 rounded-lg group">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-800 flex items-center justify-between">
                  <span>{h.target_scholarship || 'Analisis CV'} — {new Date(h.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <div className="flex items-center gap-2">
                    {h.score !== null && (() => {
                      const lvl = getScoreLevel(h.score)
                      return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvl.bgColor} ${lvl.color}`}>{lvl.emoji} {h.score}/10</span>
                    })()}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                  </div>
                </summary>
                <div className="px-4 pb-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{h.analysis}</div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
