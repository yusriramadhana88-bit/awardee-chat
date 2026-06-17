'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess, TIER_LABEL } from '@/lib/use-user'
import { ScholarshipApplication, getDeadlineInfo, formatDeadline } from '@/lib/tracker'
import { calculateXp, getPejuangLevel } from '@/lib/gamification'

const XENDIT_LINKS: Record<string, string> = {
  starter: 'https://checkout.xendit.co/od/GANTI_DENGAN_LINK_XENDIT_STARTER',
  pro: 'https://checkout.xendit.co/od/GANTI_DENGAN_LINK_XENDIT_PRO',
}

const FEATURES: { href: string; icon: string; title: string; desc: string; tier: 'starter' | 'pro' | null }[] = [
  { href: '/chat', icon: '💬', title: 'Chat AI Den Dhana', desc: 'Konsultasi strategi & pertanyaan seputar AAS', tier: null },
  { href: '/tracker', icon: '📋', title: 'Scholarship Tracker', desc: 'Pantau progres tahapan aplikasi beasiswamu', tier: null },
  { href: '/dashboard/calendar', icon: '📅', title: 'Kalender Beasiswa', desc: 'Semua deadline penting dalam satu tampilan', tier: 'starter' },
  { href: '/dashboard/documents', icon: '✅', title: 'Checklist Dokumen', desc: 'Daftar dokumen wajib per jenis beasiswa', tier: null },
  { href: '/dashboard/ielts', icon: '🎯', title: 'IELTS Tracker', desc: 'Catat skor & pantau progres menuju target', tier: 'starter' },
  { href: '/dashboard/cv', icon: '📄', title: 'CV Analyzer', desc: 'Analisis kekuatan CV untuk aplikasi beasiswa', tier: 'starter' },
  { href: '/dashboard/essay', icon: '✏️', title: 'Essay Workshop', desc: 'Kelola draft essay & dapatkan kritik AI mendalam', tier: 'pro' },
]

