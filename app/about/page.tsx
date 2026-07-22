import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tentang AWARDEE APP | Platform Persiapan Beasiswa',
  description: 'AWARDEE APP adalah platform AI untuk mempersiapkan aplikasi beasiswa internasional — AAS, LPDP, Chevening, GKS. Dibuat oleh Den Dhana, awardee AAS & mentor beasiswa berpengalaman.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-8">
        <Link href="/" className="text-sm text-gold-2 hover:underline">← Kembali ke Beranda</Link>

        <h1 className="text-3xl font-bold text-ink mt-6 mb-2">Tentang AWARDEE APP</h1>
        <p className="text-sm text-muted mb-8">Terakhir diperbarui: Juni 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-ink leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Apa itu AWARDEE APP?</h2>
            <p>
              AWARDEE APP adalah platform digital berbasis AI yang dirancang untuk membantu calon pelamar beasiswa
              internasional — khususnya AAS (Australia Awards Scholarship), LPDP, Chevening, dan GKS —
              dalam mempersiapkan diri secara komprehensif dan terstruktur.
            </p>
            <p>
              Platform ini menggabungkan kekuatan kecerdasan buatan dengan metode bimbingan khas <strong>Den Dhana</strong>,
              mentor beasiswa yang telah membantu puluhan kandidat lolos ke universitas terbaik dunia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Siapa Den Dhana?</h2>
            <p>
              <strong>Den Dhana</strong> (nama pena) adalah seorang auditor di Badan Pemeriksa Keuangan Republik Indonesia
              dan penerima beasiswa Australia Awards Scholarship (AAS). Dengan pengalaman langsung sebagai awardee
              dan mentor, Den Dhana mengembangkan metode <em>GALI DIRI</em> — sebuah pendekatan sistematis untuk menggali
              potensi akademis dan non-akademis kandidat, membangun narasi beasiswa yang kuat, dan meningkatkan
              peluang lolos seleksi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Fitur Utama</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chat AI Den Dhana — konsultasi strategi beasiswa kapan saja</li>
              <li>CV Analyzer — analisis kekuatan CV untuk standar beasiswa internasional</li>
              <li>Essay Workshop (GALI DIRI) — kritik essay mendalam berbasis AI</li>
              <li>Scholarship Tracker — pantau progres setiap tahap aplikasi</li>
              <li>IELTS & Test Score Tracker — catat dan pantau progres skor bahasa</li>
              <li>Kalender Beasiswa — semua deadline penting dalam satu tampilan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Mentoring Privat</h2>
            <p>
              Selain layanan digital, Den Dhana menawarkan sesi mentoring privat intensif:
              <strong> 4 sesi × 1 jam @ Rp 7.500.000</strong>. Sesi ini mencakup review lengkap profil,
              strategi personal, hingga persiapan wawancara. Hubungi kami untuk informasi lebih lanjut.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Kontak</h2>
            <p>
              Untuk pertanyaan umum, kemitraan, atau pendaftaran mentoring, silakan kunjungi{' '}
              <Link href="/contact" className="text-gold-2 hover:underline">halaman kontak</Link> kami.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
