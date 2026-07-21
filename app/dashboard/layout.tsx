'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess, TIER_LABEL, TIER_COLOR } from '@/lib/use-user'

const NAV_ITEMS: { href: string; label: string; icon: string; tier: 'starter' | 'pro' | null }[] = [
  { href: '/dashboard', label: 'Overview', icon: '🏠', tier: null },
  { href: '/chat', label: 'Chat AI Den Dhana', icon: '💬', tier: null },
  { href: '/tracker', label: 'Scholarship Tracker', icon: '📋', tier: null },
  { href: '/dashboard/calendar', label: 'Kalender Beasiswa', icon: '📅', tier: 'starter' },
  { href: '/dashboard/documents', label: 'Checklist Dokumen', icon: '✅', tier: null },
  { href: '/dashboard/ielts', label: 'IELTS Tracker', icon: '🎯', tier: 'starter' },
  { href: '/dashboard/cv', label: 'CV Analyzer', icon: '📄', tier: 'starter' },
  { href: '/dashboard/essay', label: 'Essay Workshop', icon: '✏️', tier: 'pro' },
  { href: '/dashboard/affiliate', label: 'Afiliasi & Komisi', icon: '🤝', tier: null },
  { href: '/dashboard/alumni', label: 'Awardee Alumni', icon: '🎓', tier: null },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Memuat AWARDEE APP...</div>
      </div>
    )
  }

  const tier = user?.tier || 'free'

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm">A</div>
          <span className="font-bold text-gray-900 text-sm">AWARDEE APP</span>
        </Link>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-500 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            {menuOpen ? (
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" />
            ) : (
              <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${menuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto`}>
        <div className="p-4">
          <Link href="/dashboard" className="hidden lg:flex items-center gap-2 mb-6 px-2">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-white font-bold">A</div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">AWARDEE APP</div>
              <div className="text-[10px] text-gray-400 leading-tight">v2.0 · by Awardee.id</div>
            </div>
          </Link>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              const locked = !canAccess(tier, item.tier)
              return (
                <Link
                  key={item.href}
                  href={locked ? '/dashboard#upgrade' : item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-off text-navy'
                      : locked
                      ? 'text-gray-400 hover:bg-gray-50'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {locked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                      {item.tier === 'pro' ? 'PRO' : 'STARTER'}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 mt-auto border-t border-gray-100">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email}</div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${TIER_COLOR[tier]}`}>
              {TIER_LABEL[tier]}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 transition-colors"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
