'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/use-user'

type Alumni = {
  id: string
  scholarship_name: string
  university: string | null
  graduation_year: number | null
  story: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
type Contribution = {
  id: string
  contribution_type: string
  description: string | null
  hours: number | null
  contributed_at: string
}
type CollectiveStats = { alumniCount: number; totalContributions: number; totalHours: number }

const TYPE_LABEL: Record<string, string> = {
  mentoring_session: 'Sesi Mentoring',
  webinar: 'Webinar / Sharing',
  referral: 'Referral Kandidat Baru',
  other: 'Lainnya',
}

export default function AlumniPage() {
  const { loading } = useUser()
  const [alumni, setAlumni] = useState<Alumni | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [collectiveStats, setCollectiveStats] = useState<CollectiveStats | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [logging, setLogging] = useState(false)
  const supabase = createClient()

  // Apply form state
  const [scholarshipName, setScholarshipName] = useState('')
  const [university, setUniversity] = useState('')
  const [gradYear, setGradYear] = useState('')
  const [story, setStory] = useState('')

  // Log contribution form state
  const [contribType, setContribType] = useState('mentoring_session')
  const [contribDesc, setContribDesc] = useState('')
  const [contribHours, setContribHours] = useState('')
  const [contribDate, setContribDate] = useState(new Date().toISOString().slice(0, 10))

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/alumni', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) {
      const data = await res.json()
      setAlumni(data.alumni)
      setContributions(data.contributions || [])
      setCollectiveStats(data.collectiveStats || null)
    }
    setPageLoading(false)
  }

  useEffect(() => { if (!loading) load() }, [loading])

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/alumni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        scholarship_name: scholarshipName,
        university,
        graduation_year: gradYear ? Number(gradYear) : null,
        story,
      }),
    })
    const data = await res.json()
    if (res.ok) setAlumni(data.alumni)
    else alert(data.error || 'Gagal mengirim pengajuan.')
    setSubmitting(false)
  }

  async function handleLogContribution(e: React.FormEvent) {
    e.preventDefault()
    setLogging(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/alumni/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        contribution_type: contribType,
        description: contribDesc,
        hours: contribHours ? Number(contribHours) : null,
        contributed_at: contribDate,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setContributions([data.contribution, ...contributions])
      setContribDesc('')
      setContribHours('')
    } else {
      alert(data.error || 'Gagal mencatat kontribusi.')
    }
    setLogging(false)
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  const totalHours = contributions.reduce((sum, c) => sum + (Number(c.hours) || 0), 0)

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Awardee Alumni</h1>
        <p className="text-sm text-muted mt-0.5">Sudah lolos beasiswa lewat Awardee.id? Gabung dan bantu mewujudkan #IndonesiaGoesGlobal.</p>
      </div>

      {collectiveStats && (
        <div className="bg-navy rounded-xl p-5 mb-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gold">{collectiveStats.alumniCount}</div>
            <div className="text-[11px] sm:text-xs text-white/60 mt-1">Alumni Aktif</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gold">{collectiveStats.totalContributions}</div>
            <div className="text-[11px] sm:text-xs text-white/60 mt-1">Kontribusi Tercatat</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gold">{collectiveStats.totalHours}</div>
            <div className="text-[11px] sm:text-xs text-white/60 mt-1">Total Jam untuk Yayasan</div>
          </div>
        </div>
      )}

      {!alumni && (
        <form onSubmit={handleApply} className="bg-white rounded-xl border border-hairline p-6 space-y-4 max-w-lg">
          <div className="text-3xl mb-1">🎓</div>
          <h2 className="font-semibold text-ink text-lg">Ajukan Jadi Awardee Alumni</h2>
          <p className="text-sm text-muted">Ceritakan sedikit tentang beasiswamu — tim kami akan review sebelum akun alumni-mu aktif.</p>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nama Beasiswa *</label>
            <input required value={scholarshipName} onChange={e => setScholarshipName(e.target.value)}
              placeholder="Contoh: Australia Awards Scholarship (AAS)"
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Universitas</label>
            <input value={university} onChange={e => setUniversity(e.target.value)}
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Tahun Lulus</label>
            <input type="number" value={gradYear} onChange={e => setGradYear(e.target.value)}
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Ceritakan Singkat Perjalananmu</label>
            <textarea value={story} onChange={e => setStory(e.target.value)} rows={4}
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={submitting}
            className="bg-navy hover:bg-navy-2 disabled:bg-hairline text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors">
            {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </form>
      )}

      {alumni?.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center max-w-lg">
          <div className="text-3xl mb-2">⏳</div>
          <h2 className="font-semibold text-ink mb-1">Pengajuan Sedang Direview</h2>
          <p className="text-sm text-muted">Tim Awardee.id akan meninjau pengajuanmu sebagai <strong>{alumni.scholarship_name}</strong> awardee. Kami akan aktifkan akun alumni-mu setelah disetujui.</p>
        </div>
      )}

      {alumni?.status === 'rejected' && (
        <div className="bg-off border border-hairline rounded-xl p-6 text-center max-w-lg">
          <p className="text-sm text-muted">Pengajuan Awardee Alumni kamu belum bisa disetujui saat ini. Hubungi tim Awardee.id kalau ada pertanyaan.</p>
        </div>
      )}

      {alumni?.status === 'approved' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-hairline p-4">
              <div className="text-2xl font-bold text-ink">{contributions.length}</div>
              <div className="text-xs text-muted mt-1">Total kontribusi tercatat</div>
            </div>
            <div className="bg-white rounded-xl border border-hairline p-4">
              <div className="text-2xl font-bold text-gold-2">{totalHours}</div>
              <div className="text-xs text-muted mt-1">Total jam kontribusi</div>
            </div>
          </div>

          {/* Log new contribution */}
          <form onSubmit={handleLogContribution} className="bg-white rounded-xl border border-hairline p-5 space-y-3">
            <h2 className="font-semibold text-ink text-sm">Catat Kontribusi Baru</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={contribType} onChange={e => setContribType(e.target.value)}
                className="border border-hairline rounded-lg px-3 py-2 text-sm">
                {Object.entries(TYPE_LABEL).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
              <input type="date" value={contribDate} onChange={e => setContribDate(e.target.value)}
                className="border border-hairline rounded-lg px-3 py-2 text-sm" />
            </div>
            <input placeholder="Deskripsi singkat (opsional)" value={contribDesc} onChange={e => setContribDesc(e.target.value)}
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm" />
            <div className="flex items-center gap-3">
              <input type="number" step="0.5" placeholder="Jam" value={contribHours} onChange={e => setContribHours(e.target.value)}
                className="w-24 border border-hairline rounded-lg px-3 py-2 text-sm" />
              <button type="submit" disabled={logging}
                className="bg-navy hover:bg-navy-2 disabled:bg-hairline text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">
                {logging ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>

          {/* History */}
          <div className="bg-white rounded-xl border border-hairline p-5">
            <h2 className="font-semibold text-ink text-sm mb-3">Riwayat Kontribusi</h2>
            {contributions.length === 0 ? (
              <p className="text-sm text-muted">Belum ada kontribusi tercatat. Mulai dari sesi mentoring pertamamu!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted border-b border-hairline">
                      <th className="pb-2 pr-4">Tanggal</th>
                      <th className="pb-2 pr-4">Jenis</th>
                      <th className="pb-2 pr-4">Deskripsi</th>
                      <th className="pb-2 text-right">Jam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map(c => (
                      <tr key={c.id} className="border-b border-hairline">
                        <td className="py-2 pr-4 text-muted">{new Date(c.contributed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-2 pr-4 text-ink">{TYPE_LABEL[c.contribution_type] ?? c.contribution_type}</td>
                        <td className="py-2 pr-4 text-muted">{c.description || '—'}</td>
                        <td className="py-2 text-right font-semibold text-ink">{c.hours ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
