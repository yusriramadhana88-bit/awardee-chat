'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess, TIER_LABEL, TIER_PRICE } from '@/lib/use-user'
import { ScholarshipApplication, getDeadlineInfo, formatDeadline } from '@/lib/tracker'
import { calculateXp, getPejuangLevel } from '@/lib/gamification'
import { LYNK_MEMBERSHIP_LINKS } from '@/lib/payment-links'
import SocialShowcase from './_components/SocialShowcase'

type LearnLesson = { id: string; slug: string; title: string; completed: boolean }
type LearnQuiz = { id: string; title: string; bestAttempt: { passed: boolean } | null }
type LearnModule = {
  slug: string; title: string; icon: string
  lessons: LearnLesson[]; lessonCount: number; completedCount: number
  quiz: LearnQuiz | null
}
type AchievementItem = { id: string; title: string; icon: string; earned: boolean; earnedAt: string | null }

const FEATURES: { href: string; icon: string; title: string; desc: string; tier: 'kopi' | 'starter' | 'pro' | null }[] = [
  { href: '/chat/aas', icon: '🇦🇺', title: 'Chat AAS · Den Dhana', desc: 'Konsultan khusus persiapan Australia Awards Scholarship', tier: null },
  { href: '/chat/lpdp', icon: '🇮🇩', title: 'Chat LPDP · Den Dhana', desc: 'Konsultan khusus persiapan LPDP', tier: null },
  { href: '/chat', icon: '💬', title: 'Tanya Produk & Layanan', desc: 'Tanya soal Awardee.id, produk, atau beasiswa secara umum', tier: null },
  { href: '/dashboard/learn', icon: '📚', title: 'Learning Modules', desc: 'Materi #GaliDiri, essay, sampai interview + kuis', tier: 'kopi' },
  { href: '/tracker', icon: '📋', title: 'Scholarship Tracker', desc: 'Pantau progres tahapan aplikasi beasiswamu', tier: 'kopi' },
  { href: '/dashboard/calendar', icon: '📅', title: 'Kalender Beasiswa', desc: 'Semua deadline penting dalam satu tampilan', tier: 'starter' },
  { href: '/dashboard/documents', icon: '✅', title: 'Checklist Dokumen', desc: 'Daftar dokumen wajib per jenis beasiswa', tier: 'kopi' },
  { href: '/dashboard/ielts', icon: '🎯', title: 'IELTS Tracker', desc: 'Catat skor & pantau progres menuju target', tier: 'starter' },
  { href: '/dashboard/cv', icon: '📄', title: 'CV Analyzer', desc: 'Analisis kekuatan CV untuk aplikasi beasiswa', tier: 'starter' },
  { href: '/dashboard/essay', icon: '✏️', title: 'Essay Workshop', desc: 'Kelola draft essay & dapatkan kritik AI mendalam', tier: 'pro' },
]

