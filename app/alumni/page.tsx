'use client'

import Link from 'next/link'

const BENEFITS = [
  {
    icon: '🌐',
    title: 'Komunitas Lintas Beasiswa',
    desc: 'Terhubung dengan alumni Awardee.id lain dari berbagai beasiswa — AAS, LPDP, Chevening, GKS, dan lainnya — yang sama-sama pernah melewati proses yang kamu lewati.',
  },
  {
    icon: '📈',
    title: 'Kontribusimu Tercatat & Berdampak',
    desc: 'Setiap sesi mentoring, webinar, atau referral yang kamu berikan dicatat di dashboard-mu dan menjadi bagian dari statistik dampak Yayasan Awardee Alumni.',
  },
  {
    icon: '🤝',
    title: 'Ikut Membentuk Generasi Berikutnya',
    desc: 'Jadi mentor bagi pejuang beasiswa generasi selanjutnya — persis seperti yang dulu kamu butuhkan saat memulai.',
  },
  {
    icon: '🎓',
    title: 'Pengakuan Resmi sebagai Alumni',
    desc: 'Profil alumni terverifikasi di dashboard Awardee.id, setelah tim kami review pengajuanmu.',
  },
]

export default function AlumniLandingPage() {
  return (
    <div className="min-h-screen bg-off">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur border-b border-hairline shadow-[inset_0_-3px_0_theme(colors.gold.DEFAULT)] z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-ink tracking-tight">Awardee<span className="text-gold-2">.id</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login?next=/dashboard/alumni" className="text-sm text-muted hover:text-ink transition-colors">Masuk</Link>
            <Link href="/register?next=/dashboard/alumni" className="text-sm bg-gold hover:bg-gold-2 text-navy font-semibold px-4 py-2 rounded-pill transition-colors">Daftar Jadi Alumni</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-[100px] pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold text-navy font-bold text-xs tracking-wide px-4 py-2 rounded-pill mb-6">
            🎓 Awardee Alumni Initiative
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-ink leading-[1.1] mb-6">
            Sudah Lolos Beasiswa Lewat Awardee.id?<br />
            <span className="bg-gold px-1 rounded box-decoration-clone">Saatnya Berkontribusi Balik.</span>
          </h1>
          <p className="text-lg text-muted leading-relaxed max-w-xl mx-auto mb-9">
            Gabung jadi Awardee Alumni dan ikut mewujudkan <strong className="text-ink">#IndonesiaGoesGlobal</strong> —
            makin banyak alumni yang turun tangan, makin banyak calon awardee berikutnya yang terbantu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?next=/dashboard/alumni" className="bg-gold hover:bg-gold-2 text-navy px-8 py-3.5 rounded-pill font-semibold transition-colors text-base text-center shadow-brand">
              Daftar Jadi Awardee Alumni
            </Link>
            <Link href="/login?next=/dashboard/alumni" className="border border-hairline hover:border-ink bg-white/70 backdrop-blur text-ink px-8 py-3.5 rounded-pill font-semibold transition-colors text-base text-center">
              Sudah Punya Akun? Masuk
            </Link>
          </div>
          <p className="text-xs text-muted mt-4">Pengajuan direview singkat oleh tim kami sebelum akun alumni-mu aktif.</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-2">Kenapa Gabung Jadi Alumni?</h2>
          <p className="text-center text-muted mb-12">Bukan cuma status — ini cara kamu terus terhubung dan berdampak.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-off rounded-2xl p-6 border border-hairline">
                <div className="text-2xl mb-3">{b.icon}</div>
                <h3 className="font-semibold text-ink mb-1.5">{b.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-off">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-ink tracking-tight mb-12">Cara Bergabung</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Daftar & Ajukan', desc: 'Buat akun, lalu isi form singkat: beasiswa apa yang kamu dapat, universitas, dan ceritamu.' },
              { step: '2', title: 'Direview Tim Kami', desc: 'Kami verifikasi pengajuanmu — biasanya cepat, tidak perlu menunggu lama.' },
              { step: '3', title: 'Mulai Berkontribusi', desc: 'Setelah disetujui, dashboard alumni-mu aktif — mulai catat mentoring, webinar, atau referral yang kamu berikan.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-navy text-gold font-bold flex items-center justify-center mx-auto mb-3">{s.step}</div>
                <h3 className="font-semibold text-ink mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-navy">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-3">Siap jadi bagian dari #IndonesiaGoesGlobal?</h2>
          <p className="text-white/70 mb-8">Daftar dalam hitungan menit — tim kami review secepatnya.</p>
          <Link href="/register?next=/dashboard/alumni" className="inline-block bg-gold hover:bg-gold-2 text-navy font-semibold px-8 py-3.5 rounded-pill transition-colors">
            Daftar Jadi Awardee Alumni
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
            <a href="https://alumni.awardee.id" target="_blank" rel="noopener noreferrer" className="hover:text-ink">Yayasan Awardee Alumni (CSR)</a>
            <Link href="/" className="hover:text-ink">Kembali ke Beranda</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
