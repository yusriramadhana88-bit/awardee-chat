'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TIER_LABEL, TIER_PRICE } from '@/lib/use-user'

function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'free'
  const next = searchParams.get('next') || '/dashboard'
  const supabase = createClient()

  // Format phone: pastikan dimulai dengan +62
  function normalizePhone(raw: string) {
    let p = raw.replace(/\s+/g, '').replace(/-/g, '')
    if (p.startsWith('08')) p = '+62' + p.slice(1)
    if (p.startsWith('8')) p = '+62' + p
    if (!p.startsWith('+')) p = '+62' + p
    return p
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      setLoading(false)
      return
    }

    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length < 10) {
      setError('Nomor WhatsApp tidak valid.')
      setLoading(false)
      return
    }

    // Cek apakah nomor WA sudah dipakai akun lain (via API endpoint)
    const checkRes = await fetch('/api/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone }),
    })
    const checkData = await checkRes.json()
    if (checkData.exists) {
      setError('Nomor WhatsApp ini sudah terdaftar. Gunakan nomor lain atau login ke akun yang sudah ada.')
      setLoading(false)
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Supabase tidak return error untuk email duplikat — deteksi via identities kosong
    if (!signUpData.user || signUpData.user.identities?.length === 0) {
      setError('Email ini sudah terdaftar. Silakan login atau gunakan email lain.')
      setLoading(false)
      return
    }

    // Simpan phone ke profiles (jika sudah dipakai, akan hapus user baru & return error)
    const saveRes = await fetch('/api/save-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: signUpData.user.id, phone: normalizedPhone }),
    })
    const saveData = await saveRes.json()
    if (!saveData.ok) {
      setError('Nomor WhatsApp ini sudah terdaftar. Gunakan nomor lain atau login ke akun yang sudah ada.')
      setLoading(false)
      return
    }

    // Auto-confirm email (bypass Supabase SMTP limit)
    await fetch('/api/confirm-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: signUpData.user.id }),
    })

    // Auto-login langsung setelah konfirmasi
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      // Fallback: arahkan ke login manual jika auto-login gagal
      setDone(true)
      setLoading(false)
      return
    }

    router.push(next)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-off flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-ink mb-2">Akun berhasil dibuat!</h2>
          <p className="text-muted text-sm mb-6">
            Akun kamu sudah aktif. Silakan login untuk mulai chat dengan Den Dhana.
          </p>
          {plan !== 'free' && (
            <div className="bg-off border border-gold rounded-xl p-4 text-sm text-navy mb-4">
              Kamu pilih paket <strong>{TIER_LABEL[plan] ?? plan} ({TIER_PRICE[plan] ?? ''})</strong>.<br />
              Setelah login, kamu bisa upgrade dari dashboard.
            </div>
          )}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-gold-2 hover:underline text-sm">Masuk sekarang</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-off flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-ink">Awardee.id</span>
          </Link>
          <h1 className="text-xl font-bold text-ink">Buat akun gratis</h1>
          <p className="text-sm text-muted mt-1">Sudah punya akun? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-gold-2 hover:underline">Masuk</Link></p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-700">
          <strong>Akun gratis:</strong> 5 chat AI/hari. Nomor WhatsApp dipakai untuk verifikasi identitas — 1 nomor untuk 1 akun.
        </div>

        {plan !== 'free' && (
          <div className="bg-off border border-gold rounded-xl px-4 py-3 mb-4 text-sm text-navy text-center">
            Daftar untuk paket <strong>{TIER_LABEL[plan] ?? plan}</strong>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-hairline p-6 shadow-sm">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Nama lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nama kamu"
                className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@gmail.com"
                className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Nomor WhatsApp <span className="text-amber-600 font-normal">(wajib, untuk verifikasi)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="08xxxxxxxxxx"
                className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <p className="text-xs text-muted mt-1">1 nomor WA hanya bisa untuk 1 akun</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Min. 6 karakter"
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
              {loading ? 'Memproses...' : 'Daftar Gratis'}
            </button>
          </form>
          <p className="text-xs text-muted text-center mt-4">
            Dengan daftar, kamu setuju dengan syarat penggunaan Awardee.id.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-off flex items-center justify-center"><div className="text-muted">Memuat...</div></div>}>
      <RegisterForm />
    </Suspense>
  )
}
