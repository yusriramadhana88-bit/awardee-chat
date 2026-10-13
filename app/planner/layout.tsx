'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

// Corong khusus pembeli "Akses Database STUDY PLANNER": tanpa menu member area lain.
export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? '')) }, [supabase])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login?next=/planner'
  }

  return (
    <div className="min-h-screen bg-off">
      <header className="bg-white border-b border-hairline">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="font-extrabold text-lg tracking-tight">awardee<span className="bg-gold px-1 rounded ml-0.5">.id</span> <span className="text-sm font-semibold text-muted ml-1">Study Planner</span></div>
          <div className="flex items-center gap-3 text-sm">
            {email && <span className="text-muted hidden sm:inline">{email}</span>}
            <button onClick={logout} className="text-muted underline hover:text-ink">Keluar</button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
