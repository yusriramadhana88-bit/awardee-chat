import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | AWARDEE APP',
  description: 'Bagaimana AWARDEE APP mengumpulkan, menggunakan, dan melindungi data pribadi pengguna.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-8">
        <Link href="/" className="text-sm text-gold-2 hover:underline">← Kembali ke Beranda</Link>

        <h1 className="text-3xl font-bold text-ink mt-6 mb-2">Kebijakan Privasi</h1>
        <p className="text-sm text-muted mb-8">Terakhir diperbarui: Juni 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-ink leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Data yang Kami Kumpulkan</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Akun:</strong> nama, alamat email, nomor WhatsApp (untuk verifikasi)</li>
              <li><strong>Konten pengguna:</strong> CV, essay, skor tes, rencana beasiswa yang Anda masukkan secara sukarela</li>
              <li><strong>Data penggunaan:</strong> riwayat chat, analisis CV/essay, aktivitas di platform</li>
              <li><strong>Data pembayaran:</strong> status subscription; detail kartu diproses oleh gateway payment (Xendit/Stripe) dan tidak disimpan oleh kami</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Bagaimana Kami Menggunakan Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menyediakan dan meningkatkan layanan platform</li>
              <li>Memproses analisis AI atas konten yang Anda kirimkan</li>
              <li>Mengelola akun dan subscription Anda</li>
              <li>Komunikasi terkait layanan (email transaksi, notifikasi penting)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Berbagi Data</h2>
            <p>
              Kami <strong>tidak menjual</strong> data pribadi Anda kepada pihak ketiga. Data hanya dibagikan kepada:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Anthropic/OpenAI:</strong> konten chat/essay/CV dikirim untuk diproses AI (sesuai kebijakan privasi masing-masing provider)</li>
              <li><strong>Supabase:</strong> penyimpanan data terenkripsi di server mereka</li>
              <li><strong>Gateway payment:</strong> data transaksi untuk proses pembayaran</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Penyimpanan & Keamanan</h2>
            <p>
              Data disimpan di server Supabase dengan enkripsi standar industri. Kami menerapkan Row Level Security (RLS)
              sehingga setiap pengguna hanya dapat mengakses data mereka sendiri.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Hak Anda</h2>
            <p>Anda berhak untuk mengakses, mengkoreksi, atau menghapus data pribadi Anda. Hubungi kami melalui <Link href="/contact" className="text-gold-2 hover:underline">halaman kontak</Link> untuk permintaan tersebut.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