export default function DashboardPage() {
  const { user, loading } = useUser()
  const [applications, setApplications] = useState<ScholarshipApplication[]>([])
  const [pejuangXp, setPejuangXp] = useState(0)
  const [learnModules, setLearnModules] = useState<LearnModule[]>([])
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
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
    async function loadLearnAndAchievements() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const headers = { Authorization: `Bearer ${session.access_token}` }
      const [learnRes, achRes] = await Promise.all([
        fetch('/api/learn/modules', { headers }),
        fetch('/api/achievements', { headers }),
      ])
      if (learnRes.ok) setLearnModules((await learnRes.json()).modules)
      if (achRes.ok) setAchievements((await achRes.json()).achievements)
    }
    load()
    loadXp()
    loadLearnAndAchievements()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted text-sm">Memuat dashboard...</div>
      </div>
    )
  }

  const tier = user?.tier || 'free'
  const upcoming = applications
    .filter(a => a.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

  const totalLessons = learnModules.reduce((s, m) => s + m.lessonCount, 0)
  const totalLessonsDone = learnModules.reduce((s, m) => s + m.completedCount, 0)
  const continueModule = learnModules.find(m => m.completedCount < m.lessonCount)
    || learnModules.find(m => m.quiz && !m.quiz.bestAttempt?.passed)
  const continueLesson = continueModule?.lessons.find(l => !l.completed)
  const continueHref = continueModule
    ? continueLesson
      ? `/dashboard/learn/${continueModule.slug}/${continueLesson.slug}`
      : `/dashboard/learn/${continueModule.slug}/quiz`
    : '/dashboard/learn'
  const recentAchievements = achievements.filter(a => a.earned).slice(-4).reverse()

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-ink">Hei, {user?.name || 'Sobat Beasiswa'} 👋</h1>
        <p className="text-sm text-muted mt-1">Selamat datang di AWARDEE APP — pusat kendali perjalanan beasiswamu.</p>
      </div>

      {/* Continue Learning */}
      {learnModules.length > 0 && (
        <Link
          href={continueHref}
          className="block bg-gradient-to-br from-navy to-navy-2 rounded-xl p-5 mb-6 text-white hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-xs text-gold font-semibold uppercase tracking-wide">
                {totalLessonsDone >= totalLessons && totalLessons > 0 ? 'Semua Modul Selesai' : 'Lanjutkan Belajar'}
              </span>
              <h2 className="text-lg font-bold mt-1 truncate">
                {continueModule ? `${continueModule.icon} ${continueModule.title}` : 'Learning Modules'}
              </h2>
              <p className="text-white/70 text-xs mt-1">
                {continueLesson ? `Lanjut: ${continueLesson.title}` : continueModule ? 'Siap kerjakan kuis modul ini' : `${totalLessonsDone}/${totalLessons} lesson selesai — lihat semua modul`}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="w-14 h-14 rounded-full border-4 border-gold/30 border-t-gold flex items-center justify-center text-sm font-bold">
                {totalLessons > 0 ? Math.round((totalLessonsDone / totalLessons) * 100) : 0}%
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-gold-2">{user?.used ?? 0}/{user?.limit ?? 10}</div>
          <div className="text-xs text-muted mt-1">Pertanyaan AI hari ini</div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-ink">{applications.length}</div>
          <div className="text-xs text-muted mt-1">Aplikasi beasiswa aktif</div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4 col-span-2 lg:col-span-1">
          <div className="text-2xl font-bold text-ink">
            {upcoming ? formatDeadline(upcoming.deadline) : '—'}
          </div>
          <div className="text-xs text-muted mt-1">Deadline terdekat{upcoming ? ` · ${upcoming.name}` : ''}</div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="text-2xl font-bold text-purple-600">{TIER_LABEL[tier]}</div>
          <div className="text-xs text-muted mt-1">Paket aktif</div>
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
                <span className="text-xs font-medium text-muted block">Level Pejuang Beasiswa</span>
                <span className={`text-lg font-bold ${lvl.color}`}>{lvl.emoji} {lvl.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted">XP</span>
                <div className={`text-xl font-bold ${lvl.color}`}>{lvl.xp}</div>
              </div>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-700 ${lvl.level >= 5 ? 'bg-purple-500' : lvl.level >= 3 ? 'bg-blue-500' : 'bg-yellow-400'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[11px] text-muted mt-1.5">
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
              <p className="text-xs text-muted mt-0.5">Deadline: {formatDeadline(upcoming.deadline)}</p>
            </div>
            <Link href={`/tracker/${upcoming.id}`} className="text-xs font-semibold bg-white border border-hairline px-3 py-1.5 rounded-lg hover:border-gold transition-colors whitespace-nowrap">
              Lihat Detail
            </Link>
          </div>
        )
      })()}

      {/* Achievements teaser */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-xl border border-hairline p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">Achievements</h2>
            <Link href="/dashboard/achievements" className="text-xs text-gold-2 hover:underline">
              Lihat semua ({achievements.filter(a => a.earned).length}/{achievements.length})
            </Link>
          </div>
          {recentAchievements.length > 0 ? (
            <div className="flex gap-3 flex-wrap">
              {recentAchievements.map(a => (
                <div key={a.id} className="flex items-center gap-2 bg-off rounded-lg px-3 py-2 border border-gold">
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-xs font-medium text-ink">{a.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">Belum ada achievement — mulai belajar atau tracking untuk membuka badge pertamamu.</p>
          )}
        </div>
      )}

      {/* Feature grid */}
      <h2 className="text-sm font-semibold text-ink mb-3">Fitur AwardeeOS</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {FEATURES.map((f) => {
          const locked = !canAccess(tier, f.tier)
          return (
            <Link
              key={f.href}
              href={locked ? '#upgrade' : f.href}
              className={`relative bg-white rounded-xl border p-4 transition-colors ${
                locked ? 'border-hairline opacity-70' : 'border-hairline hover:border-gold'
              }`}
            >
              {locked && f.tier && (
                <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {TIER_LABEL[f.tier].toUpperCase()}
                </span>
              )}
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-medium text-ink text-sm">{f.title}</div>
              <div className="text-xs text-muted mt-0.5">{f.desc}</div>
            </Link>
          )
        })}
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-hairline p-5 mb-6">
        <h2 className="font-semibold text-ink mb-3 text-sm">Informasi Akun</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Email</span>
            <span className="text-ink">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Paket</span>
            <span className="font-medium text-ink">{TIER_LABEL[tier]}</span>
          </div>
          {user?.expires_at && (
            <div className="flex justify-between">
              <span className="text-muted">Aktif hingga</span>
              <span className="text-ink">{new Date(user.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      <SocialShowcase />

      {/* Upgrade section */}
      {tier !== 'pro' && (
        <div id="upgrade" className="bg-gradient-to-br from-navy to-navy-2 rounded-xl p-5 text-white scroll-mt-6">
          <h2 className="font-semibold mb-1">
            {tier === 'free' ? 'Upgrade untuk buka semua fitur' : tier === 'kopi' ? 'Upgrade ke Starter atau Pro' : 'Upgrade ke Pro'}
          </h2>
          <p className="text-white/70 text-sm mb-4">
            {tier === 'free'
              ? `Mulai dari ${TIER_PRICE.kopi} — buka Learning Modules, Scholarship Tracker, Checklist Dokumen & Achievements.`
              : tier === 'kopi'
              ? 'Buka Kalender Beasiswa, IELTS Tracker, CV Analyzer, dan hapus batas harian chat.'
              : 'Akses unlimited + Essay Workshop dengan kritik AI mendalam + konsultasi langsung bulanan.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {tier === 'free' && (
              <a href={LYNK_MEMBERSHIP_LINKS.kopi} target="_blank" rel="noopener noreferrer" className="bg-white text-gold-2 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-off transition-colors">
                Kopi — {TIER_PRICE.kopi}/bulan
              </a>
            )}
            {(tier === 'free' || tier === 'kopi') && (
              <a href={LYNK_MEMBERSHIP_LINKS.starter} target="_blank" rel="noopener noreferrer" className="bg-white text-gold-2 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-off transition-colors">
                Starter — {TIER_PRICE.starter}/bulan
              </a>
            )}
            <a href={LYNK_MEMBERSHIP_LINKS.pro} target="_blank" rel="noopener noreferrer" className="bg-gold text-navy text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gold-2 transition-colors border border-gold">
              Pro — {TIER_PRICE.pro}/bulan
            </a>
          </div>
          <p className="text-white/50 text-xs mt-3">
            Setelah bayar via lynk.id, WhatsApp ke Kak Dhana dengan bukti pembayaran untuk aktivasi akun (biasanya &lt;24 jam).
          </p>
        </div>
      )}
    </div>
  )
}
