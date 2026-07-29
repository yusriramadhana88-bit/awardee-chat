import { readFileSync } from 'fs'
import { resolve } from 'path'

// Lead magnet dikirim otomatis ke email user begitu daftar (semua signup baru = tier free,
// upgrade ke tier berbayar terjadi manual belakangan, jadi tidak perlu cek tier di sini).
// Satu dipilih acak dari pool ini per pendaftar baru — lihat pickRandomLeadMagnet().
export type LeadMagnet = {
  id: string
  title: string
  description: string
  fileUrl?: string // aset sudah dihosting eksternal (mis. awardee.id/downloads/...)
  attachmentPath?: string // path relatif ke repo — dilampirkan langsung sebagai attachment email
  attachmentFilename?: string
}

export const LEAD_MAGNETS: LeadMagnet[] = [
  {
    id: 'lpdp_admin_paket',
    title: 'Paket Persiapan Administrasi LPDP Batch 2 2026',
    description: 'Checklist 15 dokumen wajib + template Esai Komitmen & Profil Diri + timeline pendaftaran.',
    fileUrl: 'https://awardee.id/downloads/Paket-Persiapan-Admin-LPDP-Batch2-2026.pdf',
  },
  {
    id: 'aas_interview_guide',
    title: 'Panduan Lolos Interview AAS',
    description: 'Strategi persiapan & contoh jawaban untuk interview Australia Awards Scholarship.',
    attachmentPath: 'telegram-bot/assets/Panduan-Lolos-Interview-AAS.pdf',
    attachmentFilename: 'Panduan-Lolos-Interview-AAS.pdf',
  },
]

export function pickRandomLeadMagnet(): LeadMagnet {
  return LEAD_MAGNETS[Math.floor(Math.random() * LEAD_MAGNETS.length)]
}

export function readLeadMagnetAttachment(leadMagnet: LeadMagnet): Buffer | null {
  if (!leadMagnet.attachmentPath) return null
  try {
    return readFileSync(resolve(process.cwd(), leadMagnet.attachmentPath))
  } catch {
    return null
  }
}
