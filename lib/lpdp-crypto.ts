// Server-only: enkripsi/dekripsi file dokumen & esai LPDP sebelum disimpan ke Supabase Storage.
// AES-256-GCM, key dari env LPDP_FILE_KEY (hex 32-byte). Format simpan: iv(12) | tag(16) | ciphertext.
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { loadEnvKey } from './env'

function getKey(): Buffer {
  const hex = loadEnvKey('LPDP_FILE_KEY')
  if (!hex || hex.length !== 64) {
    throw new Error('LPDP_FILE_KEY tidak valid — harus 32-byte hex (64 karakter) di .env.local')
  }
  return Buffer.from(hex, 'hex')
}

export function encryptBuffer(buf: Buffer): Buffer {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(buf), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext])
}

export function decryptBuffer(blob: Buffer): Buffer {
  const iv = blob.subarray(0, 12)
  const tag = blob.subarray(12, 28)
  const ciphertext = blob.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}
