import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Disclaimer | AWARDEE APP',
  description: 'Penting: AWARDEE APP tidak memberikan jaminan atau garansi kelulusan beasiswa apapun.',
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-8">
        <Link href="/" className="text-sm text-gold-2 hover:underline">← Kembali ke Beranda</Link>

        <h1 className="text-3xl font-bold text-ink mt-6 mb-2">Disclaimer</h1>
        <p className="text-sm text-muted mb-8">Terakhir diperbarui: Juni 2026</p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <p className="text-amber-800 font-semibold text-sm">
            ⚠️ AWARDEE APP tidak memberikan jaminan atau garansi kelulusan beasiswa apapun.
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-ink leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Tidak Ada Jaminan Kelulusan</h2>
            <p>
              Seluruh layanan yang tersedia di AWARDEE APP — termasuk analisis CV, kritik essay, simulasi wawancara,
              rekomendasi beasiswa, dan chat AI — bersifat <strong>edukatif dan informatif semata</strong>.
              Penggunaan layanan kami tidak menjamin atau menjanjikan keberhasilan dalam proses seleksi beasiswa manapun.
            </p>
            <p>
              Keputusan penerimaan beasiswa sepenuhnya berada di tangan lembaga pemberi beasiswa (AAS, LPDP,
              Chevening, GKS, dll.) dan ditentukan oleh banyak faktor di luar kendali kami, termasuk namun
              tidak terbatas pada: kualitas dokumen, pengalaman akademis, latar belakang profesional, hasil
              wawancara, dan kebijakan internal lembaga yang dapat berubah sewaktu-waktu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Ketepatan Informasi AI</h2>
            <p>
              Respons yang dihasilkan oleh AI (Den Dhana) berdasarkan data pelatihan yang memiliki batas waktu.
              Informasi tentang persyaratan beasiswa, tenggat waktu, dan prosedur seleksi dapat berubah.
              Selalu verifikasi informasi terbaru langsung dari sumber resmi lembaga beasiswa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Tanggung Jawab Pengguna</h2>
            <p>
              Pengguna bertanggung jawab penuh atas keputusan yang diambil berdasarkan rekomendasi atau
              feedback dari platform ini. AWARDEE APP, pemilik, dan kontributornya tidak bertanggung jawab
              atas kerugian apapun yang timbul dari penggunaan layanan ini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink mb-3">Sumber Data</h2>
            <p>
              AI kami tidak mengakses atau merepresentasikan data internal beasiswa yang tidak dipublikasikan.
              Semua analisis berbasis pengetahuan umum yang tersedia secara publik dan pengalaman mentor.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
