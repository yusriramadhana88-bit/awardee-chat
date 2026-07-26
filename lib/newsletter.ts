// Server-only: token unsubscribe newsletter — HMAC ringan pakai SUPABASE_SERVICE_ROLE_KEY sebagai
// secret (tidak perlu env var baru). Dipakai oleh app/api/newsletter/unsubscribe/route.ts (verifikasi)
// dan scripts/newsletter-subscribers.mjs (generate link per subscriber, logic HMAC di-duplikasi di
// sana karena itu skrip Node terpisah — kalau logic ini berubah, update juga di sana).
import { createHmac } from 'crypto'
import { loadEnvKey } from './env'

export function computeUnsubscribeToken(profileId: string): string {
  const secret = loadEnvKey('SUPABASE_SERVICE_ROLE_KEY')
  return createHmac('sha256', secret).update(profileId).digest('hex').slice(0, 16)
}

export function unsubscribeUrl(profileId: string, baseUrl = 'https://member.awardee.id'): string {
  const token = computeUnsubscribeToken(profileId)
  return `${baseUrl}/api/newsletter/unsubscribe?uid=${encodeURIComponent(profileId)}&token=${token}`
}
