'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [reqEmail, setReqEmail] = useState('')
  const [reqSent, setReqSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Link dari email reset membawa recovery token di URL — supabase-js otomatis
    // menukarnya jadi sesi sementara begitu klien dibuat. Tunggu event PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Link dari email kami: ?token_hash=...&type=recovery → tukar jadi sesi di sini (tidak bergantung redirect Supabase)
    const q = new URLSearchParams(window.location.search)
    const th = q.get('token_hash')
    if (th && q.get('type') === 'recovery') {
      supabase.auth.verifyOtp({ token_hash: th, type: 'recovery' }).then(({ error }) => {
        if (!error) { setReady(true); window.history.replaceState({}, '', '/reset-password') }
        else setLinkInvalid(true)
      }).catch(() => setLinkInvalid(true))
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function requestNewLink(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/auth/send-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: reqEmail }) }).catch(() => {})
    setReqSent(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Gagal mengubah password. Link mungkin sudah kedaluwarsa — minta link baru ya.')
      setLoading(false)
    } else {
      setDone(true)
      setLoading(false)
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-off flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-ink">Awardee.id</span>
          </Link>
          <h1 className="text-xl font-bold text-ink">Buat Password Baru</h1>
        </div>

        <div className="bg-white rounded-2xl border border-hairline p-6 shadow-sm">
          {done ? (
            <div className="text-center py-2">
              <div className="text-3xl mb-3">✅</div>
              <p className="text-sm text-ink font-medium">Password berhasil diubah! Mengarahkan ke login...</p>
            </div>
          ) : !ready && linkInvalid ? (
            reqSent ? (
              <p className="text-sm text-ink text-center py-4">Jika email terdaftar, link baru sudah dikirim. Buka email terbaru (cek folder spam) lalu klik link-nya dalam 1 jam.</p>
            ) : (
              <form onSubmit={requestNewLink} className="space-y-3">
                <p className="text-sm text-ink">Link ini sudah kedaluwarsa atau sudah tergantikan link yang lebih baru. Masukkan email kamu untuk mendapat link baru.</p>
                <input type="email" required value={reqEmail} onChange={(e) => setReqEmail(e.target.value)} placeholder="email@kamu.com" className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold" />
                <button type="submit" className="w-full bg-navy text-white rounded-xl py-3 text-sm font-semibold">Kirim link baru</button>
              </form>
            )
          ) : !ready ? (
            <p className="text-sm text-muted text-center py-4">Memverifikasi link reset...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Password Baru</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 6 karakter"
                  className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Ulangi password baru"
                  className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy hover:bg-navy-2 disabled:bg-hairline text-white rounded-xl py-3 text-sm font-semibold transition-colors"
              >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
