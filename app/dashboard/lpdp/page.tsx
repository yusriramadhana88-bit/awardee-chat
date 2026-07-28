'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/use-user'
import { getScoreLevel } from '@/lib/gamification'
import { docCompletionScore, essayScore, kesiapanScore, type LatestDocCheck, type LatestEssayReview } from '@/lib/lpdp-scoring'
import type { LpdpProfileLite } from '@/lib/lpdp-requirements'
import { BATCH2_DEADLINE } from '@/lib/lpdp-requirements'
import LevelProgressBar from '../_components/LevelProgressBar'
import Countdown from './_components/Countdown'

type LpdpProfileRow = LpdpProfileLite & {
  target_kampus: string | null
  target_prodi: string | null
  rencana_kontribusi: string | null
  cv_text: string | null
}

const EMPTY_PROFILE: LpdpProfileRow = {
  jenjang: null, tujuan: null, punya_loa: false, loa_unconditional: false, status_kerja: null,
  lulusan_luar_negeri: false, pernah_gagal_studi: false, pendanaan_parsial: false,
  target_kampus: null, target_prodi: null, rencana_kontribusi: null, cv_text: null,
}

const STATUS_KERJA_LABEL: Record<string, string> = {
  asn_tni_polri: 'ASN / TNI / POLRI (aktif)',
  swasta: 'Karyawan Swasta',
  fresh_graduate: 'Fresh Graduate',
  lainnya: 'Lainnya',
}

