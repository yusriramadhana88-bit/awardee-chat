'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser, TIER_LABEL } from '@/lib/use-user'

type Profile = {
  name: string
  email: string
  phone: string | null
  tier: 'free' | 'starter' | 'pro'
  expiresAt: string | null
  memberSince: string
  isAdmin: boolean
}
type Stats = {
  lessonsCompleted: number
  quizzesPassed: number
  achievementsEarned: number
  cvAnalyses: number
  essayReviews: number
  applications: number
}

export default function ProfilePage() {
  const { loading } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const supabase = createClient()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) {
      const data = await res.json()
      setProfile(data.profile)
      setStats(data.stats)
      setNameInput(data.profile.name)
    }
    setPageLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveName() {
    if (!nameInput.trim()) return
    setSaving(true)
    setSaveMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.trim() }),
    })
    if (res.ok) {
      setProfile(p => p ? { ...p, name: nameInput.trim() } : p)
      setEditing(false)
      setSaveMsg('Tersimpan.')
    } else {
      setSaveMsg('Gagal menyimpan. Coba lagi.')
    }
    setSaving(false)
  }

  if (loading || pageLoading || !profile || !stats) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat profil...</div></div>
  }

  const initials = profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-xl lg:text-2xl font-bold text-ink mb-6">Profil Saya</h1>

      <div className="bg-white rounded-xl border border-hairline p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-navy text-white flex items-center justify-center text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="border border-hairline rounded-lg px-3 py-1.5 text-sm font-semibold flex-1 focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <button onClick={saveName} disabled={saving} className="text-xs font-semibold bg-navy text-white px-3 py-1.5 rounded-lg disabled:opacity-60">
                  {saving ? '...' : 'Simpan'}
                </button>
                <button onClick={() => { setEditing(false); setNameInput(profile.name) }} className="text-xs text-muted px-2">Batal</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-ink truncate">{profile.name}</h2>
                <button onClick={() => setEditing(true)} className="text-xs text-gold-2 hover:underline shrink-0">Ubah</button>
              </div>
            )}
            <p className="text-sm text-muted truncate">{profile.email}</p>
            {profile.phone && <p className="text-xs text-muted mt-0.5">{profile.phone}</p>}
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-off text-gold-2 border border-gold shrink-0">
            {TIER_LABEL[profile.tier]}
          </span>
        </div>
        {saveMsg && <p className="text-xs text-muted mt-3">{saveMsg}</p>}
      </div>

      <div className="bg-white rounded-xl border border-hairline p-5 mb-6">
        <h2 className="font-semibold text-ink mb-3 text-sm">Informasi Akun</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Bergabung sejak</span>
            <span className="text-ink">{new Date(profile.memberSince).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Paket</span>
            <span className="font-medium text-ink">{TIER_LABEL[profile.tier]}</span>
          </div>
          {profile.expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted">Aktif hingga</span>
              <span className="text-ink">{new Date(profile.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-sm font-semibold text-ink mb-3">Ringkasan Aktivitas</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-ink">{stats.lessonsCompleted}</div>
          <div className="text-xs text-muted mt-1">Lesson selesai</div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-ink">{stats.quizzesPassed}</div>
          <div className="text-xs text-muted mt-1">Kuis lulus</div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-gold-2">{stats.achievementsEarned}</div>
          <div className="text-xs text-muted mt-1">Achievement</div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-ink">{stats.cvAnalyses}</div>
          <div className="text-xs text-muted mt-1">Analisis CV</div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-ink">{stats.essayReviews}</div>
          <div className="text-xs text-muted mt-1">Review essay</div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-ink">{stats.applications}</div>
          <div className="text-xs text-muted mt-1">Aplikasi beasiswa</div>
        </div>
      </div>
    </div>
  )
}
