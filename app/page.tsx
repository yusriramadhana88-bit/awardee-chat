'use client'

import Link from 'next/link'

const TESTIMONIALS = [
  { name: 'Rizki M.', year: '2023', text: 'Dari nol sampai dapat AAS dalam 1 tahun. Kak Dhana beneran tahu cara bikin essay yang kena di DFAT.' },
  { name: 'Sari W.', year: '2022', text: 'Interview AAS gw udah gagal 2x sebelum ketemu Kak Dhana. Tahun ketiga akhirnya lolos!' },
  { name: 'Budi P.', year: '2024', text: 'Yang paling bantu itu cara Kak Dhana explain apa yang DFAT cari. Beda banget sama sumber lain.' },
]

const FAQS = [
  { q: 'AI ini bisa gantiin konsultasi 1-on-1 ga?', a: 'Bisa untuk konsultasi awal, review strategi, dan tanya-jawab umum soal AAS. Untuk review essay dan interview prep intensif, tetap ada paket 1-on-1 dengan Kak Dhana.' },
  { q: 'Apakah AI ini update dengan info AAS terbaru?', a: 'AI ini dilatih dari pengalaman nyata Kak Dhana dan diupdate secara berkala. Untuk informasi deadline terbaru, selalu cross-check dengan website resmi DFAT.' },
  { q: 'Gimana cara upgrade ke paket berbayar?', a: 'Klik tombol upgrade, pilih paket, bayar via transfer/GoPay/OVO, dan akses langsung aktif.' },
  { q: 'Apakah bisa refund?', a: 'Ada garansi 7 hari. Kalau lo ngerasa tidak puas, hubungi Kak Dhana langsung via WhatsApp.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-gray-900">Awardee.id</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Masuk</Link>
            <Link href="/register" className="text-sm bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-colors">Mulai Gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            AI aktif 24/7 — tanya kapan aja
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Tanya langsung ke AI yang<br />
            <span className="text-sky-600">dilatih dari pengalaman nyata AAS</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Den Dhana — awardee AAS, auditor BPK, 7 tahun mentor beasiswa — ngoding AI ini dari nol biar lo bisa konsultasi kapan aja, tanpa waiting list.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors text-base">
              Coba Gratis Sekarang
            </Link>
            <Link href="/chat" className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3.5 rounded-xl font-semibold transition-colors text-base">
              Lihat Demo Chat
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Gratis 10 pertanyaan/hari. Tidak perlu kartu kredit.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-sky-600">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { num: '100%', label: 'Tingkat keberhasilan mentee berbayar' },
            { num: '7+', label: 'Tahun pengalaman mentoring AAS' },
            { num: '24/7', label: 'Tersedia kapan aja, no waiting list' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-white">{s.num}</div>
              <div className="text-sky-100 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Apa yang bisa lo tanyain?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📝', title: 'Essay & Personal Statement', desc: 'Review strategi essay lo, tau apa yang DFAT cari, dan cara positioning diri yang tepat.' },
              { icon: '🎯', title: 'Strategi Aplikasi AAS', desc: 'Dari kelengkapan dokumen, referensi, sampai cara handle gap year dan red flags di CV.' },
              { icon: '🎤', title: 'Persiapan Interview', desc: 'Pola pertanyaan interview AAS, cara jawab dengan framework yang benar, dan common mistakes.' },
              { icon: '🇦🇺', title: 'Kehidupan di Australia', desc: 'Tanya soal kota, universitas, akomodasi, biaya hidup, dan adaptasi sebagai awardee.' },
              { icon: '📊', title: 'Assessment Leadership', desc: 'Cara menulis Leadership Statement dan Community Impact yang kena.' },
              { icon: '🔍', title: 'IELTS untuk AAS', desc: 'Target skor, strategi belajar, dan tips khusus untuk kebutuhan aplikasi AAS.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-5 border border-gray-200 hover:border-sky-300 transition-colors">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4" id="harga">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Pilih paket yang sesuai</h2>
          <p className="text-center text-gray-500 mb-12">Mulai gratis, upgrade kapan lo siap</p>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="text-sm font-medium text-gray-500 mb-1">GRATIS</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">Rp0</div>
              <div className="text-sm text-gray-400 mb-6">selamanya</div>
              <ul className="space-y-3 mb-8">
                {['10 pertanyaan per hari', 'Akses semua topik AAS', 'Tidak perlu kartu kredit'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center border border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:border-gray-400 transition-colors">
                Mulai Gratis
              </Link>
            </div>

            {/* Starter */}
            <div className="border-2 border-sky-600 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-xs px-3 py-1 rounded-full font-medium">PALING POPULER</div>
              <div className="text-sm font-medium text-sky-600 mb-1">STARTER</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">Rp99K</div>
              <div className="text-sm text-gray-400 mb-6">per bulan</div>
              <ul className="space-y-3 mb-8">
                {['50 pertanyaan per hari', 'Semua fitur Gratis', 'Akses knowledge base video', 'Priority response'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-sky-500">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=starter" className="block text-center bg-sky-600 hover:bg-sky-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                Mulai Starter
              </Link>
            </div>

            {/* Pro */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-gray-900">
              <div className="text-sm font-medium text-gray-400 mb-1">PRO</div>
              <div className="text-3xl font-bold text-white mb-1">Rp299K</div>
              <div className="text-sm text-gray-500 mb-6">per bulan</div>
              <ul className="space-y-3 mb-8">
                {['Unlimited pertanyaan', 'Semua fitur Starter', 'Akses essay framework', '1x konsultasi chat langsung/bulan'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-sky-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=pro" className="block text-center bg-white hover:bg-gray-100 text-gray-900 rounded-xl py-2.5 text-sm font-medium transition-colors">
                Mulai Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Yang udah buktiin hasilnya</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">AAS Awardee {t.year}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Pertanyaan yang sering muncul</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="border border-gray-200 rounded-xl group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-medium text-gray-900 flex items-center justify-between">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-sky-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Siap mulai perjalanan AAS lo?</h2>
          <p className="text-sky-100 mb-8">Gratis 10 pertanyaan per hari. Ga perlu kartu kredit.</p>
          <Link href="/register" className="inline-block bg-white hover:bg-gray-100 text-sky-600 font-semibold px-8 py-3.5 rounded-xl transition-colors">
            Coba Sekarang — Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-sky-600 flex items-center justify-center text-white text-xs font-bold">A</div>
            <span className="text-sm text-gray-600">Awardee.id © 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="https://www.youtube.com/@awardeeid" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">YouTube</a>
            <Link href="/login" className="hover:text-gray-700">Masuk</Link>
            <Link href="/register" className="hover:text-gray-700">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
