'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import FeatureLock from '../_components/FeatureLock'
import LevelProgressBar from '../_components/LevelProgressBar'
import { getIeltsLevel, scoreToPercent } from '@/lib/gamification'

type TestScore = {
  id: string
  test_type: string
  test_date: string | null
  overall_score: number | null
  listening: number | null
  reading: number | null
  writing: number | null
  speaking: number | null
  is_target: boolean
  notes: string | null
  created_at: string
}

const TEST_TYPE_LABEL: Record<string, string> = {
  ielts: 'IELTS',
  toefl_ibt: 'TOEFL iBT',
  pte: 'PTE Academic',
  duolingo: 'Duolingo English Test',
  other: 'Lainnya',
}

const EMPTY_FORM = {
  test_type: 'ielts',
  test_date: '',
  overall_score: '',
  listening: '',
  reading: '',
  writing: '',
  speaking: '',
  is_target: false,
  notes: '',
}

export default function IeltsTrackerPage() {
  const { user, loading } = useUser()
  const [scores, setScores] = useState<TestScore[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const tier = user?.tier || 'free'
  const allowed = canAccess(tier, 'starter')

  useEffect(() => {
    if (!allowed) return
    loadScores()
  }, [allowed])

  async function loadScores() {
    const { data } = await supabase.from('test_scores').select('*').order('test_date', { ascending: true, nullsFirst: false })
    setScores(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSaving(false)
      return
    }

    const payload: any = {
      user_id: session.user.id,
      test_type: form.test_type,
      test_date: form.test_date || null,
      is_target: form.is_target,
      notes: form.notes.trim() || null,
    }
    for (const key of ['overall_score', 'listening', 'reading', 'writing', 'speaking'] as const) {
      payload[key] = form[key] === '' ? null : Number(form[key])
    }

    await supabase.from('test_scores').insert(payload)
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
    loadScores()
  }

  async function handleDelete(id: string) {
    await supabase.from('test_scores').delete().eq('id', id)
    loadScores()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  if (!allowed) {
    return <FeatureLock requiredTier="starter" featureName="IELTS Tracker" />
  }

  const target = scores.find(s => s.is_target)
  const attempts = scores.filter(s => !s.is_target)
  const latest = attempts[attempts.length - 1]

  const skills: { key: keyof TestScore; label: string }[] = [
    { key: 'overall_score', label: 'Overall' },
    { key: 'listening', label: 'Listening' },
    { key: 'reading', label: 'Reading' },
    { key: 'writing', label: 'Writing' },
    { key: 'speaking', label: 'Speaking' },
  ]

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">IELTS / Test Score Tracker</h1>
          <p className="text-sm text-muted mt-0.5">Catat hasil tes bahasa kamu dan pantau progres menuju target.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-navy-2 transition-colors whitespace-nowrap"
        >
          + Tambah Skor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-hairline p-5 mb-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Jenis Tes</label>
              <select
                value={form.test_type}
                onChange={e => setForm({ ...form, test_type: e.target.value })}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                {Object.entries(TEST_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Tanggal Tes</label>
              <input
                type="date"
                value={form.test_date}
                onChange={e => setForm({ ...form, test_date: e.target.value })}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="is_target"
                checked={form.is_target}
                onChange={e => setForm({ ...form, is_target: e.target.checked })}
                className="rounded border-hairline"
              />
              <label htmlFor="is_target" className="text-sm text-ink">Ini adalah skor target</label>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {skills.map(s => (
              <div key={s.key as string}>
                <label className="block text-xs font-medium text-muted mb-1">{s.label}</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="9"
                  value={(form as any)[s.key]}
                  onChange={e => setForm({ ...form, [s.key]: e.target.value })}
                  placeholder="0.0"
                  className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Catatan (opsional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Contoh: Percobaan ke-2, fokus latihan writing task 2"
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-navy text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-navy-2 transition-colors disabled:bg-hairline">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted px-4 py-2">Batal</button>
          </div>
        </form>
      )}

      {/* Progress vs Target */}
      {target && (
        <div className="bg-white rounded-xl border border-hairline p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink text-sm">
              Progres Menuju Target {TEST_TYPE_LABEL[target.test_type]}
            </h2>
            {latest?.overall_score !== undefined && latest.overall_score !== null && (() => {
              const ieltsLvl = getIeltsLevel(latest.overall_score)
              return ieltsLvl ? (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ieltsLvl.bgColor} ${ieltsLvl.color} border ${ieltsLvl.borderColor}`}>
                  {ieltsLvl.emoji} {ieltsLvl.name}
                </span>
              ) : null
            })()}
          </div>
          <div className="space-y-3">
            {skills.map(s => {
              const targetVal = target[s.key] as number | null
              const currentVal = latest?.[s.key] as number | null
              if (targetVal === null) return null
              const pct = currentVal !== null ? Math.min(100, (currentVal / targetVal) * 100) : 0
              const reached = currentVal !== null && currentVal >= targetVal

              if (s.key === 'overall_score' && currentVal !== null) {
                const ieltsLvl = getIeltsLevel(currentVal)
                return ieltsLvl ? (
                  <LevelProgressBar
                    key={s.key as string}
                    label={`${s.label} (target: ${targetVal})`}
                    score={currentVal}
                    maxScore={9}
                    percent={scoreToPercent(currentVal, 9)}
                    levelName={ieltsLvl.name}
                    emoji={ieltsLvl.emoji}
                    color={ieltsLvl.color}
                    bgColor={ieltsLvl.bgColor}
                    borderColor={ieltsLvl.borderColor}
                    message={ieltsLvl.message}
                    barColor={reached ? 'bg-green-500' : 'bg-blue-500'}
                  />
                ) : null
              }

              return (
                <div key={s.key as string}>
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>{s.label}</span>
                    <span className={reached ? 'text-green-600 font-semibold' : ''}>
                      {currentVal ?? '—'} / {targetVal}
                    </span>
                  </div>
                  <div className="w-full bg-off rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${reached ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-hairline p-5">
        <h2 className="font-semibold text-ink text-sm mb-4">Riwayat Percobaan</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted">Belum ada riwayat tes. Tambahkan skor pertamamu!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-hairline">
                  <th className="pb-2 pr-4">Tanggal</th>
                  <th className="pb-2 pr-4">Jenis</th>
                  <th className="pb-2 pr-4 text-center">Overall</th>
                  <th className="pb-2 pr-4 text-center">L</th>
                  <th className="pb-2 pr-4 text-center">R</th>
                  <th className="pb-2 pr-4 text-center">W</th>
                  <th className="pb-2 pr-4 text-center">S</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {[...attempts].reverse().map(s => (
                  <tr key={s.id} className="border-b border-hairline">
                    <td className="py-2 pr-4 text-ink">{s.test_date ? new Date(s.test_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="py-2 pr-4 text-ink">{TEST_TYPE_LABEL[s.test_type]}</td>
                    <td className="py-2 pr-4 text-center font-semibold text-gold-2">{s.overall_score ?? '—'}</td>
                    <td className="py-2 pr-4 text-center text-muted">{s.listening ?? '—'}</td>
                    <td className="py-2 pr-4 text-center text-muted">{s.reading ?? '—'}</td>
                    <td className="py-2 pr-4 text-center text-muted">{s.writing ?? '—'}</td>
                    <td className="py-2 pr-4 text-center text-muted">{s.speaking ?? '—'}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => handleDelete(s.id)} className="text-muted hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!target && (
          <p className="text-xs text-muted mt-4">Tip: tambahkan skor dengan centang &quot;Ini adalah skor target&quot; untuk melihat progres visual.</p>
        )}
      </div>
    </div>
  )
}
