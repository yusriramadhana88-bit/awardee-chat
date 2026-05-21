'use client'

import Link from 'next/link'
import { useState } from 'react'

const FEATURES = [
  {
    icon: '📊',
    title: 'Laporan Keuangan Otomatis',
    desc: 'Input transaksi sederhana → Neraca, Laba Rugi, Arus Kas otomatis sesuai Kepmendesa 136/2022. Siap kirim ke Kecamatan.',
    badge: 'Core',
  },
  {
    icon: '🧾',
    title: 'Pajak BUMDes Terpandu',
    desc: 'PPh 21 karyawan, PPh 23 jasa, SPT Tahunan — dihitung otomatis. Kalender deadline & reminder sebelum kena denda.',
    badge: 'Eksklusif',
  },
  {
    icon: '🤖',
    title: 'AI "Tanya JAI"',
    desc: 'Chatbot berbasis regulasi terbaru: Permendesa, PMK, PP BUMDes. Tanya dalam bahasa sehari-hari, jawaban akurat & terverifikasi.',
    badge: 'AI',
  },
  {
    icon: '⚖️',
    title: 'Checklist Kepatuhan Hukum',
    desc: 'Status badan hukum BUMDes, NPWP, izin usaha, AD/ART — pantau semua kewajiban hukum dalam satu dashboard.',
    badge: 'Hukum',
  },
  {
    icon: '🚨',
    title: 'Early Warning Anti-Korupsi',
    desc: 'Audit trail lengkap, flag otomatis jika ada transaksi anomali, rekonsiliasi anggaran vs realisasi real-time.',
    badge: 'Governance',
  },
  {
    icon: '📱',
    title: 'Mobile-First & Offline',
    desc: 'Bekerja di HP Android murah. Sync otomatis saat ada internet. Tidak perlu laptop atau koneksi stabil.',
    badge: 'UX',
  },
]

const PRICING = [
  {
    name: 'Starter',
    price: 'Rp 99K',
    period: '/bulan',
    desc: 'Untuk BUMDes baru atau unit usaha tunggal',
    features: [
      'Laporan keuangan otomatis (Kepmendesa 136)',
      'Kalkulator PPh 21 karyawan',
      'Kalender pajak & reminder',
      'AI "Tanya JAI" (50 pertanyaan/bulan)',
      'Export PDF laporan',
      '1 pengguna',
    ],
    cta: 'Mulai Gratis 14 Hari',
    highlight: false,
    color: 'border-gray-200',
  },
  {
    name: 'Pro',
    price: 'Rp 199K',
    period: '/bulan',
    desc: 'Untuk BUMDes aktif dengan multi unit usaha',
    features: [
      'Semua fitur Starter',
      'PPh 23, PPh 4(2), PPN — semua jenis pajak',
      'Panduan daftar NPWP & badan hukum',
      'Checklist kepatuhan hukum penuh',
      'AI "Tanya JAI" (unlimited)',
      'Early warning anti-korupsi',
      '3 pengguna (Direktur + Bendahara + Sekretaris)',
      'Integrasi Siskeudes (export/import)',
    ],
    cta: 'Mulai Gratis 14 Hari',
    highlight: true,
    color: 'border-green-500',
  },
  {
    name: 'Kecamatan',
    price: 'Rp 1,5 juta',
    period: '/bulan',
    desc: 'Untuk Dinas PMD / paket 10 BUMDes',
    features: [
      'Semua fitur Pro untuk 10 BUMDes',
      'Dashboard monitoring Kecamatan/Kabupaten',
      'Laporan agregat semua BUMDes',
      'Dedicated support WhatsApp',
      'Pelatihan onboarding 1x via Zoom',
      'Tambah BUMDes: Rp 120K/unit',
    ],
    cta: 'Hubungi Sales',
    highlight: false,
    color: 'border-gray-200',
  },
]

const TESTIMONIALS = [
  { name: 'Pak Suyitno', role: 'Direktur BUMDes Maju Bersama, Klaten', text: 'Sebelumnya laporan keuangan kami selalu terlambat. Sekarang tinggal input transaksi, semua otomatis jadi. Auditor dari Inspektorat bilang ini sudah benar sesuai aturan.' },
  { name: 'Bu Ratna', role: 'Bendahara Desa Sukajadi, Banyumas', text: 'Yang bikin saya takut itu urusan pajak. Selalu takut salah dan kena denda. Dengan PatuhDesa sekarang ada pengingat dan panduan langkah demi langkah.' },
  { name: 'Pak Camat Soebandrio', role: 'Camat Wlingi, Blitar', text: 'Kami berlangganan paket Kecamatan untuk 12 BUMDes. Sekarang bisa pantau semua laporan keuangan dari satu dashboard tanpa harus minta laporan manual.' },
]

