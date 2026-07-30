'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/use-user'
import { getScoreLevel } from '@/lib/gamification'
import { docCompletionScore, essayScore, kesiapanScore, type LatestDocCheck, type LatestEssayReview } from '@/lib/aas-scoring'
import type { AasProfileLite } from '@/lib/aas-requirements'
import LevelProgressBar from '../_components/LevelProgressBar'
import InfoBanner from './_components/InfoBanner'

type AasProfileRow = AasProfileLite & {
  target_kampus: string | null
  target_prodi: string | null
  rencana_kontribusi: string | null
}

const EMPTY_PROFILE: AasProfileRow = {
  applicant_category: null, jenjang: null, status_kerja: null,
  target_kampus: null, target_prodi: null, rencana_kontribusi: null,
}

const CATEGORY_LABEL: Record<string, string> = {
  etg: 'Equity Target Group (ETG)',
  goi: 'Government of Indonesia (GoI/PNS luar 15 provinsi)',
  general: 'General',
}

const STATUS_KERJA_LABEL: Record<string, string> = {
  pns: 'PNS / Civil Servant',
  swasta: 'Karyawan Swasta',
  fresh_graduate: 'Fresh Graduate',
  lainnya: 'Lainnya',
}

export default function AasCenterPage() {
  const { user, loading } = useUser()
  const [profile, setProfile] = useState<AasProfileRow | null>(null)
  const [form, setForm] = useState<AasProfileRow>(EMPTY_PROFILE)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [latestDocs, setLatestDocs] = useState<LatestDocCheck[]>([])
  const [latestEssays, setLatestEssays] = useState<LatestEssayReview[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const headers = { Authorization: `Bearer ${session.access_token}` }
    const [profileRes, docRes, essayRes] = await Promise.all([
      fetch('/api/aas/profile', { headers }),
      fetch('/api/aas/doc-check', { headers }),
      fetch('/api/aas/essay-review', { headers }),
    ])
    if (profileRes.ok) {
      const data = await profileRes.json()
      setProfile(data.profile)
      if (data.profile) setForm({ ...EMPTY_PROFILE, ...data.profile })
      else setEditing(true)
    }
    if (docRes.ok) {
      const data = await docRes.json()
      setLatestDocs(Object.values(data.latest ?? {}) as LatestDocCheck[])
    }
    if (essayRes.ok) {
      const data = await essayRes.json()
      setLatestEssays(Object.values(data.latest ?? {}) as LatestEssayReview[])
    }
    setPageLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  async function saveProfile() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/aas/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data.profile)
      setEditing(false)
    }
    setSaving(false)
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat AAS Center...</div></div>
  }

  const docScore = docCompletionScore(form, latestDocs)
  const essScore = essayScore(latestEssays)
  const totalScore = kesiapanScore(docScore, essScore)

  const comment = aasOverviewComment({ hasProfile: !!profile, docScore, essScore, totalScore, name: user?.name })

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <InfoBanner />

      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-ink">🦘 AAS Center</h1>
        <p className="text-sm text-muted mt-0.5">Cek kelengkapan dokumen & supporting statement Australia Awards Scholarship sebelum submit.</p>
      </div>

      <div className="bg-white rounded-xl border border-hairline p-4 mb-6">
        <p className="text-sm text-ink leading-relaxed">{comment}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <LevelProgressBar
          label="Skor Kelengkapan Dokumen" score={docScore} maxScore={100} percent={docScore}
          {...levelProps(docScore)}
        />
        <LevelProgressBar
          label="Skor Esai" score={essScore} maxScore={100} percent={essScore}
          {...levelProps(essScore)}
        />
        <LevelProgressBar
          label="Skor Kesiapan AAS" score={totalScore} maxScore={100} percent={totalScore}
          {...levelProps(totalScore)} barColor={totalScore >= 80 ? 'bg-purple-500' : totalScore >= 50 ? 'bg-blue-500' : 'bg-yellow-400'}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Link href="/dashboard/aas/dokumen" className="bg-white rounded-xl border border-hairline p-4 hover:border-gold transition-colors">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-medium text-ink text-sm">Cek Dokumen</div>
          <div className="text-xs text-muted mt-0.5">Upload & verifikasi dokumen administrasi AAS</div>
        </Link>
        <Link href="/dashboard/aas/esai" className="bg-white rounded-xl border border-hairline p-4 hover:border-gold transition-colors">
          <div className="text-2xl mb-2">📝</div>
          <div className="font-medium text-ink text-sm">Review Esai</div>
          <div className="text-xs text-muted mt-0.5">Supporting statement direview AI sesuai rubrik resmi AAI</div>
        </Link>
      </div>

      <Link href="/chat/aas" className="block bg-gradient-to-br from-navy to-navy-2 rounded-xl p-4 text-white mb-6 hover:opacity-95 transition-opacity">
        <div className="text-sm font-semibold">💬 Tanya Den Dhana langsung</div>
        <div className="text-white/70 text-xs mt-0.5">Strategi, interview, atau pertanyaan spesifik soal AAS</div>
      </Link>

      {/* Profil Intake */}
      <div className="bg-white rounded-xl border border-hairline p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink text-sm">Profil Intake AAS</h2>
          {!editing && <button onClick={() => setEditing(true)} className="text-xs text-gold-2 hover:underline">Ubah</button>}
        </div>

        {!editing && profile ? (
          <div className="space-y-1.5 text-sm">
            <Row label="Kategori Applicant" value={profile.applicant_category ? CATEGORY_LABEL[profile.applicant_category] : '-'} />
            <Row label="Jenjang" value={profile.jenjang === 'master' ? 'Master (S2)' : profile.jenjang === 'doktor' ? 'Doktor (S3)' : '-'} />
            <Row label="Target Kampus/Prodi" value={[profile.target_kampus, profile.target_prodi].filter(Boolean).join(' — ') || '-'} />
            <Row label="Status Kerja" value={profile.status_kerja ? STATUS_KERJA_LABEL[profile.status_kerja] : '-'} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Kategori Applicant" value={form.applicant_category ?? ''} onChange={(v) => setForm((f) => ({ ...f, applicant_category: v as never }))} options={[['', 'Pilih...'], ['etg', 'Equity Target Group (ETG)'], ['goi', 'Government of Indonesia (GoI)'], ['general', 'General']]} />
              <Select label="Jenjang" value={form.jenjang ?? ''} onChange={(v) => setForm((f) => ({ ...f, jenjang: v as never }))} options={[['', 'Pilih...'], ['master', 'Master (S2)'], ['doktor', 'Doktor (S3)']]} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <TextInput label="Target Kampus" value={form.target_kampus ?? ''} onChange={(v) => setForm((f) => ({ ...f, target_kampus: v }))} />
              <TextInput label="Target Program Studi" value={form.target_prodi ?? ''} onChange={(v) => setForm((f) => ({ ...f, target_prodi: v }))} />
            </div>
            <Select label="Status Kerja" value={form.status_kerja ?? ''} onChange={(v) => setForm((f) => ({ ...f, status_kerja: v as never }))} options={[['', 'Pilih...'], ['pns', 'PNS / Civil Servant'], ['swasta', 'Karyawan Swasta'], ['fresh_graduate', 'Fresh Graduate'], ['lainnya', 'Lainnya']]} />
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Rencana Kontribusi (opsional, ringkas)</label>
              <textarea
                value={form.rencana_kontribusi ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, rencana_kontribusi: e.target.value }))}
                rows={3}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveProfile} disabled={saving} className="bg-navy text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-navy-2 transition-colors disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
              {profile && <button onClick={() => { setEditing(false); setForm(profile) }} className="text-sm text-muted px-3">Batal</button>}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted text-center">
        🔒 Dokumen kamu disimpan terenkripsi — hanya dibuka untuk analisa AI. Status PNS wajib diisi akurat karena menentukan dokumen tambahan yang wajib diunggah (Nominating Agency Declaration & SK Pengangkatan).
      </p>
    </div>
  )
}