export default function DashboardPage() {
  const { user, loading } = useUser()
  const [applications, setApplications] = useState<ScholarshipApplication[]>([])
  const [pejuangXp, setPejuangXp] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('scholarship_applications')
        .select('*')
        .eq('status', 'active')
        .order('deadline', { ascending: true, nullsFirst: false })
      setApplications(data || [])
    }
    async function loadXp() {
      const [{ count: cvCount }, { count: essayCount }, { count: testCount }, { count: appCount }] = await Promise.all([
        supabase.from('cv_analyses').select('id', { count: 'exact', head: true }),
        supabase.from('essay_drafts').select('id', { count: 'exact', head: true }).not('ai_feedback', 'is', null),
        supabase.from('test_scores').select('id', { count: 'exact', head: true }),
        supabase.from('scholarship_applications').select('id', { count: 'exact', head: true }),
      ])
      const xp = calculateXp({
        cvAnalysesCount: cvCount ?? 0,
        essayReviewsCount: essayCount ?? 0,
        testScoresCount: testCount ?? 0,
        applicationsCount: appCount ?? 0,
      })
      setPejuangXp(xp)
    }
    load()
    loadXp()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Memuat dashboard...</div>
      </div>
    )
  }

  const tier = user?.tier || 'free'
  const upcoming = applications
    .filter(a => a.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Hei, {user?.name || 'Sobat AAS'} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Selamat datang di AWARDEE APP — pusat kendali perjalanan beasiswamu.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-sky-600">{user?.used ?? 0}/{user?.limit ?? 10}</div>
          <div className="text-xs text-gray-400 mt-1">Pertanyaan AI hari ini</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-700">{applications.length}</div>
          <div className="text-xs text-gray-400 mt-1">Aplikasi beasiswa aktif</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 lg:col-span-1">
          <div className="text-2xl font-bold text-gray-700">
            {upcoming ? formatDeadline(upcoming.deadline) : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">Deadline terdekat{upcoming ? ` · ${upcoming.name}` : ''}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{TIER_LABEL[tier]}</div>
          <div className="text-xs text-gray-400 mt-1">Paket aktif</div>
        </div>
      </div>

      {/* Level Pejuang Beasiswa */}
      {(() => {
        const lvl = getPejuangLevel(pejuangXp)
        const pct = lvl.nextLevelXp > lvl.xp
          ? Math.round((lvl.xp / lvl.nextLevelXp) * 100)
          : 100
        return (
          <div className={`rounded-xl border p-4 mb-6 ${lvl.bgColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-medium text-gray-500 block">Level Pejuang Beasiswa</span>
                <span className={`text-lg font-bold ${lvl.color}`}>{lvl.emoji} {lvl.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">XP</span>
                <div className={`text-xl font-bold ${lvl.color}`}>{lvl.xp}</div>
              </div>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-700 ${lvl.level >= 5 ? 'bg-purple-500' : lvl.level >= 3 ? 'bg-sky-500' : 'bg-yellow-400'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              {lvl.level < 5 ? `${lvl.nextLevelXp - lvl.xp} XP lagi ke level berikutnya · ` : ''}
              XP didapat dari analisis CV, review essay, input skor tes, dan tracking beasiswa.
            </p>
          </div>
        )
      })()}

      {/* Upcoming deadline alert */}
      {upcoming && (() => {
        const info = getDeadlineInfo(upcoming.deadline)
        if (!info || info.days > 14) return null
        return (
          <div className={`rounded-xl border p-4 mb-6 flex items-center justify-between gap-3 ${info.bgColor}`}>
            <div>
              <p className={`text-sm font-semibold ${info.color}`}>{info.label} — {upcoming.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Deadline: {formatDeadline(upcoming.deadline)}</p>
            </div>
            <Link href={`/tracker/${upcoming.id}`} className="text-xs font-semibold bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-sky-300 transition-colors whitespace-nowrap">
              Lihat Detail
            </Link>
          </div>
        )
      })()}

      {/* Feature grid */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Fitur AwardeeOS</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {FEATURES.map((f) => {
          const locked = !canAccess(tier, f.tier)
          return (
            <Link
              key={f.href}
              href={locked ? '#upgrade' : f.href}
              className={`relative bg-white rounded-xl border p-4 transition-colors ${
                locked ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:border-sky-300'
              }`}
            >
              {locked && (
                <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {f.tier === 'pro' ? 'PRO' : 'STARTER'}
                </span>
              )}
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-medium text-gray-900 text-sm">{f.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{f.desc}</div>
            </Link>
          )
        })}
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3 text-sm">Informasi Akun</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-800">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Paket</span>
            <span className="font-medium text-gray-800">{TIER_LABEL[tier]}</span>
          </div>
          {user?.expires_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Aktif hingga</span>
              <span className="text-gray-800">{new Date(user.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade section */}
      {tier !== 'pro' && (
        <div id="upgrade" className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-xl p-5 text-white scroll-mt-6">
          <h2 className="font-semibold mb-1">
            {tier === 'free' ? 'Upgrade ke Starter atau Pro' : 'Upgrade ke Pro'}
          </h2>
          <p className="text-sky-100 text-sm mb-4">
            {tier === 'free'
              ? 'Buka Kalender Beasiswa, IELTS Tracker, CV Analyzer, dan hapus batas harian chat.'
              : 'Akses unlimited + Essay Workshop dengan kritik AI mendalam + konsultasi langsung bulanan.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {tier === 'free' && (
              <a href={XENDIT_LINKS.starter} target="_blank" rel="noopener noreferrer" className="bg-white text-sky-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-50 transition-colors">
                Starter — Rp99K/bulan
              </a>
            )}
            <a href={XENDIT_LINKS.pro} target="_blank" rel="noopener noreferrer" className="bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-400 transition-colors border border-sky-400">
              Pro — Rp299K/bulan
            </a>
          </div>
          <p className="text-sky-200 text-xs mt-3">
            Setelah bayar, WhatsApp ke Kak Dhana dengan bukti pembayaran untuk aktivasi akun.
          </p>
        </div>
      )}
    </div>
  )
}
