import Link from 'next/link'
import { TIER_LABEL, TIER_COLOR } from '@/lib/tier'
import { PRICING_GROUPS } from '@/lib/payment-links'
import { BOT_LIST } from '@/lib/bots'

export const metadata = {
  title: 'Demo AWARDEE APP — Lihat Semua Fitur Sebelum Daftar | Awardee.id',
  description: 'Intip semua fitur dashboard AWARDEE APP — 3 chatbot AI, Learning Modules, Scholarship Tracker, dan lainnya — sebelum daftar. Bandingkan paket & bayar langsung via lynk.id.',
}

const FEATURES: { icon: string; title: string; desc: string; tier: 'starter' | 'vip' | 'vvip' | null }[] = [
  { icon: '📚', title: 'Learning Modules', desc: 'Materi #GaliDiri, essay, sampai interview + kuis', tier: 'starter' },
  { icon: '📋', title: 'Scholarship Tracker', desc: 'Pantau progres tiap tahapan aplikasi beasiswamu', tier: 'starter' },
  { icon: '✅', title: 'Checklist Dokumen', desc: 'Daftar dokumen wajib per jenis beasiswa', tier: 'starter' },
  { icon: '🏆', title: 'Achievements', desc: 'Kumpulkan badge sepanjang progres persiapanmu', tier: 'starter' },
  { icon: '📅', title: 'Kalender Beasiswa', desc: 'Semua deadline penting dalam satu tampilan', tier: 'vip' },
  { icon: '🎯', title: 'IELTS Tracker', desc: 'Catat skor & pantau progres menuju target', tier: 'vip' },
  { icon: '📄', title: 'CV Analyzer', desc: 'Analisis kekuatan CV untuk aplikasi beasiswa', tier: 'vip' },
  { icon: '✏️', title: 'Essay Workshop', desc: 'Kelola draft essay & dapatkan kritik AI mendalam', tier: 'vvip' },
]

