import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hak Cipta & DMCA | AWARDEE APP',
  description: 'Informasi hak cipta dan cara melaporkan pelanggaran konten di AWARDEE APP.',
}

export default function CopyrightPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-8">
        <Link href="/" className="text-sm text-gold-2 hover:underline">← Kembali ke Beranda</Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">Hak Cipta & Pelanggaran Konten</h1>
        <p className="text-sm text-gray-400 mb-8">Terakhir diperbarui: Juni 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Kepemilikan Konten</h2>
            <p>
              Semua konten orisinal di AWARDEE APP — termasuk teks, desain, metode bimbingan, sistem prompt AI,
              panduan beasiswa, dan materi edukatif — dilindungi oleh hak cipta dan merupakan milik
              AWARDEE APP / Awardee.id.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Konten Pengguna</h2>
            <p>
              Anda mempertahankan hak milik atas semua konten yang Anda unggah (CV, essay, dokumen pribadi).
              Dengan mengunggah konten tersebut, Anda memberikan kami lisensi terbatas untuk memprosesnya
              melalui AI guna menyediakan layanan platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Melaporkan Pelanggaran</h2>
            <p>
              Jika Anda yakin konten di platform kami melanggar hak cipta Anda, silakan kirimkan laporan ke:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-3">
              <p className="font-medium text-gray-900">Email: yusri.ramadhana88@gmail.com</p>
              <p className="text-sm text-gray-600 mt-1">Subject: [DMCA] Laporan Pelanggaran Hak Cipta</p>
            </div>
            <p>Laporan harus menyertakan:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identitas pemilik hak cipta</li>
              <li>Deskripsi karya yang diklaim dilanggar</li>
              <li>URL atau lokasi konten yang melanggar di platform kami</li>
              <li>Pernyataan bahwa laporan ini akurat dan dibuat dengan itikad baik</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Tindakan Kami</h2>
            <p>
              Kami akan meninjau setiap laporan yang masuk dan mengambil tindakan yang sesuai, termasuk
              menghapus konten yang terbukti melanggar, dalam waktu 7 hari kerja.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
