'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { APP_VERSION } from '@/lib/version'
import { useLang, T } from '@/lib/study-planner/lang'
import LangToggle from './LangToggle'

// Corong khusus pembeli "Akses Database STUDY PLANNER": tanpa menu member area lain.
export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { lang } = useLang()
  const t = T[lang]
  const [email, setEmail] = useState('')
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? '')) }, [supabase])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login?next=/planner'
  }

  return (
    <div className="min-h-screen bg-off flex flex-col">
      <header className="bg-white border-b border-hairline">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="font-extrabold text-lg tracking-tight">awardee<span className="bg-gold px-1 rounded ml-0.5">.id</span> <span className="text-sm font-semibold text-muted ml-1">{t.headerSub}</span></div>
          <div className="flex items-center gap-3 text-sm">
            <LangToggle />
            {email && <span className="text-muted hidden md:inline">{email}</span>}
            <button onClick={logout} className="text-muted underline hover:text-ink">{t.logout}</button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-hairline bg-white">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-3 text-xs text-muted flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Awardee.id · Study Planner</span>
          <span>{t.version} {APP_VERSION}</span>
        </div>
      </footer>
    </div>
  )
}
