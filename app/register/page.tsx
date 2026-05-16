'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'free'
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cek email lo!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Gw udah kirim link konfirmasi ke <strong>{email}</strong>. Klik link-nya dulu baru bisa login.
          </p>
          {plan !== 'free' && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm text-sky-700 mb-4">
              Lo pilih paket <strong>{plan === 'pro' ? 'Pro (Rp299K)' : 'Starter (Rp99K)'}</strong>.<br />
              Setelah konfirmasi email, lo bisa upgrade dari dashboard.
            </div>
          )}
          <Link href="/login" className="text-sky-600 hover:underline text-sm">Sudah konfirmasi? Masuk sekarang</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-gray-900">Awardee.id</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Buat akun gratis</h1>
          <p className="text-sm text-gray-500 mt-1">Sudah punya akun? <Link href="/login" className="text-sky-600 hover:underline">Masuk</Link></p>
        </div>

        {plan !== 'free' && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 mb-4 text-sm text-sky-700 text-center">
            Daftar untuk paket <strong>{plan === 'pro' ? 'Pro' : 'Starter'}</strong>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nama lo"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@gmail.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 6 karakter"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
            >
              {loading ? 'Memproses...' : 'Daftar Gratis'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            Dengan daftar, lo setuju dengan syarat penggunaan Awardee.id.
          </p>
        </div>
      </div>
    </div>
  )
}
