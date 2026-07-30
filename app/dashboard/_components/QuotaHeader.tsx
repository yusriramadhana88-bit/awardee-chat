'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { TIER_LABEL, TIER_COLOR, type Tier } from '@/lib/use-user'
import { quotaRemainingPercent } from '@/lib/quota-format'

export default function QuotaHeader({ userName }: { userName?: string }) {
  const [quota, setQuota] = useState<{ tier: Tier; usedIdr: number; budgetIdr: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/quota', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setQuota(await res.json())
    }
    load()
  }, [])

  if (!quota) return null

  const remainingPct = quotaRemainingPercent(quota.usedIdr, quota.budgetIdr)
  const isVvip = quota.tier === 'vvip'

  return (
    <div className="hidden lg:flex items-center gap-3 px-4 py-2 border-b border-hairline bg-white justify-end sticky top-0 z-30">
      {userName && (
        <span className="text-xs font-medium text-ink truncate max-w-[160px]">{userName}</span>
      )}
      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${TIER_COLOR[quota.tier]}`}>
        {TIER_LABEL[quota.tier]}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted">
        Sisa kuota AI:
        <span className="w-16 h-1.5 bg-off rounded-full overflow-hidden">
          <span
            className={`block h-full rounded-full ${remainingPct > 30 ? 'bg-green-500' : remainingPct > 10 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${remainingPct}%` }}
          />
        </span>
        <span className="font-semibold text-ink">{remainingPct}%</span>
      </span>
      {!isVvip && (
        <Link
          href="/dashboard#upgrade"
          className="text-xs bg-navy text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-navy-2 transition-colors whitespace-nowrap"
        >
          Upgrade
        </Link>
      )}
    </div>
  )
}
