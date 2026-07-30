'use client'

import Link from 'next/link'
import Image from 'next/image'
import TestimonialCarousel from './_components/TestimonialCarousel'

const FAQS = [
  { q: 'Apakah AI ini bisa menggantikan konsultasi 1-on-1?', a: 'Bisa untuk konsultasi awal, review strategi, dan tanya-jawab umum soal beasiswa apapun yang kamu tuju (AAS, LPDP, Chevening, GKS, dll). Untuk review essay dan interview prep intensif, tetap ada paket 1-on-1 dengan Kak Dhana.' },
  { q: 'Apakah AI ini cuma bisa bantu untuk AAS?', a: 'Tidak — AI ini dilatih dari pengalaman Kak Dhana mendampingi berbagai beasiswa: AAS, LPDP, Chevening, GKS, dan beasiswa dalam/luar negeri lainnya. Untuk informasi kuota/deadline terbaru, selalu cross-check dengan website resmi masing-masing beasiswa karena bisa berubah tiap siklus.' },
  { q: 'Bagaimana cara upgrade ke paket berbayar?', a: 'Klik tombol upgrade, pilih paket, bayar via transfer/GoPay/OVO, dan akses langsung aktif.' },
  { q: 'Apakah bisa refund?', a: 'Ada garansi 7 hari. Kalau kamu merasa tidak puas, hubungi Kak Dhana langsung via WhatsApp.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-off">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-hairline shadow-[inset_0_-3px_0_theme(colors.gold.DEFAULT)] z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-ink tracking-tight">Awardee<span className="text-gold-2">.id</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors">Masuk</Link>
            <Link href="/register" className="text-sm bg-gold hover:bg-gold-2 text-navy font-semibold px-4 py-2 rounded-pill transition-colors">Mulai Gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-[68px] min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero-aas.jpg" alt="" fill priority className="object-cover object-[center_25%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-off via-off/85 md:via-off/80 to-off/10" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 w-full">
          <div className="max-w-xl py-20">
            <div className="inline-flex items-center gap-2 bg-gold text-navy font-bold text-xs tracking-wide px-4 py-2 rounded-pill mb-6">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              AI AKTIF 24/7 — TANYA KAPAN AJA
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-ink leading-[1.08] mb-6">
              Tanya langsung ke AI yang{' '}
              <span className="bg-gold px-1 rounded box-decoration-clone">dilatih dari pengalaman nyata beasiswa</span>
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-9 max-w-md">
              Den Dhana — awardee beasiswa, auditor BPK, 7 tahun mentor AAS, LPDP, Chevening, GKS, dan beasiswa lainnya — membangun AI ini dari nol supaya kamu bisa konsultasi kapan saja, tanpa waiting list.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="bg-gold hover:bg-gold-2 text-navy px-8 py-3.5 rounded-pill font-semibold transition-colors text-base text-center shadow-brand">
                Coba Gratis Sekarang
              </Link>
              <Link href="/chat" className="border border-hairline hover:border-ink bg-white/70 backdrop-blur text-ink px-8 py-3.5 rounded-pill font-semibold transition-colors text-base text-center">
                Lihat Demo Chat
              </Link>
            </div>
            <p className="text-xs text-muted mt-4">Gratis 5 pertanyaan/hari. Tidak perlu kartu kredit.</p>

            <div className="flex gap-10 mt-14 pt-8 border-t border-hairline">
              {[
                { num: '100%', label: 'Sukses mentee berbayar' },
                { num: '7+', label: 'Tahun mentoring beasiswa' },
                { num: '24/7', label: 'Siap kapan aja' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-semibold text-ink">{s.num}</div>
                  <div className="text-xs text-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section className="py-14 bg-navy">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { num: '100%', label: 'Tingkat keberhasilan mentee berbayar' },
            { num: '7+', label: 'Tahun pengalaman mentoring beasiswa' },
            { num: '24/7', label: 'Tersedia kapan aja, no waiting list' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-semibold text-gold">{s.num}</div>
              <div className="text-white/70 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-off">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-12">Apa yang bisa kamu tanyakan?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📝', title: 'Essay & Profil Diri', desc: 'Review strategi essay kamu — Personal Statement AAS, Profil Diri & Esai Komitmen LPDP, atau esai Chevening — dan cara positioning diri yang tepat.' },
              { icon: '🎯', title: 'Strategi Aplikasi', desc: 'Dari kelengkapan dokumen, referensi, sampai cara handle gap year dan red flags di CV — untuk AAS, LPDP, Chevening, GKS, dan beasiswa lainnya.' },
              { icon: '🎤', title: 'Persiapan Interview', desc: 'Pola pertanyaan interview/JST tiap beasiswa, cara jawab dengan framework yang benar, dan common mistakes.' },
              { icon: '🌍', title: 'Kehidupan sebagai Awardee', desc: 'Tanya soal kota, universitas, akomodasi, biaya hidup, dan adaptasi di negara tujuanmu.' },
              { icon: '📊', title: 'Leadership & Kontribusi', desc: 'Cara menulis Leadership Statement, Community Impact, atau Esai Komitmen Kontribusi yang kena.' },
              { icon: '🔍', title: 'IELTS / TOEFL', desc: 'Target skor, strategi belajar, dan tips sesuai kebutuhan beasiswa yang kamu tuju.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-5 border border-hairline hover:border-gold transition-colors">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-ink mb-1">{f.title}</h3>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-white" id="harga">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-2">Pilih paket yang sesuai</h2>
          <p className="text-center text-muted mb-2">Mulai gratis, upgrade kapan kamu siap</p>
          <p className="text-center text-sm mb-12">
            <Link href="/demo" className="text-gold-2 underline hover:text-navy transition-colors">Lihat demo semua fitur dashboard →</Link>
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <div className="border border-hairline rounded-2xl p-6">
              <div className="text-sm font-medium text-muted mb-1">GRATIS</div>
              <div className="text-3xl font-semibold text-ink mb-1">Rp0</div>
              <div className="text-sm text-muted mb-6">selamanya</div>
              <ul className="space-y-3 mb-8">
                {['5 chat AI per hari', 'Akses semua topik AAS', 'Tidak perlu kartu kredit'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/80">
                    <span className="text-gold-2">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center border border-hairline text-ink rounded-pill py-2.5 text-sm font-medium hover:border-ink transition-colors">
                Mulai Gratis
              </Link>
            </div>

            {/* Starter */}
            <div className="border border-hairline rounded-2xl p-6">
              <div className="text-sm font-semibold text-amber-700 mb-1">STARTER</div>
              <div className="text-3xl font-semibold text-ink mb-1">Rp49K</div>
              <div className="text-sm text-muted mb-6">per bulan</div>
              <ul className="space-y-3 mb-8">
                {['20 chat AI per hari', 'Learning Modules & kuis', 'Scholarship Tracker', 'Checklist Dokumen & Achievements'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/80">
                    <span className="text-gold-2">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=starter" className="block text-center border border-hairline text-ink rounded-pill py-2.5 text-sm font-medium hover:border-ink transition-colors">
                Mulai Starter
              </Link>
            </div>

            {/* VIP */}
            <div className="border-2 border-gold rounded-2xl p-6 relative shadow-brand">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs px-3 py-1 rounded-pill font-bold">PALING POPULER</div>
              <div className="text-sm font-semibold text-gold-2 mb-1">VIP</div>
              <div className="text-3xl font-semibold text-ink mb-1">Rp149K</div>
              <div className="text-sm text-muted mb-6">per bulan</div>
              <ul className="space-y-3 mb-8">
                {['50 chat AI per hari', 'Semua fitur Starter', 'Kalender Beasiswa & IELTS Tracker', 'CV Analyzer 3x/bulan'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink/80">
                    <span className="text-gold-2">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=vip" className="block text-center bg-gold hover:bg-gold-2 text-navy rounded-pill py-2.5 text-sm font-semibold transition-colors">
                Mulai VIP
              </Link>
            </div>

            {/* VVIP */}
            <div className="border border-navy rounded-2xl p-6 bg-navy">
              <div className="text-sm font-medium text-white/60 mb-1">VVIP</div>
              <div className="text-3xl font-semibold text-white mb-1">Rp240K</div>
              <div className="text-sm text-white/50 mb-6">per bulan</div>
              <ul className="space-y-3 mb-8">
                {['Unlimited chat', 'Semua fitur VIP', 'Essay Workshop + kritik AI GALI DIRI', 'CV Analyzer unlimited'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <span className="text-gold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=vvip" className="block text-center bg-white hover:bg-off text-navy rounded-pill py-2.5 text-sm font-semibold transition-colors">
                Mulai VVIP
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-off">
        <div className="max-w-4xl mx-auto">
          <TestimonialCarousel title="Yang sudah membuktikan hasilnya" />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-12">Pertanyaan yang sering muncul</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="border border-hairline rounded-2xl group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-medium text-ink flex items-center justify-between">
                  {faq.q}
                  <span className="text-muted group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-navy">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-3">Siap mulai perjalanan beasiswamu?</h2>
          <p className="text-white/70 mb-8">Gratis 5 pertanyaan per hari. Tidak perlu kartu kredit.</p>
          <Link href="/register" className="inline-block bg-gold hover:bg-gold-2 text-navy font-semibold px-8 py-3.5 rounded-pill transition-colors">
            Coba Sekarang — Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-hairline bg-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-navy flex items-center justify-center text-white text-xs font-bold">A</div>
            <span className="text-sm text-muted">Awardee.id © 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-muted">
            <a href="https://www.youtube.com/@awardeeid" target="_blank" rel="noopener noreferrer" className="hover:text-ink">YouTube</a>
            <Link href="/login" className="hover:text-ink">Masuk</Link>
            <Link href="/register" className="hover:text-ink">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
