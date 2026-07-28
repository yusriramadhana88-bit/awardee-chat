'use client'

import { useState } from 'react'
import Link from 'next/link'

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'AwardeeIdBot'

export default function AasInterviewLandingPage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [telegramUrl, setTelegramUrl] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Isi nama kamu terlebih dahulu ya.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/leads/aas-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError('Ada masalah teknis, coba lagi sebentar ya.')
        setLoading(false)
        return
      }
      setTelegramUrl(`https://t.me/${BOT_USERNAME}?start=${data.leadId}`)
    } catch {
      setError('Ada masalah teknis, coba lagi sebentar ya.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-14 lg:px-8">
        <Link href="/" className="text-sm text-sky-600 hover:underline">← Awardee.id</Link>

        <div className="mt-6 text-center">
          <span className="inline-block bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            GRATIS · PANDUAN INTERVIEW AAS
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            3 Kriteria Penilaian GST + Framework Jawaban dari Awardee AAS
          </h1>
          <p className="text-gray-500 mt-4 max-w-lg mx-auto">
            Pola pertanyaan yang hampir pasti muncul, kesalahan fatal yang bikin gagal, dan framework
            jawaban dari Dhana — founder Awardee.id &amp; Awardee AAS.
          </p>
        </div>

        <div className="mt-10 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {!telegramUrl ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kamu"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Memproses...' : 'Ambil Panduan Gratis'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                PDF-nya dikirim otomatis lewat bot Telegram resmi Awardee.id — bukan chat pribadi.
                Kamu yang klik dan mulai chat-nya sendiri di langkah berikutnya.
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <h2 className="text-xl font-semibold text-gray-900">Satu langkah lagi!</h2>
              <p className="text-gray-500">
                Klik tombol di bawah untuk buka Telegram, lalu tekan <strong>Start</strong> di bot
                Awardee.id. PDF-nya langsung dikirim ke chat kamu.
              </p>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Buka Telegram &amp; Ambil PDF →
              </a>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Data kamu hanya dipakai untuk mengirim panduan ini via bot resmi Awardee.id. Kami tidak
          mengirim pesan pribadi ke kontak Telegram kamu.
        </p>
      </div>
    </div>
  )
}
