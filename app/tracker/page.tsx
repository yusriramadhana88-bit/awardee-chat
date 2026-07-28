'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { canAccess, TIER_LABEL } from '@/lib/use-user'
import FeatureLock from '../dashboard/_components/FeatureLock'
import {
  ScholarshipApplication,
  getDeadlineInfo,
  formatDeadline,
  APP_LIMITS,
} from '@/lib/tracker'

export default function TrackerPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([])
  const [tier, setTier] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const [appsRes, userRes] = await Promise.all([
        supabase
          .from('scholarship_applications')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        fetch('/api/user', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).then(r => r.json()),
      ])

      setApplications(appsRes.data || [])
      setTier(userRes.tier || 'free')
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const limit = APP_LIMITS[tier] ?? 1
  const atLimit = applications.length >= limit

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off">
        <div className="text-muted text-sm">Memuat tracker...</div>
      </div>
    )
  }

  if (!canAccess(tier, 'starter')) {
    return <FeatureLock requiredTier="starter" featureName="Scholarship Tracker" />
  }

  return (
    <div className="min-h-screen bg-off">
      <header className="bg-white border-b border-hairline px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-ink text-sm">Awardee.id</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-muted hover:text-ink transition-colors">Dashboard</Link>
            <button onClick={handleLogout} className="text-sm text-muted hover:text-ink transition-colors">Keluar</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink">Scholarship Tracker</h1>
            <p className="text-sm text-muted mt-0.5">
              {applications.length}/{limit === 999 ? '∞' : limit} aplikasi aktif
              {tier !== 'vvip' && (
                <Link href="/dashboard" className="ml-2 text-gold-2 hover:underline text-xs">
                  Upgrade untuk lebih
                </Link>
              )}
            </p>
          </div>
          {atLimit && tier !== 'vvip' ? (
            <Link
              href="/dashboard"
              className="bg-amber-500 text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-amber-600 transition-colors"
            >
              Upgrade
            </Link>
          ) : (
            <Link
              href="/tracker/new"
              className="bg-navy text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-navy-2 transition-colors"
            >
              + Buat Baru
            </Link>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-hairline p-10 text-center">
            <div className="text-4xl mb-3">🎓</div>
            <h2 className="font-semibold text-ink mb-1">Belum ada aplikasi</h2>
            <p className="text-sm text-muted mb-5">
              Mulai tracking perjalanan beasiswamu sekarang.
            </p>
            <Link
              href="/tracker/new"
              className="inline-block bg-navy text-white text-sm px-6 py-2.5 rounded-xl font-medium hover:bg-navy-2 transition-colors"
            >
              Buat Aplikasi Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}

        {atLimit && tier !== 'vvip' && applications.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center justify-between">
            <span>Batas {limit} aplikasi untuk paket {TIER_LABEL[tier] ?? tier}.</span>
            <Link href="/dashboard" className="font-semibold underline ml-2">Upgrade</Link>
          </div>
        )}
      </main>
    </div>
  )
}

function ApplicationCard({ app }: { app: ScholarshipApplication }) {
  const deadline = getDeadlineInfo(app.deadline)

  return (
    <Link
      href={`/tracker/${app.id}`}
      className="block bg-white rounded-2xl border border-hairline p-5 hover:border-gold hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink truncate">{app.name}</h3>
          {app.description && (
            <p className="text-xs text-muted mt-0.5 truncate">{app.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-gold-2">{app.overall_progress}%</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-off rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${app.overall_progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted">
          Deadline: {formatDeadline(app.deadline)}
        </span>
        {deadline && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${deadline.bgColor} ${deadline.color}`}>
            {deadline.label}
          </span>
        )}
      </div>
    </Link>
  )
}
