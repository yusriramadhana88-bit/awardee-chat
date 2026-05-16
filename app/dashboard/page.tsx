'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const XENDIT_LINKS: Record<string, string> = {
  starter: 'https://checkout.xendit.co/od/GANTI_DENGAN_LINK_XENDIT_STARTER',
  pro: 'https://checkout.xendit.co/od/GANTI_DENGAN_LINK_XENDIT_PRO',
}

type Profile = {
  name: string
  email: string
  tier: string
  used: number
  limit: number
  expires_at: string | null
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/user')
      const data = await res.json()
      setProfile({ ...data, email: session.user.email })
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Memuat dashboard...</div>
      </div>
    )
  }

  const tierLabel = profile?.tier === 'pro' ? 'Pro' : profile?.tier === 'starter' ? 'Starter' : 'Gratis'
  const tierColor = profile?.tier === 'pro' ? 'text-purple-600 bg-purple-50 border-purple-200' : profile?.tier === 'starter' ? 'text-sky-600 bg-sky-50 border-sky-200' : 'text-gray-600 bg-gray-50 border-gray-200'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-gray-900 text-sm">Awardee.id</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/chat" className="text-sm bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors">
              Buka Chat
            </Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Keluar</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Hei, {profile?.name || 'Sobat AAS'} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Ini dashboard akun lo di Awardee.id.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-sky-600">{profile?.used || 0}</div>
            <div className="text-xs text-gray-400 mt-1">Pertanyaan hari ini</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{profile?.limit || 10}</div>
            <div className="text-xs text-gray-400 mt-1">Batas harian</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-sm font-bold px-2 py-1 rounded-full border inline-block ${tierColor}`}>{tierLabel}</div>
            <div className="text-xs text-gray-400 mt-1">Paket aktif</div>
          </div>
        </div>

        {/* Subscription info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Informasi Akun</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800">{profile?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paket</span>
              <span className={`font-medium ${profile?.tier === 'pro' ? 'text-purple-600' : profile?.tier === 'starter' ? 'text-sky-600' : 'text-gray-600'}`}>{tierLabel}</span>
            </div>
            {profile?.expires_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Aktif hingga</span>
                <span className="text-gray-800">{new Date(profile.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade section */}
        {profile?.tier !== 'pro' && (
          <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-xl p-5 text-white mb-6">
            <h2 className="font-semibold mb-1">
              {profile?.tier === 'free' ? 'Upgrade ke Starter atau Pro' : 'Upgrade ke Pro'}
            </h2>
            <p className="text-sky-100 text-sm mb-4">
              {profile?.tier === 'free'
                ? 'Hapus batas harian dan akses knowledge base dari semua video Kak Dhana.'
                : 'Akses unlimited + essay framework + konsultasi langsung bulanan.'}
            </p>
            <div className="flex flex-wrap gap-3">
              {profile?.tier === 'free' && (
                <a
                  href={XENDIT_LINKS.starter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-sky-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-50 transition-colors"
                >
                  Starter — Rp99K/bulan
                </a>
              )}
              <a
                href={XENDIT_LINKS.pro}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-400 transition-colors border border-sky-400"
              >
                Pro — Rp299K/bulan
              </a>
            </div>
            <p className="text-sky-200 text-xs mt-3">
              Setelah bayar, WhatsApp ke Kak Dhana dengan bukti pembayaran untuk aktivasi akun.
            </p>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/chat" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-sky-300 transition-colors group">
            <div className="text-xl mb-2">💬</div>
            <div className="font-medium text-gray-900 text-sm">Mulai Chat</div>
            <div className="text-xs text-gray-400 mt-0.5">Tanya soal AAS sekarang</div>
          </Link>
          <a href="https://www.youtube.com/@awardeeid" target="_blank" rel="noopener noreferrer" className="bg-white border border-gray-200 rounded-xl p-4 hover:border-sky-300 transition-colors">
            <div className="text-xl mb-2">▶️</div>
            <div className="font-medium text-gray-900 text-sm">YouTube Awardee.id</div>
            <div className="text-xs text-gray-400 mt-0.5">Video tips & strategi AAS</div>
          </a>
        </div>
      </main>
    </div>
  )
}
