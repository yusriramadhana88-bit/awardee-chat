'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { APP_LIMITS } from '@/lib/tracker'

export default function NewTrackerPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [canCreate, setCanCreate] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const [countRes, userRes] = await Promise.all([
        supabase
          .from('scholarship_applications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('status', 'active'),
        fetch('/api/user', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).then(r => r.json()),
      ])

      const count = countRes.count ?? 0
      const tier = userRes.tier || 'free'
      const limit = APP_LIMITS[tier] ?? 1
      setCanCreate(count < limit)
      setChecking(false)
    }
    check()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data, error: err } = await supabase
      .from('scholarship_applications')
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
      })
      .select('id')
      .single()

    if (err || !data) {
      setError('Gagal membuat aplikasi. Coba lagi.')
      setLoading(false)
      return
    }

    router.push(`/tracker/${data.id}/stages?new=1`)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Memeriksa akun...</div>
      </div>
    )
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center">
          <div className="text-3xl mb-3">🔒</div>
          <h2 className="font-bold text-gray-900 mb-2">Batas aplikasi tercapai</h2>
          <p className="text-sm text-gray-500 mb-5">
            Upgrade akun untuk membuat lebih banyak aplikasi beasiswa.
          </p>
          <Link href="/dashboard" className="block bg-sky-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 transition-colors mb-3">
            Upgrade Sekarang
          </Link>
          <Link href="/tracker" className="text-sm text-gray-400 hover:text-gray-600">Kembali ke Tracker</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link href="/tracker" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" />
            </svg>
          </Link>
          <span className="font-semibold text-gray-900 text-sm">Buat Aplikasi Baru</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Beasiswa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Contoh: AAS 2026, LPDP Reguler 2025"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Catatan / Deskripsi
                <span className="text-gray-400 font-normal ml-1">(opsional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Contoh: Beasiswa pemerintah Australia untuk S2 di bidang governance"
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Deadline Aplikasi
                <span className="text-gray-400 font-normal ml-1">(opsional)</span>
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <Link
                href="/tracker"
                className="flex-1 text-center border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                {loading ? 'Membuat...' : 'Buat & Atur Tahapan →'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Setelah ini, kamu bisa menambahkan tahapan & checklist yang disesuaikan.
        </p>
      </main>
    </div>
  )
}
