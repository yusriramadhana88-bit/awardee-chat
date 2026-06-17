'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Memuat tracker...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-gray-900 text-sm">Awardee.id</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Dashboard</Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Keluar</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Scholarship Tracker</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {applications.length}/{limit === 999 ? '∞' : limit} aplikasi aktif
              {tier !== 'pro' && (
                <Link href="/dashboard" className="ml-2 text-sky-600 hover:underline text-xs">
                  Upgrade untuk lebih
                </Link>
              )}
            </p>
          </div>
          {atLimit && tier !== 'pro' ? (
            <Link
              href="/dashboard"
              className="bg-amber-500 text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-amber-600 transition-colors"
            >
              Upgrade
            </Link>
          ) : (
            <Link
              href="/tracker/new"
              className="bg-sky-600 text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-sky-700 transition-colors"
            >
              + Buat Baru
            </Link>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-4xl mb-3">🎓</div>
            <h2 className="font-semibold text-gray-800 mb-1">Belum ada aplikasi</h2>
            <p className="text-sm text-gray-500 mb-5">
              Mulai tracking perjalanan beasiswamu sekarang.
            </p>
            <Link
              href="/tracker/new"
              className="inline-block bg-sky-600 text-white text-sm px-6 py-2.5 rounded-xl font-medium hover:bg-sky-700 transition-colors"
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

        {atLimit && tier !== 'pro' && applications.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-center justify-between">
            <span>Batas {limit} aplikasi untuk paket {tier === 'free' ? 'Gratis' : 'Starter'}.</span>
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
      className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-sky-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
          {app.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{app.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-sky-600">{app.overall_progress}%</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-sky-500 h-2 rounded-full transition-all"
            style={{ width: `${app.overall_progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
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