const FAQS = [
  { q: 'Apa bedanya 3 chatbot AI di Awardee.id?', a: 'Chat CS/Umum bisa diakses siapa saja tanpa daftar — jawab pertanyaan soal Awardee.id, produk, dan strategi beasiswa secara umum. Chat AAS dan Chat LPDP khusus member — fokus penuh pada persiapan mendalam masing-masing beasiswa (essay, interview, dokumen, dll), butuh akun member gratis dulu.' },
  { q: 'Gimana cara bayar membership?', a: 'Klik tombol paket yang kamu mau — kamu akan diarahkan ke halaman pembayaran lynk.id (transfer, e-wallet, QRIS, dll). Setelah bayar, ikuti instruksi di halaman lynk.id untuk kirim bukti pembayaran via WhatsApp.' },
  { q: 'Berapa lama proses aktivasi setelah bayar?', a: 'Aktivasi dilakukan manual oleh tim kami setelah menerima bukti pembayaran via WhatsApp, biasanya selesai dalam waktu kurang dari 24 jam.' },
  { q: 'Apakah saya harus daftar dulu sebelum bayar?', a: 'Tidak wajib — kamu bisa langsung bayar paket yang diinginkan. Tapi supaya tim bisa langsung aktivasi ke akunmu, lebih cepat kalau kamu daftar akun gratis dulu di Awardee.id, lalu sertakan email akun itu saat konfirmasi pembayaran.' },
  { q: 'Bisa upgrade atau downgrade paket kapan saja?', a: 'Bisa. Hubungi tim kami via WhatsApp untuk bantuan upgrade/downgrade paket sesuai kebutuhanmu.' },
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-off">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-hairline z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-ink tracking-tight">Awardee<span className="text-gold-2">.id</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors">Masuk</Link>
            <Link href="/register" className="text-sm bg-gold hover:bg-gold-2 text-navy font-semibold px-4 py-2 rounded-pill transition-colors">Daftar Gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gold text-navy font-bold text-xs tracking-wide px-4 py-2 rounded-pill mb-6">
            DEMO — LIHAT DULU SEBELUM DAFTAR
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink leading-[1.1] mb-5">
            Intip Semua Fitur <span className="bg-gold px-1 rounded box-decoration-clone">AWARDEE APP</span>
          </h1>
          <p className="text-lg text-muted leading-relaxed">
            3 chatbot AI, Learning Modules, Scholarship Tracker, dan lainnya — semua bisa kamu lihat di sini sebelum memutuskan daftar atau upgrade.
          </p>
        </div>
      </section>

      {/* 3 Chatbot cards */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-3">3 Chatbot AI, Masing-Masing Fokus</h2>
          <p className="text-center text-muted mb-12 max-w-lg mx-auto">
            Bukan satu chatbot yang jawab semua hal setengah-setengah — tiap chatbot fokus di perannya sendiri.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {BOT_LIST.map((bot) => (
              <div key={bot.id} className="border border-hairline rounded-2xl p-6 flex flex-col">
                <div className="text-3xl mb-3">{bot.navIcon}</div>
                <h3 className="font-semibold text-ink mb-1">{bot.title}</h3>
                <p className="text-sm text-muted mb-2">{bot.subtitle}</p>
                <p className="text-xs text-muted mb-6 flex-1">
                  {bot.guestAllowed
                    ? 'Bisa dicoba tanpa daftar — gratis, tanpa komitmen.'
                    : 'Khusus member — daftar gratis dulu untuk akses.'}
                </p>
                {bot.guestAllowed ? (
                  <Link href={bot.path} className="block text-center bg-navy hover:bg-navy-2 text-white rounded-pill py-2.5 text-sm font-semibold transition-colors">
                    Coba Sekarang
                  </Link>
                ) : (
                  <Link href={`/register?next=${encodeURIComponent(bot.path)}`} className="block text-center border border-hairline text-ink rounded-pill py-2.5 text-sm font-medium hover:border-ink transition-colors">
                    Daftar untuk Coba
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-3">Semua Menu di Dashboard</h2>
          <p className="text-center text-muted mb-12 max-w-lg mx-auto">
            Ini isi AWARDEE APP setelah kamu daftar — sebagian gratis, sebagian terbuka sesuai paket.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-5 border border-hairline">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-ink text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted mb-3">{f.desc}</p>
                {f.tier && (
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-pill ${TIER_COLOR[f.tier]}`}>
                    {TIER_LABEL[f.tier]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-white" id="pricing">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-3">Pilih Paket yang Sesuai</h2>
          <p className="text-center text-muted mb-12">Bayar langsung via lynk.id — aman dan mudah</p>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_GROUPS.map((group) => (
              <div
                key={group.id}
                className={
                  group.highlighted
                    ? 'border-2 border-gold rounded-2xl p-6 relative shadow-brand'
                    : 'border border-hairline rounded-2xl p-6'
                }
              >
                {group.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs px-3 py-1 rounded-pill font-bold">
                    PALING LENGKAP
                  </div>
                )}
                <div className="text-sm font-semibold text-gold-2 mb-1">{group.label.toUpperCase()}</div>
                <div className="text-3xl font-semibold text-ink mb-1">{group.price}</div>
                <div className="text-sm text-muted mb-2">{group.priceNote}</div>
                <p className="text-xs text-muted mb-6">{group.tagline}</p>
                <ul className="space-y-3 mb-8">
                  {group.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink/80">
                      <span className="text-gold-2 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  {group.cta.external ? (
                    <a href={group.cta.href} target="_blank" rel="noopener noreferrer" className="block text-center bg-navy hover:bg-navy-2 text-white rounded-pill py-2.5 text-sm font-semibold transition-colors">
                      {group.cta.label}
                    </a>
                  ) : (
                    <Link href={group.cta.href} className="block text-center bg-gold hover:bg-gold-2 text-navy rounded-pill py-2.5 text-sm font-semibold transition-colors">
                      {group.cta.label}
                    </Link>
                  )}
                  {group.ctaSecondary && (
                    <a href={group.ctaSecondary.href} target="_blank" rel="noopener noreferrer" className="block text-center border border-hairline text-ink rounded-pill py-2.5 text-sm font-medium hover:border-ink transition-colors">
                      {group.ctaSecondary.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted mt-8 max-w-md mx-auto">
            Setelah bayar via lynk.id, kirim bukti pembayaran + email akunmu ke WhatsApp{' '}
            <a href="https://wa.me/6281287212755" target="_blank" rel="noopener noreferrer" className="text-gold-2 underline">
              +62 812-8721-2755
            </a>{' '}
            — akun diaktivasi manual, biasanya kurang dari 24 jam.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-12">Pertanyaan Seputar Demo & Pembayaran</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="border border-hairline rounded-2xl group bg-white">
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
          <p className="text-white/70 mb-8">Daftar gratis dulu, upgrade kapan kamu siap.</p>
          <Link href="/register" className="inline-block bg-gold hover:bg-gold-2 text-navy font-semibold px-8 py-3.5 rounded-pill transition-colors">
            Daftar Gratis Sekarang
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
            <Link href="/login" className="hover:text-ink">Masuk</Link>
            <Link href="/register" className="hover:text-ink">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
