import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ | AWARDEE APP',
  description: 'Pertanyaan yang sering diajukan tentang AWARDEE APP, beasiswa, dan mentoring Den Dhana.',
}

const faqs = [
  {
    q: 'Apakah AWARDEE APP menjamin saya lolos beasiswa?',
    a: 'Tidak. Kami menyediakan alat dan bimbingan untuk meningkatkan kualitas aplikasi Anda, namun keputusan penerimaan sepenuhnya ada di tangan lembaga beasiswa. Lihat Disclaimer kami untuk detail lebih lanjut.',
  },
  {
    q: 'Apa perbedaan paket Free, Kopi, Starter, dan Pro?',
    a: 'Free: 5 chat AI/hari, tanpa fitur lain. Kopi (Rp25K/bulan): 20 chat/hari + Learning Modules, Scholarship Tracker, Checklist Dokumen, dan Achievements. Starter (Rp99K/bulan): 50 chat/hari + semua fitur Kopi + Kalender Beasiswa, IELTS Tracker, CV Analyzer (3x/bulan). Pro (Rp249K/bulan): unlimited chat + semua fitur Starter + CV Analyzer unlimited + Essay Workshop GALI DIRI unlimited.',
  },
  {
    q: 'Bagaimana cara upgrade ke Kopi, Starter, atau Pro?',
    a: 'Buka menu Overview di Dashboard, scroll ke bagian "Upgrade Paket", klik link checkout sesuai paket yang diinginkan. Setelah pembayaran, konfirmasi via WhatsApp ke DenDhana untuk aktivasi manual.',
  },
  {
    q: 'Apakah ada refund jika saya tidak puas?',
    a: 'Layanan digital bersifat non-refundable setelah digunakan. Jika ada masalah teknis, hubungi kami dalam 24 jam setelah transaksi.',
  },
  {
    q: 'Apa itu mentoring privat Den Dhana?',
    a: '4 sesi × 1 jam intensif @ Rp7.500.000. Mencakup: review profil lengkap, strategi personal beasiswa, persiapan wawancara, dan panduan dokumen. Hubungi via WhatsApp untuk jadwal.',
  },
  {
    q: 'Apakah AI Den Dhana bisa membantu beasiswa selain AAS?',
    a: 'Ya! Platform mendukung AAS, LPDP, Chevening, GKS, dan beasiswa internasional lainnya. AI dilatih dengan pengetahuan umum beasiswa, meski spesialisasi utama adalah AAS.',
  },
  {
    q: 'Bagaimana cara bergabung program afiliasi?',
    a: 'Login ke dashboard, buka menu "Afiliasi & Komisi", klik tombol Daftar Jadi Afiliasi. Anda akan mendapatkan kode referral unik dan mulai mendapatkan komisi 20% dari setiap konversi.',
  },
  {
    q: 'Data saya aman?',
    a: 'Ya. Data disimpan di Supabase dengan enkripsi dan Row Level Security — hanya Anda yang dapat mengakses data Anda sendiri. Kami tidak menjual data ke pihak ketiga.',
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-8">
        <Link href="/" className="text-sm text-gold-2 hover:underline">← Kembali ke Beranda</Link>

        <h1 className="text-3xl font-bold text-ink mt-6 mb-2">Pertanyaan Umum (FAQ)</h1>
        <p className="text-sm text-muted mb-8">Terakhir diperbarui: Juni 2026</p>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group border border-hairline rounded-xl">
              <summary className="px-5 py-4 cursor-pointer font-medium text-ink flex items-center justify-between text-sm">
                {faq.q}
                <span className="text-muted group-open:rotate-180 transition-transform flex-shrink-0 ml-3">▾</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>

        <div className="mt-8 bg-off border border-gold rounded-xl p-5">
          <p className="text-sm text-ink">
            Masih ada pertanyaan? Kunjungi <Link href="/contact" className="text-gold-2 font-medium hover:underline">halaman kontak</Link> kami atau chat langsung dengan AI Den Dhana di platform.
          </p>
        </div>
      </div>
    </div>
  )
}
