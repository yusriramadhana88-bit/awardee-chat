'use client'

import { useEffect, useState } from 'react'
import { BATCH2_DEADLINE } from '@/lib/lpdp-requirements'

export default function Countdown() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (!now) return null

  const diffMs = BATCH2_DEADLINE.getTime() - now.getTime()

  if (diffMs <= 0) {
    return (
      <div className="bg-gray-700 text-white text-center text-sm font-semibold py-2.5 px-4 rounded-xl mb-4">
        Pendaftaran LPDP Batch 2 2026 sudah ditutup (31 Juli 2026, 23:59 WIB).
      </div>
    )
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24)

  return (
    <div className="bg-red-600 text-white text-center text-sm font-semibold py-2.5 px-4 rounded-xl mb-4 sticky top-0 z-10">
      ⏰ Deadline Pendaftaran LPDP Batch 2 2026: <strong>{days} hari {hours} jam lagi</strong> · 31 Juli 2026, 23:59 WIB
    </div>
  )
}
