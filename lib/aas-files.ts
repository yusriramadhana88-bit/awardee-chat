// Server-only: deteksi tipe file & upload/download terenkripsi ke Supabase Storage bucket
// "aas-docs". Dokumen resmi AAS hanya PDF/Image — docx HANYA didukung untuk slot CV (kemudahan
// review, bukan format resmi OASIS, lihat catatan di lib/aas-requirements.ts) — reuse enkripsi
// AES-256-GCM dari lib/lpdp-crypto.ts dan ekstraksi docx dari mammoth (sama seperti LPDP).
import type { SupabaseClient } from '@supabase/supabase-js'
import mammoth from 'mammoth'
import { encryptBuffer, decryptBuffer } from './lpdp-crypto'

export { MAX_FILE_BYTES } from './aas-requirements'

const MIME_TO_TYPE: Record<string, 'pdf' | 'jpg' | 'png' | 'docx'> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export function detectFileType(mimeType: string): 'pdf' | 'jpg' | 'png' | 'docx' | null {
  return MIME_TO_TYPE[mimeType] ?? null
}

export async function extractDocxText(buf: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: buf })
  return result.value.trim()
}

export async function uploadEncrypted(admin: SupabaseClient, path: string, buf: Buffer): Promise<void> {
  const encrypted = encryptBuffer(buf)
  const { error } = await admin.storage.from('aas-docs').upload(path, encrypted, {
    contentType: 'application/octet-stream',
    upsert: true,
  })
  if (error) throw new Error(`Gagal upload file terenkripsi: ${error.message}`)
}

export async function downloadDecrypted(admin: SupabaseClient, path: string): Promise<Buffer> {
  const { data, error } = await admin.storage.from('aas-docs').download(path)
  if (error || !data) throw new Error(`Gagal download file: ${error?.message ?? 'not found'}`)
  const arrayBuffer = await data.arrayBuffer()
  return decryptBuffer(Buffer.from(arrayBuffer))
}
