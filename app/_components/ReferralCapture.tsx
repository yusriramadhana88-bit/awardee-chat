'use client'

import { useEffect } from 'react'
import { getStoredReferral, setStoredReferral } from '@/lib/referral-client'

// Dipasang di root layout — mendeteksi ?ref=CODE di URL manapun dan mencatat 1 klik
// referral ke server. Tidak render apapun.
export default function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('ref')
    if (!code) return

    const existing = getStoredReferral()
    if (existing && existing.code.toUpperCase() === code.toUpperCase()) return

    fetch('/api/affiliate/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.referralId) setStoredReferral(data.referralId, code)
      })
      .catch(() => {})
  }, [])

  return null
}