function levelProps(score: number) {
  const lvl = getScoreLevel(Math.round(score / 10))
  return { levelName: lvl.name, emoji: lvl.emoji, color: lvl.color, bgColor: lvl.bgColor, borderColor: lvl.borderColor, message: lvl.message }
}

function aasOverviewComment({ hasProfile, docScore, essScore, totalScore, name }: {
  hasProfile: boolean; docScore: number; essScore: number; totalScore: number; name?: string
}): string {
  const who = name ? name.split(' ')[0] : 'kamu'
  if (!hasProfile) {
    return `Halo ${who}, ini AAS Center — bakal jadi "auditor" kamu buat aplikasi Australia Awards Scholarship. Isi dulu profil intake di bawah biar sistem tahu kategori applicant dan status kerja kamu, baru checklist-nya bisa akurat (terutama soal dokumen PNS).`
  }
  if (docScore === 0 && essScore === 0) {
    return `Oke ${who}, profil udah kesimpen. Sekarang gas mulai — upload dokumen pertama di Cek Dokumen, atau langsung tempel jawaban supporting statement kamu di Review Esai.`
  }
  if (totalScore >= 80) {
    return `Mantap, ${who}. Skor Kesiapan kamu udah ${totalScore}/100 — administrasi kamu udah cukup rapi. Tetap cek ulang sertifikasi dokumen sebelum submit final ya, ini yang paling sering bikin aplikasi ditolak administrasi.`
  }
  if (totalScore < 50) {
    return `${who}, Skor Kesiapan kamu masih ${totalScore}/100. Masih ada waktu, tapi jangan santai — cek dokumen mana yang belum "sesuai" dan segera perbaiki, terutama soal sertifikasi dan batas 2MB per file.`
  }
  return `Progress kamu bagus, ${who} — Skor Kesiapan sudah ${totalScore}/100. Tinggal rapikan bagian yang masih kuning/merah biar makin solid.`
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-ink text-right">{value}</span>
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
    </div>
  )
}
