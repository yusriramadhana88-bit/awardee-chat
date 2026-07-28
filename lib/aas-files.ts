// Server-only: deteksi tipe file & upload/download terenkripsi ke Supabase Storage bucket
// "aas-docs". Beda dari lib/lpdp-files.ts: dokumen resmi AAS hanya PDF/Image (tidak ada docx/
// mammoth), jadi modul ini lebih sederhana — reuse enkripsi AES-256-GCM dari lib/lpdp-crypto.ts.
import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptBuffer, decryptBuffer } from './lpdp-crypto'

export { MAX_FILE_BYTES } from './aas-requirements'

const MIME_TO_TYPE: Record<string, 'pdf' | 'jpg' | 'png'> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
}

export function detectFileType(mimeType: string): 'pdf' | 'jpg' | 'png' | null {
  return MIME_TO_TYPE[mimeType] ?? null
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
