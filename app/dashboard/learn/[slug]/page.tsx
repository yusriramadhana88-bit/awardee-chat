'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess, TIER_LABEL, Tier } from '@/lib/use-user'

type Lesson = { id: string; slug: string; title: string; order_index: number; duration_minutes: number; completed: boolean }
type Quiz = { id: string; title: string; passing_score: number; bestAttempt: { score: number; total: number; passed: boolean } | null }
type ModuleItem = {
  id: string
  slug: string
  title: string
  description: string | null
  icon: string
  tier: Tier
  lessons: Lesson[]
  lessonCount: number
  completedCount: number
  quiz: Quiz | null
}

export default function ModuleDetailPage() {
  const { user, loading } = useUser()
  const params = useParams()
  const slug = params.slug as string
  const [moduleData, setModuleData] = useState<ModuleItem | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/learn/modules', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) {
        const data = await res.json()
        setModuleData(data.modules.find((m: ModuleItem) => m.slug === slug) || null)
      }
      setPageLoading(false)
    }
    load()
  }, [slug])

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat modul...</div></div>
  }

  if (!moduleData) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Modul tidak ditemukan.</div></div>
  }

  const locked = moduleData.tier !== 'free' && !canAccess(user?.tier, moduleData.tier)
  const allLessonsDone = moduleData.completedCount === moduleData.lessonCount && moduleData.lessonCount > 0

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-3xl mx-auto">
      <Link href="/dashboard/learn" className="text-xs text-muted hover:text-ink">&larr; Semua Modul</Link>

      <div className="flex items-start gap-4 mt-3 mb-6">
        <div className="text-4xl">{moduleData.icon}</div>
        <div>
          <h1 className="text-xl font-bold text-ink">{moduleData.title}</h1>
          <p className="text-sm text-muted mt-1">{moduleData.description}</p>
        </div>
      </div>

      {locked && (
        <div className="bg-gradient-to-br from-navy to-navy-2 text-white rounded-xl p-5 mb-4">
          <h2 className="font-semibold mb-1">🔒 Modul {TIER_LABEL[moduleData.tier]}</h2>
          <p className="text-white/80 text-sm mb-4">
            Ini silabusnya — daftar lesson yang bakal kamu pelajari. Upgrade ke {TIER_LABEL[moduleData.tier]} untuk buka isi lengkap tiap lesson & kuisnya.
          </p>
          <Link href="/dashboard#upgrade" className="inline-block bg-gold text-navy text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gold-2 transition-colors">
            Lihat Paket Upgrade
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {moduleData.lessons.map((l, idx) => (
          <Link
            key={l.id}
            href={`/dashboard/learn/${slug}/${l.slug}`}
            className="flex items-center gap-3 bg-white rounded-xl border border-hairline p-4 hover:border-gold transition-colors"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${l.completed ? 'bg-gold text-navy' : 'bg-off text-muted'}`}>
              {locked ? '🔒' : l.completed ? '✓' : idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">{l.title}</div>
              <div className="text-xs text-muted mt-0.5">{l.duration_minutes} menit</div>
            </div>
          </Link>
        ))}

        {moduleData.quiz && (
          <Link
            href={`/dashboard/learn/${slug}/quiz`}
            className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
              allLessonsDone ? 'bg-white border-hairline hover:border-gold' : 'bg-off border-hairline opacity-60 pointer-events-none'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${moduleData.quiz.bestAttempt?.passed ? 'bg-gold text-navy' : 'bg-off text-muted'}`}>
              {moduleData.quiz.bestAttempt?.passed ? '✓' : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">{moduleData.quiz.title}</div>
              <div className="text-xs text-muted mt-0.5">
                {moduleData.quiz.bestAttempt
                  ? `Skor terbaik: ${moduleData.quiz.bestAttempt.score}/${moduleData.quiz.bestAttempt.total}`
                  : allLessonsDone ? 'Siap dikerjakan' : 'Selesaikan semua lesson dulu'}
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
