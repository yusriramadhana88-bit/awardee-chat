import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kontak | AWARDEE APP',
  description: 'Hubungi tim AWARDEE APP untuk pertanyaan, kemitraan, atau pendaftaran mentoring privat Den Dhana.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-8">
        <Link href="/" className="text-sm text-sky-600 hover:underline">← Kembali ke Beranda</Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">Kontak Kami</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: Juni 2026</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <a
            href="https://wa.me/628XXXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-50 border border-green-200 rounded-xl p-5 hover:border-green-400 transition-colors group"
          >
            <div className="text-3xl mb-2">💬</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-green-700">WhatsApp DenDhana</h2>
            <p className="text-sm text-gray-500 mt-1">Untuk mentoring privat, konfirmasi pembayaran, dan pertanyaan umum. Jam respons: 07.00–22.00 WIB.</p>
            <span className="text-xs text-green-600 font-medium mt-2 block">Buka WhatsApp →</span>
          </a>

          <a
            href="mailto:yusri.ramadhana88@gmail.com"
            className="bg-sky-50 border border-sky-200 rounded-xl p-5 hover:border-sky-400 transition-colors group"
          >
            <div className="text-3xl mb-2">✉️</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-sky-700">Email</h2>
            <p className="text-sm text-gray-500 mt-1">Untuk laporan teknis, DMCA, kemitraan, atau pertanyaan formal. Respons dalam 1–2 hari kerja.</p>
            <span className="text-xs text-sky-600 font-medium mt-2 block">yusri.ramadhana88@gmail.com →</span>
          </a>

          <a
            href="https://instagram.com/awardee.id"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-pink-50 border border-pink-200 rounded-xl p-5 hover:border-pink-400 transition-colors group"
          >
            <div className="text-3xl mb-2">📸</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-pink-700">Instagram</h2>
            <p className="text-sm text-gray-500 mt-1">Update terbaru, tips beasiswa, dan inspirasi dari komunitas awardee.</p>
            <span className="text-xs text-pink-600 font-medium mt-2 block">@awardee.id →</span>
          </a>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
            <div className="text-3xl mb-2">🎓</div>
            <h2 className="font-semibold text-gray-900">Mentoring Privat</h2>
            <p className="text-sm text-gray-500 mt-1">
              4 sesi × 1 jam intensif.<br />
              <strong className="text-purple-700">Rp 7.500.000</strong> per orang.<br />
              Hubungi via WhatsApp untuk jadwal.
            </p>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-2">Jam Operasional</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between"><span>Senin – Jumat</span><span>07.00 – 22.00 WIB</span></div>
            <div className="flex justify-between"><span>Sabtu – Minggu</span><span>09.00 – 21.00 WIB</span></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Platform AI tersedia 24/7. Respons tim manusia sesuai jam operasional.</p>
        </div>
      </div>
    </div>
  )
}
