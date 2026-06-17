import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | AWARDEE APP',
  description: 'Syarat dan ketentuan penggunaan layanan AWARDEE APP.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-8">
        <Link href="/" className="text-sm text-sky-600 hover:underline">← Kembali ke Beranda</Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">Syarat & Ketentuan</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: Juni 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Penerimaan Syarat</h2>
            <p>Dengan menggunakan AWARDEE APP, Anda menyetujui syarat dan ketentuan ini secara keseluruhan. Jika Anda tidak setuju, harap tidak menggunakan layanan kami.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Penggunaan yang Diizinkan</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Platform ini untuk penggunaan pribadi non-komersial dalam mempersiapkan aplikasi beasiswa</li>
              <li>Dilarang membagikan akun, menjual kembali akses, atau menggunakan bot untuk mengakses layanan</li>
              <li>Konten yang Anda masukkan harus merupakan karya/data Anda sendiri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Kebijakan Pembayaran & Pengembalian Dana</h2>
            <p>
              Semua produk digital (akses platform, analisis AI) bersifat <strong>non-refundable</strong> setelah
              layanan digunakan. Jika Anda mengalami masalah teknis yang mencegah penggunaan layanan, hubungi kami
              dalam 24 jam untuk evaluasi kasus per kasus.
            </p>
            <p>
              Subscription bersifat bulanan dan tidak diperbarui otomatis — pembayaran dilakukan manual melalui
              link checkout yang diberikan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Kekayaan Intelektual</h2>
            <p>
              Seluruh konten platform (desain, kode, metode GALI DIRI, sistem prompt AI, panduan beasiswa)
              adalah milik AWARDEE APP / Awardee.id dan dilindungi hak cipta. Dilarang menyalin,
              mendistribusikan, atau mengkomersialkan tanpa izin tertulis.
            </p>
            <p>Konten yang Anda buat di platform (essay, CV) tetap menjadi hak milik Anda.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Penghentian Layanan</h2>
            <p>
              Kami berhak menangguhkan akun yang melanggar syarat ini tanpa pemberitahuan sebelumnya.
              Kami juga berhak mengubah, menangguhkan, atau menghentikan layanan kapan saja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Hukum yang Berlaku</h2>
            <p>Syarat ini diatur oleh hukum Republik Indonesia.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