export default function LpdpCenterPage() {
  const { user, loading } = useUser()
  const [profile, setProfile] = useState<LpdpProfileRow | null>(null)
  const [form, setForm] = useState<LpdpProfileRow>(EMPTY_PROFILE)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quotaUsedIdr, setQuotaUsedIdr] = useState(0)
  const [quotaBudgetIdr, setQuotaBudgetIdr] = useState<number | null>(null)
  const [latestDocs, setLatestDocs] = useState<LatestDocCheck[]>([])
  const [latestEssays, setLatestEssays] = useState<LatestEssayReview[]>([])
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvMsg, setCvMsg] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const headers = { Authorization: `Bearer ${session.access_token}` }
    const [profileRes, docRes, essayRes] = await Promise.all([
      fetch('/api/lpdp/profile', { headers }),
      fetch('/api/lpdp/doc-check', { headers }),
      fetch('/api/lpdp/essay-review', { headers }),
    ])
    if (profileRes.ok) {
      const data = await profileRes.json()
      setProfile(data.profile)
      if (data.profile) setForm({ ...EMPTY_PROFILE, ...data.profile })
      else setEditing(true)
    }
    if (docRes.ok) {
      const data = await docRes.json()
      setQuotaUsedIdr(data.usedIdr ?? 0)
      setQuotaBudgetIdr(data.budgetIdr ?? null)
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
    const res = await fetch('/api/lpdp/profile', {
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

  async function uploadCv() {
    if (!cvFile) return
    setCvUploading(true)
    setCvMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const fd = new FormData()
    fd.append('file', cvFile)
    const res = await fetch('/api/lpdp/cv', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: fd })
    const data = await res.json()
    if (res.ok) {
      setCvMsg('CV tersimpan — dipakai untuk cek konsistensi esai kamu.')
      setCvFile(null)
      loadAll()
    } else {
      setCvMsg(data.error || 'Gagal upload CV.')
    }
    setCvUploading(false)
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat LPDP Center...</div></div>
  }

  const docScore = docCompletionScore(form, latestDocs)
  const essScore = essayScore(latestEssays)
  const totalScore = kesiapanScore(docScore, essScore)
  const daysLeft = Math.max(0, Math.floor((BATCH2_DEADLINE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const comment = lpdpOverviewComment({ hasProfile: !!profile, docScore, essScore, totalScore, daysLeft, name: user?.name })

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <Countdown />

      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-ink">🛡️ LPDP Center</h1>
        <p className="text-sm text-muted mt-0.5">Cek kelengkapan dokumen & esai LPDP Batch 2 2026 sebelum LPDP yang nolak.</p>
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
          label="Skor Kesiapan LPDP" score={totalScore} maxScore={100} percent={totalScore}
          {...levelProps(totalScore)} barColor={totalScore >= 80 ? 'bg-purple-500' : totalScore >= 50 ? 'bg-blue-500' : 'bg-yellow-400'}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Link href="/dashboard/lpdp/dokumen" className="bg-white rounded-xl border border-hairline p-4 hover:border-gold transition-colors">
          <div className="text-2xl mb-2">🔍</div>
          <div className="font-medium text-ink text-sm">Cek Dokumen</div>
          <div className="text-xs text-muted mt-0.5">
            Upload & verifikasi dokumen administrasi
            {quotaBudgetIdr !== null && ` (kuota Rp${quotaUsedIdr.toLocaleString('id-ID')}/Rp${quotaBudgetIdr.toLocaleString('id-ID')})`}
          </div>
        </Link>
        <Link href="/dashboard/lpdp/esai" className="bg-white rounded-xl border border-hairline p-4 hover:border-gold transition-colors">
          <div className="text-2xl mb-2">📝</div>
          <div className="font-medium text-ink text-sm">Review Esai</div>
          <div className="text-xs text-muted mt-0.5">Profil Diri & Komitmen Kembali ke Indonesia direview AI</div>
        </Link>
      </div>

      <Link href="/chat/lpdp" className="block bg-gradient-to-br from-navy to-navy-2 rounded-xl p-4 text-white mb-6 hover:opacity-95 transition-opacity">
        <div className="text-sm font-semibold">💬 Tanya Den Dhana langsung</div>
        <div className="text-white/70 text-xs mt-0.5">Strategi, jadwal, atau pertanyaan spesifik soal LPDP Batch 2 2026</div>
      </Link>

      {/* Profil Intake */}
      <div className="bg-white rounded-xl border border-hairline p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink text-sm">Profil Intake LPDP</h2>
          {!editing && <button onClick={() => setEditing(true)} className="text-xs text-gold-2 hover:underline">Ubah</button>}
        </div>

        {!editing && profile ? (
          <div className="space-y-1.5 text-sm">
            <Row label="Jenjang" value={profile.jenjang === 'magister' ? 'Magister (S2)' : profile.jenjang === 'doktor' ? 'Doktor (S3)' : '-'} />
            <Row label="Tujuan Studi" value={profile.tujuan === 'dalam_negeri' ? 'Dalam Negeri' : profile.tujuan === 'luar_negeri' ? 'Luar Negeri' : '-'} />
            <Row label="Target Kampus/Prodi" value={[profile.target_kampus, profile.target_prodi].filter(Boolean).join(' — ') || '-'} />
            <Row label="Sudah punya LoA" value={profile.punya_loa ? (profile.loa_unconditional ? 'Ya, Unconditional' : 'Ya, Conditional') : 'Belum'} />
            <Row label="Status Kerja" value={profile.status_kerja ? STATUS_KERJA_LABEL[profile.status_kerja] : '-'} />
            <Row label="CV" value={profile.cv_text ? '✓ Sudah diunggah' : 'Belum diunggah'} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Jenjang" value={form.jenjang ?? ''} onChange={(v) => setForm((f) => ({ ...f, jenjang: v as never }))} options={[['', 'Pilih...'], ['magister', 'Magister (S2)'], ['doktor', 'Doktor (S3)']]} />
              <Select label="Tujuan Studi" value={form.tujuan ?? ''} onChange={(v) => setForm((f) => ({ ...f, tujuan: v as never }))} options={[['', 'Pilih...'], ['dalam_negeri', 'Dalam Negeri'], ['luar_negeri', 'Luar Negeri']]} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <TextInput label="Target Kampus" value={form.target_kampus ?? ''} onChange={(v) => setForm((f) => ({ ...f, target_kampus: v }))} />
              <TextInput label="Target Program Studi" value={form.target_prodi ?? ''} onChange={(v) => setForm((f) => ({ ...f, target_prodi: v }))} />
            </div>
            <Checkbox label="Sudah punya LoA (Letter of Acceptance)" checked={form.punya_loa} onChange={(v) => setForm((f) => ({ ...f, punya_loa: v, loa_unconditional: v ? f.loa_unconditional : false }))} />
            {form.punya_loa && (
              <Checkbox label="LoA tersebut Unconditional" checked={form.loa_unconditional} onChange={(v) => setForm((f) => ({ ...f, loa_unconditional: v }))} />
            )}
            <Select label="Status Kerja" value={form.status_kerja ?? ''} onChange={(v) => setForm((f) => ({ ...f, status_kerja: v as never }))} options={[['', 'Pilih...'], ['asn_tni_polri', 'ASN / TNI / POLRI (aktif)'], ['swasta', 'Karyawan Swasta'], ['fresh_graduate', 'Fresh Graduate'], ['lainnya', 'Lainnya']]} />
            <Checkbox label="Lulusan perguruan tinggi luar negeri (jenjang sebelumnya)" checked={form.lulusan_luar_negeri} onChange={(v) => setForm((f) => ({ ...f, lulusan_luar_negeri: v }))} />
            <Checkbox label="Pernah studi di jenjang ini tapi tidak lulus / sedang on-going pindah program" checked={form.pernah_gagal_studi} onChange={(v) => setForm((f) => ({ ...f, pernah_gagal_studi: v }))} />
            <Checkbox label="Mengajukan Skema Pendanaan Parsial" checked={form.pendanaan_parsial} onChange={(v) => setForm((f) => ({ ...f, pendanaan_parsial: v }))} />
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

      {/* CV Upload */}
      <div className="bg-white rounded-xl border border-hairline p-5 mb-6">
        <h2 className="font-semibold text-ink text-sm mb-1">Upload CV (opsional)</h2>
        <p className="text-xs text-muted mb-3">Format .docx saja. Dipakai sebagai konteks tambahan saat review esai — bukan syarat wajib LPDP.</p>
        <div className="flex items-center gap-2">
          <input type="file" accept=".docx" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} className="text-xs flex-1" />
          <button onClick={uploadCv} disabled={!cvFile || cvUploading} className="bg-navy text-white text-xs px-3 py-2 rounded-lg font-medium hover:bg-navy-2 transition-colors disabled:opacity-50 whitespace-nowrap">
            {cvUploading ? 'Mengunggah...' : 'Upload CV'}
          </button>
        </div>
        {cvMsg && <p className="text-xs text-muted mt-2">{cvMsg}</p>}
      </div>

      <p className="text-xs text-muted text-center">
        🔒 Dokumen & esai kamu disimpan terenkripsi — hanya dibuka untuk analisa AI & review mentor manusia (fitur mendatang).
      </p>
    </div>
  )
}

function levelProps(score: number) {
  const lvl = getScoreLevel(Math.round(score / 10))
  return { levelName: lvl.name, emoji: lvl.emoji, color: lvl.color, bgColor: lvl.bgColor, borderColor: lvl.borderColor, message: lvl.message }
}

function lpdpOverviewComment({ hasProfile, docScore, essScore, totalScore, daysLeft, name }: {
  hasProfile: boolean; docScore: number; essScore: number; totalScore: number; daysLeft: number; name?: string
}): string {
  const who = name ? name.split(' ')[0] : 'kamu'
  if (!hasProfile) {
    return `Halo ${who}, ini LPDP Center — bakal jadi "auditor" kamu buat LPDP Batch 2 2026. Isi dulu profil intake di bawah biar sistem tahu skema, jenjang, dan kondisi kamu, baru checklist-nya bisa akurat.`
  }
  if (docScore === 0 && essScore === 0) {
    return `Oke ${who}, profil udah kesimpen. Sekarang gas mulai — upload dokumen pertama di Cek Dokumen, atau langsung tempel Profil Diri kamu di Review Esai. Deadline masih ${daysLeft} hari lagi, tapi jangan disepelekan.`
  }
  if (totalScore >= 80) {
    return `Mantap, ${who}. Skor Kesiapan kamu udah ${totalScore}/100 — administrasi kamu udah cukup rapi. Tetap cek ulang detail kecil sebelum submit final ya, jangan lengah di garis akhir.`
  }
  if (daysLeft <= 7 && totalScore < 50) {
    return `${who}, ini serius — deadline tinggal ${daysLeft} hari dan Skor Kesiapan kamu baru ${totalScore}/100. Fokus beresin dokumen yang masih merah sekarang juga.`
  }
  if (totalScore < 50) {
    return `${who}, Skor Kesiapan kamu masih ${totalScore}/100 dan deadline ${daysLeft} hari lagi. Masih ada waktu, tapi jangan santai — cek dokumen mana yang belum "sesuai" dan segera perbaiki.`
  }
  return `Progress kamu bagus, ${who} — Skor Kesiapan sudah ${totalScore}/100. Tinggal rapikan bagian yang masih kuning/merah biar makin solid sebelum ${daysLeft} hari sisa waktu habis.`
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

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-hairline text-gold-2 focus:ring-gold" />
      {label}
    </label>
  )
}
