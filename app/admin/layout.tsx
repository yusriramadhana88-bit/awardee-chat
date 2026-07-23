'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { APP_VERSION } from '@/lib/version'

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Kelola User', icon: '👥' },
  { href: '/admin/affiliates', label: 'Afiliasi', icon: '🤝' },
  { href: '/admin/alumni', label: 'Awardee Alumni', icon: '🎓' },
  { href: '/admin/leads', label: 'Member Leads', icon: '📇' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-off lg:flex">
      <aside className="w-full lg:w-56 bg-navy text-off lg:h-screen lg:sticky lg:top-0">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6 px-2 pt-2">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-sm">⚙</div>
            <div>
              <div className="font-bold text-sm leading-tight">Admin Panel</div>
              <div className="text-[10px] text-muted leading-tight">AWARDEE APP v{APP_VERSION}</div>
            </div>
          </div>
          <nav className="space-y-1">
            {ADMIN_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-navy-2 text-white'
                    : 'text-muted hover:bg-navy hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 mt-auto border-t border-navy">
          <Link href="/dashboard" className="block text-sm text-muted hover:text-white px-2 mb-2">
            ← Kembali ke Dashboard
          </Link>
          <button onClick={handleLogout} className="w-full text-left text-sm text-muted hover:text-white px-2 py-1.5 transition-colors">
            Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
