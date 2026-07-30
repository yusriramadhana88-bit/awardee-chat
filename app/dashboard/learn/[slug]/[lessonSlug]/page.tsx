'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess, Tier } from '@/lib/use-user'
import FeatureLock from '../../../_components/FeatureLock'
import { renderMarkdown } from '@/lib/markdown'

type ModuleItem = { id: string; slug: string; title: string; icon: string; tier: Tier; lessons: { id: string; slug: string }[]; quiz: { id: string } | null }
type LessonDetail = {
  lesson: { id: string; slug: string; title: string; content: string; duration_minutes: number }
  module: { slug: string; title: string; icon: string }
  completed: boolean
  prev: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
  isLastLesson: boolean
}

export default function LessonPage() {
  const { loading } = useUser()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const lessonSlug = params.lessonSlug as string
  const [detail, setDetail] = useState<LessonDetail | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [hasQuiz, setHasQuiz] = useState(false)
  const [lockedTier, setLockedTier] = useState<ModuleItem['tier'] | null>(null)
  const supabase = createClient()

  async function loadLesson() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const modulesRes = await fetch('/api/learn/modules', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (!modulesRes.ok) return null
    const modulesData = await modulesRes.json()
    const moduleItem: ModuleItem | undefined = modulesData.modules.find((m: ModuleItem) => m.slug === slug)
    if (!moduleItem) return null
    setHasQuiz(!!moduleItem.quiz)

    const userRes = await fetch('/api/user', { headers: { Authorization: `Bearer ${session.access_token}` } })
    const userData = userRes.ok ? await userRes.json() : null
    if (moduleItem.tier !== 'free' && !canAccess(userData?.tier, moduleItem.tier)) {
      setLockedTier(moduleItem.tier)
      return session
    }

    const lessonRef = moduleItem.lessons.find(l => l.slug === lessonSlug)
    if (!lessonRef) return null

    const res = await fetch(`/api/learn/lessons/${lessonRef.id}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) {
      const data = await res.json()
      setDetail(data)
    }
    return session
  }

  useEffect(() => {
    loadLesson().finally(() => setPageLoading(false))
  }, [slug, lessonSlug])

  async function markComplete() {
    if (!detail) return
    setMarking(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/learn/progress', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: detail.lesson.id }),
    })
    if (detail.next) {
      router.push(`/dashboard/learn/${slug}/${detail.next.slug}`)
    } else if (hasQuiz) {
      router.push(`/dashboard/learn/${slug}/quiz`)
    } else {
      router.push(`/dashboard/learn/${slug}`)
    }
    setMarking(false)
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat lesson...</div></div>
  }

  if (lockedTier) {
    return (
      <FeatureLock locked requiredTier={lockedTier as 'starter' | 'vip' | 'vvip'} featureName="Lesson ini">
        <div className="min-h-[60vh]" />
      </FeatureLock>
    )
  }

  if (!detail) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Lesson tidak ditemukan.</div></div>
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-2xl mx-auto">
      <Link href={`/dashboard/learn/${slug}`} className="text-xs text-muted hover:text-ink">&larr; {detail.module.title}</Link>

      <h1 className="text-xl font-bold text-ink mt-3 mb-1">{detail.lesson.title}</h1>
      <p className="text-xs text-muted mb-6">{detail.lesson.duration_minutes} menit baca</p>

      <div className="bg-white rounded-xl border border-hairline p-6">
        {renderMarkdown(detail.lesson.content)}
      </div>

      <div className="flex items-center justify-between mt-6">
        {detail.prev ? (
          <Link href={`/dashboard/learn/${slug}/${detail.prev.slug}`} className="text-sm text-muted hover:text-ink">&larr; {detail.prev.title}</Link>
        ) : <span />}

        <button
          onClick={markComplete}
          disabled={marking}
          className="bg-navy hover:bg-navy-2 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {marking ? 'Menyimpan...' : detail.completed ? (detail.next ? 'Lanjut →' : 'Selesai →') : 'Tandai Selesai & Lanjut →'}
        </button>
      </div>
    </div>
  )
}
