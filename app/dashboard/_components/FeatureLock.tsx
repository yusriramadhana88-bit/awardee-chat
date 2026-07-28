'use client'

import Link from 'next/link'
import { TIER_LABEL } from '@/lib/use-user'

export default function FeatureLock({ requiredTier, featureName }: { requiredTier: 'starter' | 'vip' | 'vvip'; featureName: string }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-hairline p-8 max-w-sm w-full text-center">
        <div className="text-3xl mb-3">🔒</div>
        <h2 className="font-bold text-ink mb-2">
          {featureName} — Fitur {TIER_LABEL[requiredTier]}
        </h2>
        <p className="text-sm text-muted mb-5">
          Upgrade paket kamu untuk membuka {featureName.toLowerCase()} dan fitur lainnya di AwardeeOS.
        </p>
        <Link href="/dashboard#upgrade" className="block bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-2 transition-colors mb-3">
          Lihat Paket Upgrade
        </Link>
        <Link href="/dashboard" className="text-sm text-muted hover:text-ink">Kembali ke Dashboard</Link>
      </div>
    </div>
  )
}
