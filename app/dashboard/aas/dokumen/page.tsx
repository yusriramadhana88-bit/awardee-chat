'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import { AAS_DOCS, applicableDocs, MAX_FILE_BYTES, type AasDoc, type AasProfileLite } from '@/lib/aas-requirements'
import FeatureLock from '../../_components/FeatureLock'
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

const EMPTY_PROFILE: AasProfileLite = { applicant_category: null, jenjang: null, status_kerja: null }

const ACCEPT_MAP: Record<string, string> = { pdf: '.pdf', jpg: '.jpg,.jpeg', png: '.png', docx: '.docx' }

const LOADING_TIPS = [
  'Membaca dokumennya pelan-pelan...',
  'Mencocokkan sama Policy Handbook resmi AAS...',
  'Sabar ya, ini bukan tebak-tebakan — diteliti beneran...',
  'Ngecek sertifikasi & format filenya...',
]

export default function DokumenPage() {
  const { user, loading } = useUser()
  const [profile, setProfile] = useState<AasProfileLite>(EMPTY_PROFILE)
  const [latest, setLatest] = useState<Record<string, DocCheckRow>>({})
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
      fetch('/api/aas/profile', { headers }),
      fetch('/api/aas/doc-check', { headers }),
    ])
    if (profileRes.ok) {
      const data = await profileRes.json()
      if (data.profile) setProfile({ ...EMPTY_PROFILE, ...data.profile })
    }
    if (docRes.ok) {
      const data = await docRes.json()
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

  async function handleUpload(doc: AasDoc, file: File) {
    setError('')
    if (file.size > MAX_FILE_BYTES) {
      setError(`File "${doc.label}" terlalu besar (maks ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB — batas keras sistem OASIS resmi).`)
      return
    }
    setUploadingKey(doc.key)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const fd = new FormData()
      fd.append('file', file)
      fd.append('docKey', doc.key)
      const res = await fetch('/api/aas/doc-check', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: fd })

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

  if (!canAccess(user?.tier, 'starter')) {
    return <FeatureLock requiredTier="starter" featureName="Cek Dokumen AAS" />
  }

  const docs = applicableDocs(profile)

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/aas" className="text-xs text-muted hover:text-ink">← AAS Center</Link>
        <h1 className="text-xl font-bold text-ink mt-1">🔍 Cek Dokumen</h1>
        <p className="text-sm text-muted mt-0.5">
          Upload satu per satu, AI verifikasi terhadap Policy Handbook resmi AAS. Hanya PDF/JPG/PNG, maks 2MB per file.
        </p>
      </div>

      {upsell && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          Cek Dokumen AAS butuh tier Starter ke atas. <Link href="/dashboard#upgrade" className="font-semibold underline">Upgrade tier</Link> untuk mengakses fitur ini.
        </div>
      )}
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

      <div className="space-y-3">
        {docs.map((doc) => {
          const check = latest[doc.key]
          const isUploading = uploadingKey === doc.key
          const isExpanded = expandedKey === doc.key
          return (
            <div key={doc.key} className="bg-white rounded-xl border border-hairline overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink">{doc.label}</span>
                      {!doc.wajib && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Opsional</span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{doc.hint}</p>
                    {check?.file_name && <p className="text-[11px] text-muted mt-1">📎 {check.file_name}</p>}
                  </div>
                  <DocStatusChip verdict={check?.verdict} />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <label className="text-xs bg-off border border-hairline rounded-lg px-3 py-1.5 cursor-pointer hover:border-gold transition-colors">
                    {check ? 'Upload Ulang' : 'Upload'}
                    <input
                      type="file"
                      accept={doc.acceptedTypes.map((t) => ACCEPT_MAP[t]).join(',')}
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(doc, f); e.target.value = '' }}
                    />
                  </label>
                  {check && (
                    <button onClick={() => setExpandedKey(isExpanded ? null : doc.key)} className="text-xs text-gold-2 hover:underline">
                      {isExpanded ? 'Sembunyikan detail' : 'Lihat detail'}
                    </button>
                  )}
                </div>

                {isUploading && (
                  <p className="text-xs text-muted mt-2 italic">⏳ {LOADING_TIPS[tipIndex]}</p>
                )}
              </div>

              {isExpanded && check && (
                <div className="border-t border-hairline bg-off p-4">
                  <p className="text-sm text-ink mb-2">{check.komentar}</p>
                  {check.temuan.length > 0 && (
                    <ul className="space-y-1">
                      {check.temuan.map((t, i) => (
                        <li key={i} className="text-xs text-muted flex gap-1.5">
                          <span>•</span><span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
