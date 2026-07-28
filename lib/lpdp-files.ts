// Server-only: ekstraksi teks docx, upload/download terenkripsi ke Supabase Storage bucket "lpdp-docs".
import type { SupabaseClient } from '@supabase/supabase-js'
import mammoth from 'mammoth'
import { encryptBuffer, decryptBuffer } from './lpdp-crypto'

export { MAX_FILE_BYTES, WARN_FILE_BYTES } from './lpdp-requirements'

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
  const { error } = await admin.storage.from('lpdp-docs').upload(path, encrypted, {
    contentType: 'application/octet-stream',
    upsert: true,
  })
  if (error) throw new Error(`Gagal upload file terenkripsi: ${error.message}`)
}

export async function downloadDecrypted(admin: SupabaseClient, path: string): Promise<Buffer> {
  const { data, error } = await admin.storage.from('lpdp-docs').download(path)
  if (error || !data) throw new Error(`Gagal download file: ${error?.message ?? 'not found'}`)
  const arrayBuffer = await data.arrayBuffer()
  return decryptBuffer(Buffer.from(arrayBuffer))
}
