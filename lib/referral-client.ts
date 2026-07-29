// Client-only helper untuk simpan/baca atribusi referral di localStorage.
// Dipakai oleh ReferralCapture.tsx (nulis) dan app/register/page.tsx (baca saat daftar).

const STORAGE_KEY = 'awardee_referral'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 hari

type StoredReferral = { referralId: string; code: string; savedAt: number }

export function getStoredReferral(): { referralId: string; code: string } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as StoredReferral
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { referralId: data.referralId, code: data.code }
  } catch {
    return null
  }
}

export function setStoredReferral(referralId: string, code: string) {
  if (typeof window === 'undefined') return
  const data: StoredReferral = { referralId, code, savedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearStoredReferral() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
