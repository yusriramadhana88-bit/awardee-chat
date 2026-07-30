'use client'

import Link from 'next/link'
import { TIER_LABEL } from '@/lib/use-user'

// Bungkus fitur berbayar: kalau `locked`, konten asli tetap dirender (blur + non-interaktif)
// di belakang overlay upgrade — supaya free tier lihat gambaran fiturnya, bukan layar kosong.
export default function FeatureLock({
  requiredTier, featureName, locked, children,
}: {
  requiredTier: 'starter' | 'vip' | 'vvip'
  featureName: string
  locked: boolean
  children: React.ReactNode
}) {
  if (!locked) return <>{children}</>

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-60 max-h-[80vh] overflow-hidden">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center px-4 bg-gradient-to-b from-white/10 to-white/70">
        <div className="bg-white rounded-2xl border border-hairline p-6 max-w-sm w-full text-center shadow-xl">
          <div className="text-3xl mb-3">🔒</div>
          <h2 className="font-bold text-ink mb-2">
            {featureName} — Fitur {TIER_LABEL[requiredTier]}
          </h2>
          <p className="text-sm text-muted mb-5">
            Upgrade paket kamu untuk membuka {featureName.toLowerCase()} dan fitur lainnya di AwardeeOS.
          </p>
          <Link href="/dashboard#upgrade" className="block bg-navy text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-2 transition-colors">
            Lihat Paket Upgrade
          </Link>
        </div>
      </div>
    </div>
  )
}