const FAQS = [
  { q: 'Apakah harus paham akuntansi untuk pakai PatuhDesa?', a: 'Tidak. PatuhDesa dirancang untuk operator desa dan BUMDes yang tidak berlatar akuntansi. Cukup input transaksi dalam bahasa sehari-hari, sistem yang akan mengubahnya ke format laporan keuangan standar.' },
  { q: 'Apakah laporan yang dihasilkan sudah sesuai regulasi terbaru?', a: 'Ya. Modul laporan keuangan mengacu pada Kepmendesa 136/2022, modul pajak mengacu pada UU PPh dan PMK terbaru, termasuk panduan transisi ke Coretax DJP 2025.' },
  { q: 'Bagaimana jika internet di desa tidak stabil?', a: 'PatuhDesa mendukung mode offline. Data disimpan di perangkat dan otomatis tersinkronisasi ke cloud saat koneksi tersedia.' },
  { q: 'Apakah data kami aman?', a: 'Data disimpan di server Indonesia dengan enkripsi end-to-end. Setiap BUMDes memiliki partisi data yang terisolasi. Tidak ada satu pun pihak lain yang bisa mengakses data BUMDes Anda.' },
  { q: 'Bisakah kami beralih dari AKUBUMDes atau Siskeudes?', a: 'Bisa. Kami menyediakan fitur import data dari format Excel dan Siskeudes. Tim kami siap membantu migrasi data secara gratis untuk paket Pro ke atas.' },
]

