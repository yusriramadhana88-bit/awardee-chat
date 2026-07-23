'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import FeatureLock from '../_components/FeatureLock'

const CHECKLISTS: Record<string, { label: string; items: { key: string; label: string }[] }> = {
  aas: {
    label: 'Australia Awards Scholarship (AAS)',
    items: [
      { key: 'cv', label: 'Curriculum Vitae (CV) terbaru' },
      { key: 'ijazah_transkrip', label: 'Ijazah & transkrip nilai (dilegalisir + terjemahan resmi)' },
      { key: 'sertifikat_bahasa', label: 'Sertifikat IELTS/TOEFL yang masih berlaku' },
      { key: 'personal_statement', label: 'Personal Statement / Essay' },
      { key: 'leadership_statement', label: 'Leadership & Community Impact Statement' },
      { key: 'referee', label: 'Surat rekomendasi dari 2 referee' },
      { key: 'ktp_paspor', label: 'KTP & Paspor yang masih berlaku' },
      { key: 'surat_kerja', label: 'Surat keterangan kerja / pengalaman profesional' },
      { key: 'akun_oasis', label: 'Akun OASIS terdaftar & terisi lengkap' },
      { key: 'pas_foto', label: 'Pas foto sesuai ketentuan' },
    ],
  },
  lpdp: {
    label: 'LPDP',
    items: [
      { key: 'ktp', label: 'KTP yang masih berlaku' },
      { key: 'ijazah_transkrip', label: 'Ijazah & transkrip nilai (dilegalisir)' },
      { key: 'sertifikat_bahasa', label: 'Sertifikat TOEFL/IELTS sesuai syarat' },
      { key: 'referee', label: 'Surat rekomendasi' },
      { key: 'essay_kontribusi', label: 'Essay Kontribusi untuk Indonesia' },
      { key: 'essay_komitmen', label: 'Essay Komitmen Kembali ke Indonesia & rencana studi' },
      { key: 'surat_sehat', label: 'Surat keterangan sehat & bebas TBC/Napza' },
      { key: 'loa', label: 'LoA Unconditional (jika sudah ada / untuk jalur tertentu)' },
      { key: 'profil_lpdp', label: 'Profil diri lengkap di sistem pendaftaran LPDP' },
      { key: 'surat_pernyataan', label: 'Surat pernyataan sesuai format LPDP' },
    ],
  },
  chevening: {
    label: 'Chevening',
    items: [
      { key: 'cv_1page', label: 'CV maksimal 1 halaman' },
      { key: 'essay_leadership', label: 'Essay Leadership & Influence' },
      { key: 'essay_networking', label: 'Essay Networking' },
      { key: 'essay_career', label: 'Essay Career Plan' },
      { key: 'essay_why_chevening', label: 'Essay Why Chevening' },
      { key: 'ijazah_transkrip', label: 'Ijazah & transkrip nilai' },
      { key: 'paspor', label: 'Paspor yang masih berlaku' },
      { key: 'referee', label: '2 referee yang sudah dikonfirmasi' },
      { key: 'pengalaman_kerja', label: 'Bukti pengalaman kerja minimal 2 tahun' },
    ],
  },
  gks: {
    label: 'Global Korea Scholarship (GKS)',
    items: [
      { key: 'application_form', label: 'Application form GKS terisi lengkap' },
      { key: 'personal_statement', label: 'Personal Statement & Study Plan' },
      { key: 'referee', label: '2 Letter of Recommendation' },
      { key: 'ijazah_transkrip', label: 'Ijazah & transkrip (apostille/notarisasi)' },
      { key: 'sertifikat_bahasa', label: 'Sertifikat TOPIK / sertifikat bahasa Inggris' },
      { key: 'health_form', label: 'Personal Medical Assessment form' },
      { key: 'paspor', label: 'Paspor yang masih berlaku' },
    ],
  },
}

export default function DocumentsPage() {
  const { user, loading } = useUser()
  const [scholarship, setScholarship] = useState('aas')
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [loadingItems, setLoadingItems] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProgress(scholarship)
  }, [scholarship])

  async function loadProgress(key: string) {
    setLoadingItems(true)
    const { data } = await supabase
      .from('document_checklist_items')
      .select('item_key, is_completed')
      .eq('scholarship_key', key)

    const map: Record<string, boolean> = {}
    for (const row of data || []) {
      map[row.item_key] = row.is_completed
    }
    setCompleted(map)
    setLoadingItems(false)
  }

  async function toggleItem(itemKey: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const next = !completed[itemKey]
    setCompleted(prev => ({ ...prev, [itemKey]: next }))

    await supabase.from('document_checklist_items').upsert({
      user_id: session.user.id,
      scholarship_key: scholarship,
      item_key: itemKey,
      is_completed: next,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,scholarship_key,item_key' })
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  if (!canAccess(user?.tier, 'kopi')) {
    return <FeatureLock requiredTier="kopi" featureName="Checklist Dokumen" />
  }

  const list = CHECKLISTS[scholarship]
  const doneCount = list.items.filter(i => completed[i.key]).length
  const pct = Math.round((doneCount / list.items.length) * 100)

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Checklist Dokumen</h1>
        <p className="text-sm text-muted mt-0.5">Pastikan semua dokumen wajib siap sebelum mengajukan aplikasi.</p>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {Object.entries(CHECKLISTS).map(([key, c]) => (
          <button
            key={key}
            onClick={() => setScholarship(key)}
            className={`shrink-0 text-sm px-4 py-2 rounded-xl font-medium transition-colors ${
              scholarship === key ? 'bg-navy text-white' : 'bg-white border border-hairline text-muted hover:border-gold'
            }`}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-hairline p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink text-sm">{list.label}</h2>
          <span className="text-sm font-bold text-gold-2">{doneCount}/{list.items.length}</span>
        </div>
        <div className="w-full bg-off rounded-full h-2 mb-5">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>

        {loadingItems ? (
          <p className="text-sm text-muted">Memuat checklist...</p>
        ) : (
          <div className="space-y-2">
            {list.items.map(item => (
              <label key={item.key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-off cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={!!completed[item.key]}
                  onChange={() => toggleItem(item.key)}
                  className="w-4 h-4 rounded border-hairline text-gold-2 focus:ring-gold"
                />
                <span className={`text-sm ${completed[item.key] ? 'text-muted line-through' : 'text-ink'}`}>{item.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted mt-4 text-center">
        Daftar ini adalah panduan umum. Selalu cek persyaratan resmi terbaru di website masing-masing beasiswa.
      </p>
    </div>
  )
}
