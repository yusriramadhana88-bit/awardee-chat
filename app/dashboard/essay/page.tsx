'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import FeatureLock from '../_components/FeatureLock'
import LevelProgressBar from '../_components/LevelProgressBar'
import { getScoreLevel, scoreToPercent } from '@/lib/gamification'

type EssayDraft = {
  id: string
  title: string
  essay_type: string
  content: string
  ai_feedback: string | null
  score: number | null
  reviewed_at: string | null
  updated_at: string
}

const ESSAY_TYPES: Record<string, string> = {
  personal_statement: 'Personal Statement',
  leadership: 'Leadership Essay',
  community_impact: 'Community Impact Statement',
  study_plan: 'Study Plan',
  motivation: 'Motivation Letter',
  other: 'Lainnya',
}

export default function EssayWorkshopPage() {
  const { user, loading } = useUser()
  const [drafts, setDrafts] = useState<EssayDraft[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [essayType, setEssayType] = useState('other')
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const tier = user?.tier || 'free'
  const allowed = canAccess(tier, 'vvip')

  useEffect(() => {
    if (!allowed) return
    loadDrafts()
  }, [allowed])

  async function loadDrafts() {
    const { data } = await supabase.from('essay_drafts').select('*').order('updated_at', { ascending: false })
    setDrafts(data || [])
  }

  function selectDraft(d: EssayDraft) {
    setSelectedId(d.id)
    setTitle(d.title)
    setEssayType(d.essay_type)
    setContent(d.content)
    setError('')
  }

  async function handleNewDraft() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('essay_drafts')
      .insert({ user_id: session.user.id, title: 'Essay Baru', essay_type: 'other', content: '' })
      .select('*')
      .single()
    if (data) {
      await loadDrafts()
      selectDraft(data)
    }
  }

  async function handleSave() {
    if (!selectedId) return
    setSaving(true)
    await supabase
      .from('essay_drafts')
      .update({ title: title.trim() || 'Essay Tanpa Judul', essay_type: essayType, content, updated_at: new Date().toISOString() })
      .eq('id', selectedId)
    setSaving(false)
    loadDrafts()
  }

  async function handleDelete(id: string) {
    await supabase.from('essay_drafts').delete().eq('id', id)
    if (selectedId === id) setSelectedId(null)
    loadDrafts()
  }

  async function handleReview() {
    if (!selectedId) return
    if (content.trim().length < 100) {
      setError('Essay terlalu pendek. Minimal 100 karakter untuk direview.')
      return
    }
    setReviewing(true)
    setError('')

    await handleSave()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setReviewing(false)
      return
    }

    const res = await fetch('/api/essay-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ draftId: selectedId, content, essayType }),
    })
    const data = await res.json()
    if (res.ok) {
      loadDrafts()
      setDrafts(prev => prev.map(d => d.id === selectedId ? { ...d, ai_feedback: data.feedback, score: data.score ?? null, reviewed_at: data.reviewed_at } : d))
    } else {
      setError(data.error || 'Gagal mereview essay.')
    }
    setReviewing(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  const selected = drafts.find(d => d.id === selectedId)

  return (
    <FeatureLock locked={!allowed} requiredTier="vvip" featureName="Essay Workshop">
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Essay Workshop</h1>
          <p className="text-sm text-muted mt-0.5">Tulis, simpan, dan dapatkan kritik AI mendalam untuk essay beasiswamu.</p>
        </div>
        <button onClick={handleNewDraft} className="bg-navy text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-navy-2 transition-colors whitespace-nowrap">
          + Draft Baru
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Draft list */}
        <div className="lg:col-span-1 space-y-2">
          {drafts.length === 0 ? (
            <div className="bg-white rounded-xl border border-hairline p-6 text-center text-sm text-muted">
              Belum ada draft essay. Buat draft pertamamu!
            </div>
          ) : (
            drafts.map(d => (
              <button
                key={d.id}
                onClick={() => selectDraft(d)}
                className={`w-full text-left bg-white rounded-xl border p-3.5 transition-colors ${selectedId === d.id ? 'border-gold ring-1 ring-gold/30' : 'border-hairline hover:border-gold'}`}
              >
                <div className="font-medium text-sm text-ink truncate">{d.title}</div>
                <div className="text-xs text-muted mt-0.5">{ESSAY_TYPES[d.essay_type] || 'Lainnya'}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  {d.ai_feedback && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Sudah direview</span>}
                  <span className="text-[10px] text-muted">{new Date(d.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-xl border border-hairline p-10 text-center text-sm text-muted h-full flex items-center justify-center">
              Pilih draft di sebelah kiri, atau buat draft baru.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-hairline p-5">
                <div className="grid sm:grid-cols-3 gap-3 mb-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted mb-1">Judul Draft</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Jenis Essay</label>
                    <select
                      value={essayType}
                      onChange={e => setEssayType(e.target.value)}
                      className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    >
                      {Object.entries(ESSAY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <label className="block text-xs font-medium text-muted mb-1">Isi Essay</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={14}
                  placeholder="Tulis atau tempel essay kamu di sini..."
                  className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted">{content.trim().split(/\s+/).filter(Boolean).length} kata</span>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mt-3">{error}</div>
                )}

                <div className="flex gap-2 mt-4">
                  <button onClick={handleSave} disabled={saving} className="border border-hairline text-ink text-sm px-4 py-2 rounded-lg font-medium hover:bg-off transition-colors disabled:opacity-50">
                    {saving ? 'Menyimpan...' : 'Simpan Draft'}
                  </button>
                  <button onClick={handleReview} disabled={reviewing} className="bg-navy text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-navy-2 transition-colors disabled:bg-hairline">
                    {reviewing ? 'Menganalisis...' : 'Minta Kritik AI'}
                  </button>
                  <button onClick={() => handleDelete(selected.id)} className="ml-auto text-sm text-muted hover:text-red-500 transition-colors px-3">
                    Hapus
                  </button>
                </div>
              </div>

              {selected.ai_feedback && (
                <div className="bg-white rounded-xl border border-gold p-5">
                  <h2 className="font-semibold text-ink mb-1 text-sm">Kritik AI — GALI DIRI</h2>
                  {selected.reviewed_at && (
                    <p className="text-xs text-muted mb-3">Direview pada {new Date(selected.reviewed_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  )}
                  {selected.score !== null && (() => {
                    const lvl = getScoreLevel(selected.score)
                    return (
                      <div className="mb-4">
                        <LevelProgressBar
                          label="Skor Kesiapan Essay"
                          score={selected.score}
                          maxScore={10}
                          percent={scoreToPercent(selected.score, 10)}
                          levelName={lvl.name}
                          emoji={lvl.emoji}
                          color={lvl.color}
                          bgColor={lvl.bgColor}
                          borderColor={lvl.borderColor}
                          message={lvl.message}
                          barColor={selected.score >= 7 ? 'bg-purple-500' : selected.score >= 5 ? 'bg-blue-500' : 'bg-yellow-400'}
                        />
                      </div>
                    )
                  })()}
                  <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{selected.ai_feedback}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </FeatureLock>
  )
}