export default function SaasLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-black text-xs">PD</div>
            <div>
              <span className="font-black text-gray-900 text-sm">PatuhDesa</span>
              <span className="text-gray-400 text-xs ml-1">by PT Juris Auditama Indonesia</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#fitur" className="hover:text-green-700">Fitur</a>
            <a href="#harga" className="hover:text-green-700">Harga</a>
            <a href="#faq" className="hover:text-green-700">FAQ</a>
            <Link href="/saas/dashboard" className="text-green-700 hover:text-green-800 font-semibold">Lihat Demo</Link>
            <a href="#harga" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold">Coba Gratis</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-br from-green-900 via-green-800 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-green-100 px-4 py-1.5 rounded-full text-sm mb-6 border border-white/20">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            Satu-satunya platform yang integrasikan akuntansi + pajak BUMDes
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
            Laporan Keuangan, Pajak &<br />
            <span className="text-yellow-400">Kepatuhan BUMDes</span><br />
            Selesai dalam Menit
          </h1>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            PatuhDesa menggantikan spreadsheet, kalkulator pajak manual, dan tumpukan regulasi yang membingungkan. Didesain untuk operator desa — <strong className="text-white">tanpa perlu latar belakang akuntansi.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/saas/dashboard" className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-black px-8 py-4 rounded-xl transition-colors text-base">
              Lihat Demo Langsung →
            </Link>
            <a href="#harga" className="border-2 border-white/40 hover:border-white text-white px-8 py-4 rounded-xl font-semibold transition-colors text-base">
              Mulai Gratis 14 Hari
            </a>
          </div>
          <p className="text-green-300 text-sm">Tidak perlu kartu kredit · Gratis 14 hari · Setup 5 menit</p>
        </div>
      </section>

      {/* Problem Bar */}
      <section className="py-10 bg-red-50 border-y border-red-100">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-sm font-semibold text-red-600 mb-4 uppercase tracking-wide">Masalah yang Dialami 73.000+ BUMDes di Indonesia</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { stat: '24%', label: 'BUMDes tidak aktif karena salah kelola' },
              { stat: '72%', label: 'BUMDes belum berbadan hukum resmi' },
              { stat: '851', label: 'kasus korupsi Dana Desa ditangani KPK' },
              { stat: '∞', label: 'Regulasi baru per tahun yang wajib diikuti' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-red-600">{s.stat}</div>
                <div className="text-xs text-gray-600 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Visual */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-0 items-center">
            <div className="space-y-3">
              {['Spreadsheet Excel yang error', 'Kalkulator pajak manual', 'Konsultan mahal Rp 10jt+', 'Regulasi berubah tanpa notif', 'Laporan terlambat → dana tertahan'].map((p) => (
                <div key={p} className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-lg">✗</span>
                  <span className="text-sm text-gray-700">{p}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center py-8 md:py-0">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-3">PD</div>
                <div className="text-green-700 font-black text-lg">PatuhDesa</div>
                <div className="text-green-500 text-xs mt-1">Solusi satu platform</div>
              </div>
            </div>
            <div className="space-y-3">
              {['Laporan keuangan otomatis & standar', 'Pajak terhitung & deadline terpantau', 'AI jawab pertanyaan regulasi 24/7', 'Notif otomatis perubahan aturan', 'Audit trail anti-korupsi bawaan'].map((p) => (
                <div key={p} className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span className="text-sm text-gray-700">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50" id="fitur">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Fitur Lengkap</div>
            <h2 className="text-3xl font-bold text-gray-900">Semua yang Dibutuhkan BUMDes</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Satu platform menggantikan 5 tools berbeda yang biasanya dipakai terpisah-pisah.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{f.icon}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    f.badge === 'Eksklusif' ? 'bg-yellow-100 text-yellow-700' :
                    f.badge === 'AI' ? 'bg-purple-100 text-purple-700' :
                    f.badge === 'Hukum' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>{f.badge}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/saas/dashboard" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors">
              Lihat Demo Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-900 to-indigo-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-purple-300 font-semibold text-sm uppercase tracking-wider mb-3">Fitur AI Eksklusif</div>
              <h2 className="text-3xl font-bold text-white mb-5">AI "Tanya JAI" — Konsultan Pajak & Hukum 24/7</h2>
              <p className="text-purple-100 mb-6 leading-relaxed">Dilatih dari ribuan halaman regulasi: Permendesa, PMK, PP BUMDes, panduan BPKP, dan update Coretax DJP 2025. Tanya dalam bahasa sehari-hari.</p>
              <div className="space-y-3">
                {[
                  'Berapa PPh 21 untuk gaji Direktur BUMDes Rp 4 juta?',
                  'Apa saja dokumen untuk daftar badan hukum BUMDes?',
                  'Kapan deadline SPT Tahunan PPh Badan BUMDes?',
                  'Bagaimana cara catat pembelian aset BUMDes?',
                ].map((q) => (
                  <div key={q} className="bg-white/10 rounded-xl px-4 py-3 text-sm text-purple-100 border border-white/10">
                    💬 &quot;{q}&quot;
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-bold">AI</div>
                <span className="text-white font-semibold text-sm">Tanya JAI</span>
                <span className="ml-auto text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>Online</span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-400 shrink-0 mt-1 text-xs flex items-center justify-center text-white">U</div>
                  <div className="bg-white/20 rounded-xl px-4 py-3 text-sm text-white max-w-xs">BUMDes kami baru punya karyawan 2 orang, gaji Rp 3 juta/bulan. Harus lapor pajak apa?</div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-6 h-6 rounded-full bg-purple-400 shrink-0 mt-1 text-xs flex items-center justify-center text-white">AI</div>
                  <div className="bg-purple-600/60 rounded-xl px-4 py-3 text-sm text-white max-w-xs">Untuk gaji Rp 3 juta/bulan, BUMDes Anda wajib memotong <strong>PPh Pasal 21</strong>. Dengan PTKP TK/0 Rp 54 juta/tahun, penghasilan kena pajak = Rp 36 juta - PTKP = 0, sehingga PPh 21 = Rp 0. Namun tetap wajib membuat <strong>bukti potong Form 1721-A2</strong> dan melaporkan SPT Masa PPh 21 setiap bulan. Mau saya bantu hitung otomatis di modul pajak? 📊</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4" id="harga">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-3">Harga Transparan</div>
            <h2 className="text-3xl font-bold text-gray-900">Lebih Murah dari Denda Pajak Satu Kali</h2>
            <p className="text-gray-500 mt-3">Denda telat lapor SPT: Rp 100.000–Rp 1 juta per kejadian. PatuhDesa mulai Rp 99K/bulan.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((p) => (
              <div key={p.name} className={`rounded-2xl border-2 ${p.color} p-7 relative ${p.highlight ? 'shadow-xl' : ''}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    PALING POPULER
                  </div>
                )}
                <div className="text-sm font-bold text-gray-500 mb-1 uppercase">{p.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-gray-900">{p.price}</span>
                  <span className="text-gray-400 text-sm">{p.period}</span>
                </div>
                <p className="text-xs text-gray-500 mb-6">{p.desc}</p>
                <ul className="space-y-2.5 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 shrink-0 mt-0.5 font-bold">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    p.highlight
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'border border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">Semua paket termasuk gratis 14 hari trial. Bayar via Transfer, GoPay, OVO, atau QRIS.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-green-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Dipercaya BUMDes di Seluruh Indonesia</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-green-100 shadow-sm">
                <div className="flex gap-1 mb-4">{Array(5).fill('⭐').join('')}</div>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                    {t.name.split(' ')[1]?.[0] ?? t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4" id="faq">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Pertanyaan Umum</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 text-left text-sm font-medium text-gray-900 flex items-center justify-between"
                >
                  {faq.q}
                  <span className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-800 to-emerald-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">BUMDes Anda Bisa Mulai Hari Ini</h2>
          <p className="text-green-100 mb-8 max-w-xl mx-auto">Setup 5 menit. Gratis 14 hari. Tidak perlu kartu kredit. Laporan keuangan pertama Anda jadi sebelum hari ini berakhir.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-black px-10 py-4 rounded-xl transition-colors text-base">
              Mulai Gratis Sekarang →
            </a>
            <Link href="/saas/dashboard" className="border-2 border-white/40 hover:border-white text-white px-10 py-4 rounded-xl font-semibold transition-colors">
              Lihat Demo Dulu
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-black text-xs">PD</div>
            <div>
              <div className="text-white font-bold text-sm">PatuhDesa</div>
              <div className="text-gray-400 text-xs">by PT Juris Auditama Indonesia</div>
            </div>
          </div>
          <p className="text-gray-500 text-xs">© 2026 PT Juris Auditama Indonesia · info@patuhdesa.id</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <a href="#fitur" className="hover:text-white">Fitur</a>
            <a href="#harga" className="hover:text-white">Harga</a>
            <Link href="/consulting" className="hover:text-white">Tentang JAI</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
