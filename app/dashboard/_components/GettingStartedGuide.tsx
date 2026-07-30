'use client'

import { useState } from 'react'
import Link from 'next/link'

type Track = 'lpdp' | 'aas' | 'unsure'
type Step = { label: string; desc: string; href: string }

const STEPS: Record<Track, Step[]> = {
  lpdp: [
    { label: 'LPDP Center', desc: 'Isi Profil Intake dulu di sana', href: '/dashboard/lpdp' },
    { label: 'Checklist Dokumen', desc: 'Lihat dokumen apa saja yang wajib disiapkan', href: '/dashboard/documents' },
    { label: 'Cek Dokumen & Review Esai', desc: 'Upload dokumen & esai (Profil Diri/Esai Komitmen), langsung dapat verdict + skor — ada di dalam LPDP Center', href: '/dashboard/lpdp' },
    { label: 'Chat LPDP · Den Dhana', desc: 'Diskusi strategi lebih dalam kalau masih ada yang mengganjal', href: '/chat/lpdp' },
    { label: 'Scholarship Tracker', desc: 'Pantau progres tiap tahapan pendaftaranmu', href: '/tracker' },
  ],
  aas: [
    { label: 'AAS Center', desc: 'Isi Profil Intake dulu di sana', href: '/dashboard/aas' },
    { label: 'Cek Dokumen & Review Esai', desc: 'Upload supporting statement, langsung dapat verdict + skor — ada di dalam AAS Center', href: '/dashboard/aas' },
    { label: 'Chat AAS · Den Dhana', desc: 'Pendalaman strategi & latihan interview', href: '/chat/aas' },
    { label: 'CV Analyzer', desc: 'Cek kekuatan CV kamu (tier VIP ke atas)', href: '/dashboard/cv' },
  ],
  unsure: [
    { label: 'Tanya Produk & Layanan', desc: 'Cerita goals & latar belakangmu ke Den Dhana', href: '/chat' },
    { label: 'Learning Modules', desc: 'Materi #GaliDiri buat mulai kenal diri sendiri', href: '/dashboard/learn' },
    { label: 'Putuskan LPDP atau AAS', desc: 'Kalau arahnya udah lebih jelas, balik ke sini dan pilih salah satu track di atas', href: '#' },
  ],
}

const TRACK_META: Record<Track, { icon: string; label: string }> = {
  lpdp: { icon: '🛡️', label: 'Aku incar LPDP' },
  aas: { icon: '🦘', label: 'Aku incar AAS' },
  unsure: { icon: '💬', label: 'Belum yakin, mau tanya dulu' },
}

export default function GettingStartedGuide() {
  const [track, setTrack] = useState<Track | null>(null)

  return (
    <div className="bg-gradient-to-br from-off to-white border border-gold rounded-xl p-5 mb-8">
      <h2 className="font-semibold text-ink mb-1">🧭 Bingung mulai dari mana?</h2>
      <p className="text-sm text-muted mb-4">Pilih salah satu, nanti muncul urutan langkah yang disarankan di bawah.</p>

      <div className="grid sm:grid-cols-3 gap-3">
        {(Object.keys(TRACK_META) as Track[]).map((t) => (
          <button
            key={t}
            onClick={() => setTrack(t)}
            className={`bg-white border rounded-xl p-3 text-center transition-colors ${
              track === t ? 'border-gold ring-1 ring-gold/30' : 'border-hairline hover:border-gold'
            }`}
          >
            <div className="text-xl mb-1">{TRACK_META[t].icon}</div>
            <div className="text-sm font-medium text-ink">{TRACK_META[t].label}</div>
          </button>
        ))}
      </div>

      {track && (
        <ol className="mt-4 space-y-2">
          {STEPS[track].map((s, i) => (
            <li key={i}>
              <Link
                href={s.href}
                className="flex items-start gap-3 bg-white border border-hairline rounded-xl p-3 hover:border-gold transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-off text-navy text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{s.label}</div>
                  <div className="text-xs text-muted mt-0.5">{s.desc}</div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="text-xs text-muted mt-3">
        Masih bingung soal menu lain? Klik ikon chat 💬 di pojok kanan bawah kapan saja — bisa tanya langsung ke AI.
      </p>
    </div>
  )
}
