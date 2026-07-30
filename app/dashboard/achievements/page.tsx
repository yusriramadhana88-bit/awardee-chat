'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import FeatureLock from '../_components/FeatureLock'

type Achievement = {
  id: string
  code: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedAt: string | null
}

export default function AchievementsPage() {
  const { user, loading } = useUser()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [earnedCount, setEarnedCount] = useState(0)
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/achievements', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) {
        const data = await res.json()
        setAchievements(data.achievements)
        setEarnedCount(data.earnedCount)
      }
      setPageLoading(false)
    }
    load()
  }, [])

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat achievement...</div></div>
  }

  const pct = achievements.length > 0 ? Math.round((earnedCount / achievements.length) * 100) : 0

  return (
    <FeatureLock locked={!canAccess(user?.tier, 'starter')} requiredTier="starter" featureName="Achievements">
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-xl lg:text-2xl font-bold text-ink mb-1">Achievements</h1>
      <p className="text-sm text-muted mb-6">Badge yang kamu kumpulkan sepanjang perjalanan beasiswamu.</p>

      <div className="bg-white rounded-xl border border-hairline p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">{earnedCount} dari {achievements.length} terbuka</div>
          <div className="text-xs text-muted mt-0.5">Terus aktif belajar dan tracking untuk membuka semuanya</div>
        </div>
        <div className="w-24 h-24 relative shrink-0">
          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
            <path className="text-off" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="text-gold" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={`${pct}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink">{pct}%</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {achievements.map(a => (
          <div
            key={a.id}
            className={`rounded-xl border p-4 flex items-start gap-3 ${a.earned ? 'bg-white border-gold' : 'bg-off border-hairline opacity-60'}`}
          >
            <div className={`text-2xl shrink-0 ${a.earned ? '' : 'grayscale'}`}>{a.icon}</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink">{a.title}</div>
              <div className="text-xs text-muted mt-0.5">{a.description}</div>
              {a.earned && a.earnedAt && (
                <div className="text-[11px] text-gold-2 mt-1.5 font-medium">
                  Didapat {new Date(a.earnedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    </FeatureLock>
  )
}
