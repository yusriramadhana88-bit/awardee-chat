'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/use-user'
import { LPDP_DOCS, applicableDocs, MAX_FILE_BYTES, type LpdpDoc, type LpdpProfileLite } from '@/lib/lpdp-requirements'
import DocStatusChip from '../_components/DocStatusChip'

type DocCheckRow = {
  doc_key: string
  verdict: 'sesuai' | 'perlu_perbaikan' | 'tidak_sesuai'
  skor: number | null
  komentar: string
  temuan: string[]
  file_name: string
  created_at: string
}

const EMPTY_PROFILE: LpdpProfileLite = {
  jenjang: null, tujuan: null, punya_loa: false, loa_unconditional: false, status_kerja: null,
  lulusan_luar_negeri: false, pernah_gagal_studi: false, pendanaan_parsial: false,
}

const ACCEPT_MAP: Record<string, string> = { pdf: '.pdf', jpg: '.jpg,.jpeg', png: '.png', docx: '.docx' }

const LOADING_TIPS = [
  'Membaca dokumennya pelan-pelan...',
  'Mencocokkan sama Buku Panduan resmi LPDP...',
  'Sabar ya, ini bukan tebak-tebakan — diteliti beneran...',
  'Ngecek tanggal terbit & tanda tangan...',
]

export default function DokumenPage() {
  const { loading } = useUser()
  const [profile, setProfile] = useState<LpdpProfileLite>(EMPTY_PROFILE)
  const [latest, setLatest] = useState<Record<string, DocCheckRow>>({})
  const [usedIdr, setUsedIdr] = useState(0)
  const [budgetIdr, setBudgetIdr] = useState<number | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [upsell, setUpsell] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  async function loadAll() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const headers = { Authorization: `Bearer ${session.access_token}` }
    const [profileRes, docRes] = await Promise.all([
      fetch('/api/lpdp/profile', { headers }),
      fetch('/api/lpdp/doc-check', { headers }),
    ])
    if (profileRes.ok) {
      const data = await profileRes.json()
      if (data.profile) setProfile({ ...EMPTY_PROFILE, ...data.profile })
    }
    if (docRes.ok) {
      const data = await docRes.json()
      setUsedIdr(data.usedIdr ?? 0)
      setBudgetIdr(data.budgetIdr ?? null)
      setLatest(data.latest ?? {})
    }
    setPageLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (!uploadingKey) return
    const t = setInterval(() => setTipIndex((i) => (i + 1) % LOADING_TIPS.length), 2500)
    return () => clearInterval(t)
  }, [uploadingKey])

  async function handleUpload(doc: LpdpDoc, file: File) {
    setError('')
    if (file.size > MAX_FILE_BYTES) {
      setError(`File "${doc.label}" terlalu besar (maks ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB).`)
      return
    }
    setUploadingKey(doc.key)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const fd = new FormData()
      fd.append('file', file)
      fd.append('docKey', doc.key)
      const res = await fetch('/api/lpdp/doc-check', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: fd })

      let data: Record<string, unknown>
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
      if (!res.ok) {
        setError((data.error as string) || 'Gagal memverifikasi dokumen.')
        return
      }
      setLatest((prev) => ({
        ...prev,
        [doc.key]: { doc_key: doc.key, verdict: data.verdict, skor: data.skor, komentar: data.komentar, temuan: data.temuan, file_name: file.name, created_at: new Date().toISOString() } as DocCheckRow,
      }))
      setUsedIdr(data.usedIdr as number)
      setBudgetIdr(data.budgetIdr as number)
      setExpandedKey(doc.key)
    } catch {
      setError('Gagal menghubungi server. Cek koneksi kamu dan coba lagi.')
    } finally {
      setUploadingKey(null)
    }
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  const docs = applicableDocs(profile)

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/lpdp" className="text-xs text-muted hover:text-ink">← LPDP Center</Link>
        <h1 className="text-xl font-bold text-ink mt-1">🔍 Cek Dokumen</h1>
        <p className="text-sm text-muted mt-0.5">
          Upload satu per satu, AI verifikasi terhadap Buku Panduan resmi LPDP Batch 2 2026.
          {budgetIdr !== null && (
            <span className="block mt-1 font-medium text-ink">
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
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

      <div className="space-y-3">
        {docs.map((doc) => {
          const row = latest[doc.key]
          const isUploading = uploadingKey === doc.key
          const isExpanded = expandedKey === doc.key
          return (
            <div key={doc.key} className="bg-white rounded-xl border border-hairline overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0">
                    <div className="font-medium text-ink text-sm">{doc.label}{!doc.wajib && <span className="text-muted font-normal"> (opsional)</span>}</div>
                    <p className="text-xs text-muted mt-0.5">{doc.hint}</p>
                  </div>
                  <DocStatusChip verdict={row?.verdict ?? null} />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <label className="text-xs bg-off border border-hairline rounded-lg px-3 py-2 cursor-pointer hover:border-gold transition-colors font-medium text-ink whitespace-nowrap">
                    {row ? 'Upload Ulang' : 'Upload File'}
                    <input
                      type="file"
                      accept={doc.acceptedTypes.map((t) => ACCEPT_MAP[t]).join(',')}
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(doc, f); e.target.value = '' }}
                    />
                  </label>
                  <span className="text-[10px] text-muted">Terima: {doc.acceptedTypes.join(', ').toUpperCase()} · maks {(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB</span>
                  {row && (
                    <button onClick={() => setExpandedKey(isExpanded ? null : doc.key)} className="ml-auto text-xs text-gold-2 hover:underline whitespace-nowrap">
                      {isExpanded ? 'Tutup' : 'Lihat Hasil'}
                    </button>
                  )}
                </div>

                {isUploading && (
                  <p className="text-xs text-muted mt-3 animate-pulse">{LOADING_TIPS[tipIndex]}</p>
                )}
              </div>

              {isExpanded && row && (
                <div className="border-t border-hairline bg-off p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink leading-relaxed">{row.komentar}</p>
                    {row.temuan?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {row.temuan.map((t, i) => (
                          <li key={i} className="text-xs text-muted flex gap-1.5">
                            <span>•</span><span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-[10px] text-muted mt-2">{row.file_name} · {new Date(row.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {docs.length < LPDP_DOCS.length && (
        <p className="text-xs text-muted text-center mt-4">
          {LPDP_DOCS.length - docs.length} dokumen lain disembunyikan karena tidak berlaku untuk profil kamu saat ini — lengkapi Profil Intake di LPDP Center kalau ada yang berubah.
        </p>
      )}
    </div>
  )
}
