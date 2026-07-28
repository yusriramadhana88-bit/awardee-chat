'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess, TIER_LABEL } from '@/lib/use-user'

type Lesson = { id: string; slug: string; title: string; order_index: number; duration_minutes: number; completed: boolean }
type Quiz = { id: string; title: string; passing_score: number; bestAttempt: { score: number; total: number; passed: boolean } | null }
type ModuleItem = {
  id: string
  slug: string
  title: string
  description: string | null
  icon: string
  tier: 'free' | 'starter' | 'vip' | 'vvip'
  lessons: Lesson[]
  lessonCount: number
  completedCount: number
  quiz: Quiz | null
}

export default function LearnPage() {
  const { user, loading } = useUser()
  const [modules, setModules] = useState<ModuleItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/learn/modules', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) {
        const data = await res.json()
        setModules(data.modules)
      }
      setPageLoading(false)
    }
    load()
  }, [])

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted text-sm">Memuat Learning Modules...</div>
      </div>
    )
  }

  const tier = user?.tier || 'free'
  const totalLessons = modules.reduce((s, m) => s + m.lessonCount, 0)
  const totalCompleted = modules.reduce((s, m) => s + m.completedCount, 0)

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-ink">Learning Modules</h1>
        <p className="text-sm text-muted mt-1">Materi terstruktur dari metode #GaliDiri, essay, sampai persiapan interview.</p>
      </div>

      <div className="bg-white rounded-xl border border-hairline p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-ink">Progres Belajar</div>
          <div className="text-xs text-muted mt-0.5">{totalCompleted} dari {totalLessons} lesson selesai</div>
        </div>
        <div className="w-32 h-2 bg-off rounded-full overflow-hidden">
          <div className="h-2 bg-gold rounded-full transition-all duration-700" style={{ width: `${totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {modules.map(m => {
          const locked = !canAccess(tier, m.tier === 'free' ? null : m.tier)
          const pct = m.lessonCount > 0 ? Math.round((m.completedCount / m.lessonCount) * 100) : 0
          return (
            <Link
              key={m.id}
              href={locked ? '/dashboard#upgrade' : `/dashboard/learn/${m.slug}`}
              className={`relative bg-white rounded-xl border p-5 transition-colors ${locked ? 'border-hairline opacity-70' : 'border-hairline hover:border-gold'}`}
            >
              {locked && (
                <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {TIER_LABEL[m.tier].toUpperCase()}
                </span>
              )}
              <div className="text-3xl mb-2">{m.icon}</div>
              <div className="font-semibold text-ink">{m.title}</div>
              <p className="text-xs text-muted mt-1 leading-relaxed">{m.description}</p>
              <div className="flex items-center justify-between mt-4 text-xs text-muted">
                <span>{m.lessonCount} lesson{m.quiz ? ' + 1 kuis' : ''}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-off rounded-full overflow-hidden mt-1.5">
                <div className="h-1.5 bg-gold rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
