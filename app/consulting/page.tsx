'use client'

const SERVICES = [
  {
    icon: '🔍',
    title: 'Pelatihan & Konsultasi Auditing',
    desc: 'Program pelatihan audit internal, audit kinerja, dan audit laporan keuangan sesuai standar BPKP, BPK, dan APIP untuk instansi pemerintah dan BUMN/BUMD.',
    items: ['Audit Internal & Operasional', 'Audit Kinerja Pemerintahan', 'Reviu Laporan Keuangan BLUD/BLU', 'Penguatan APIP Pemda'],
  },
  {
    icon: '⚖️',
    title: 'Pelatihan & Konsultasi Hukum',
    desc: 'Layanan konsultasi dan pelatihan hukum pemerintahan, peraturan daerah, pengadaan barang/jasa, dan kepatuhan regulasi bagi aparatur sipil negara.',
    items: ['Hukum Pemerintahan Daerah', 'Regulasi Pengadaan Barang/Jasa', 'Penyusunan Perda & Perkades', 'Kepatuhan Hukum BUMN/BUMD'],
  },
  {
    icon: '📊',
    title: 'Pelatihan & Konsultasi Akuntansi',
    desc: 'Pendampingan penyusunan laporan keuangan berbasis SAP, SAK, dan SAK ETAP untuk pemerintah daerah, desa, BUMN, dan BUMD menuju opini WTP.',
    items: ['Akuntansi Pemerintahan (SAP)', 'Penyusunan Laporan Keuangan Desa', 'Akuntansi BUMN/BUMD (SAK/IFRS)', 'Pendampingan Raih Opini WTP'],
  },
  {
    icon: '🧾',
    title: 'Pelatihan & Konsultasi Perpajakan',
    desc: 'Solusi perpajakan komprehensif untuk instansi pemerintah, BUMN, dan BUMD, mencakup pelatihan pajak daerah, PPN, PPh, dan kepatuhan fiskal.',
    items: ['Pajak Daerah & Retribusi', 'PPh Pasal 21/22/23 Instansi Pemerintah', 'PPN & Pelaporan SPT', 'Tax Review & Tax Planning BUMN/BUMD'],
  },
]

const CLIENTS = [
  { icon: '🏛️', name: 'Pemerintah Daerah', desc: 'Dinas, Badan, OPD Provinsi & Kabupaten/Kota' },
  { icon: '🏘️', name: 'Pemerintah Desa', desc: 'Pengelolaan Dana Desa & BUMDes' },
  { icon: '🏢', name: 'BUMN & Anak Perusahaan', desc: 'Perusahaan milik negara & entitas afiliasi' },
  { icon: '🏬', name: 'BUMD & BLUD', desc: 'Perusda, PDAM, BPD, RSUD, dan lainnya' },
  { icon: '🎓', name: 'Instansi Pendidikan', desc: 'Perguruan Tinggi Negeri & sekolah pemerintah' },
  { icon: '📋', name: 'Lembaga/Komisi Negara', desc: 'KPK, BPK, BPKP, OJK, dan lembaga lainnya' },
]

const STATS = [
  { num: '500+', label: 'Peserta Pelatihan per Tahun' },
  { num: '50+', label: 'Instansi Pemerintah Terlayani' },
  { num: '15+', label: 'Tenaga Ahli Berpengalaman' },
  { num: '10+', label: 'Tahun Pengalaman di Sektor Publik' },
]

const TEAM = [
  { name: 'Dr. Ahmad Fauzi, Ak., CA', role: 'Direktur Utama & Ahli Akuntansi Sektor Publik', exp: 'Mantan Auditor BPK RI, 20 tahun pengalaman' },
  { name: 'Dra. Sri Wahyuni, S.H., M.H.', role: 'Direktur Hukum & Regulasi', exp: 'Praktisi hukum pemerintahan, konsultan Kemendagri' },
  { name: 'Ir. Budi Santoso, M.Ak., CPA', role: 'Kepala Divisi Audit & Perpajakan', exp: 'Ex-BPKP, spesialis audit kinerja & pajak daerah' },
]

const FAQS = [
  { q: 'Apakah pelatihan dapat dilaksanakan secara in-house di instansi kami?', a: 'Ya. Kami menyediakan layanan pelatihan in-house yang disesuaikan dengan kebutuhan, jadwal, dan lokasi instansi Anda, baik di kantor pusat maupun daerah seluruh Indonesia.' },
  { q: 'Apakah konsultan kami bersertifikat dan berpengalaman di sektor publik?', a: 'Seluruh tenaga ahli kami memiliki sertifikasi profesional (CA, CPA, CIA, CGAP) dan pengalaman langsung di BPK, BPKP, Kemenkeu, serta instansi pemerintah dan BUMN/BUMD.' },
  { q: 'Bagaimana mekanisme penugasan konsultasi untuk Pemda?', a: 'Penugasan dapat melalui mekanisme pengadaan langsung, pemilihan langsung, atau tender sesuai Perpres 16/2018 dan perubahannya. Kami siap membantu proses administrasinya.' },
  { q: 'Apakah ada program khusus untuk Pemerintah Desa?', a: 'Ada. Kami memiliki program "Desa Akuntabel" khusus untuk pendampingan pengelolaan Dana Desa, pelatihan BUMDes, dan penyusunan laporan keuangan desa berbasis Permendesa.' },
]

export default function ConsultingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-800 flex items-center justify-center text-white font-bold text-xs">JAI</div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">PT Juris Auditama Indonesia</div>
              <div className="text-xs text-gray-400">Audit · Hukum · Akuntansi · Perpajakan</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#layanan" className="hover:text-blue-800 transition-colors">Layanan</a>
            <a href="#klien" className="hover:text-blue-800 transition-colors">Klien</a>
            <a href="/business-plan" className="hover:text-blue-800 transition-colors">Business Plan</a>
            <a href="/proposal" className="hover:text-blue-800 transition-colors">Proposal</a>
            <a href="#kontak" className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg transition-colors">Hubungi Kami</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-100 px-4 py-1.5 rounded-full text-sm mb-6 border border-white/20">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            Perusahaan Konsultasi & Pelatihan Sektor Publik
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            PT Juris Auditama Indonesia
          </h1>
          <p className="text-xl text-yellow-300 font-semibold mb-6 italic">"Juris Auditoris — Hukum & Audit sebagai Fondasi Tata Kelola"</p>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Mitra strategis Pemda, Pemerintah Desa, BUMN, dan BUMD dalam penyelenggaraan pelatihan dan konsultasi di bidang <strong className="text-white">Auditing, Hukum, Akuntansi, dan Perpajakan</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#layanan" className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-8 py-3.5 rounded-xl transition-colors text-base">
              Lihat Layanan Kami
            </a>
            <a href="/proposal" className="border-2 border-white/40 hover:border-white text-white px-8 py-3.5 rounded-xl font-semibold transition-colors text-base">
              Unduh Proposal
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-blue-900">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-yellow-400">{s.num}</div>
              <div className="text-blue-200 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Profil Singkat */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">Tentang Perusahaan</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">Berdiri untuk Memperkuat Tata Kelola Sektor Publik Indonesia</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                PT Juris Auditama Indonesia (JAI) adalah Perseroan Terbatas yang bergerak di bidang jasa konsultasi dan penyelenggaraan pelatihan profesional, secara khusus melayani instansi pemerintah pusat dan daerah, pemerintah desa, BUMN, BUMD, serta lembaga negara lainnya.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Nama <strong>Juris</strong> mencerminkan keahlian di bidang hukum dan yurisprudensi, sementara <strong>Auditama</strong> menegaskan komitmen pada audit berkualitas utama. Bersama, keduanya mewakili dua pilar tata kelola pemerintahan yang baik.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Bidang Usaha', value: 'Konsultasi & Pelatihan' },
                  { label: 'Bentuk Badan', value: 'Perseroan Terbatas (PT)' },
                  { label: 'Fokus Klien', value: 'Sektor Publik & BUMN/BUMD' },
                  { label: 'Cakupan', value: 'Seluruh Indonesia' },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                    <div className="text-sm font-semibold text-gray-800">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-5">Visi & Misi</h3>
              <div className="mb-6">
                <div className="text-blue-700 font-semibold text-sm mb-2">VISI</div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Menjadi perusahaan konsultasi dan pelatihan terkemuka di Indonesia yang dipercaya oleh instansi pemerintah dan BUMN/BUMD dalam mewujudkan tata kelola keuangan yang akuntabel, transparan, dan berintegritas.
                </p>
              </div>
              <div>
                <div className="text-blue-700 font-semibold text-sm mb-2">MISI</div>
                <ul className="space-y-2">
                  {[
                    'Menyelenggarakan pelatihan berkualitas yang relevan dengan regulasi terkini',
                    'Memberikan konsultasi profesional berbasis pengalaman lapangan nyata',
                    'Mendampingi instansi menuju opini WTP dan tata kelola yang baik',
                    'Meningkatkan kapasitas SDM aparatur di bidang audit, hukum, akuntansi, dan pajak',
                  ].map((m) => (
                    <li key={m} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-600 mt-0.5 shrink-0">✦</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-gray-50" id="layanan">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">Layanan Unggulan</div>
            <h2 className="text-3xl font-bold text-gray-900">4 Bidang Keahlian Inti</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">Solusi pelatihan dan konsultasi yang komprehensif, terstruktur, dan sesuai regulasi terbaru.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl p-7 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">{s.desc}</p>
                <ul className="space-y-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="py-20 px-4" id="klien">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">Segmen Klien</div>
            <h2 className="text-3xl font-bold text-gray-900">Siapa yang Kami Layani?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {CLIENTS.map((c) => (
              <div key={c.name} className="text-center p-6 rounded-2xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all">
                <div className="text-4xl mb-3">{c.icon}</div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{c.name}</div>
                <div className="text-xs text-gray-400">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tim Ahli */}
      <section className="py-20 px-4 bg-blue-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-yellow-400 font-semibold text-sm uppercase tracking-wider mb-3">Tim Kami</div>
            <h2 className="text-3xl font-bold text-white">Tenaga Ahli Berpengalaman</h2>
            <p className="text-blue-200 mt-3">Praktisi dengan rekam jejak nyata di instansi pemerintah dan sektor publik</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TEAM.map((t) => (
              <div key={t.name} className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-blue-900 font-bold text-xl mx-auto mb-4">
                  {t.name.split(' ')[1]?.[0] ?? t.name[0]}
                </div>
                <div className="font-bold text-white text-sm mb-1">{t.name}</div>
                <div className="text-blue-200 text-xs mb-3">{t.role}</div>
                <div className="text-blue-300 text-xs italic">{t.exp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</div>
            <h2 className="text-2xl font-bold text-gray-900">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="border border-gray-200 rounded-xl group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-medium text-gray-900 flex items-center justify-between">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Kontak */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-900 to-blue-800" id="kontak">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Siap Berkolaborasi?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Hubungi kami untuk konsultasi awal secara gratis. Tim kami siap mendiskusikan kebutuhan pelatihan dan konsultasi instansi Anda.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '📞', label: 'Telepon', val: '(021) 1234-5678' },
              { icon: '📧', label: 'Email', val: 'info@jurisauditama.co.id' },
              { icon: '📍', label: 'Kantor', val: 'Jakarta Selatan, DKI Jakarta' },
            ].map((c) => (
              <div key={c.label} className="bg-white/10 border border-white/20 rounded-xl p-4">
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-blue-200 text-xs mb-1">{c.label}</div>
                <div className="text-white text-sm font-medium">{c.val}</div>
              </div>
            ))}
          </div>
          <a
            href="mailto:info@jurisauditama.co.id"
            className="inline-block bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-10 py-4 rounded-xl transition-colors text-base"
          >
            Kirim Pesan Sekarang
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-blue-950 border-t border-blue-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center text-blue-900 font-black text-xs">JAI</div>
            <div>
              <div className="text-white font-semibold text-sm">PT Juris Auditama Indonesia</div>
              <div className="text-blue-400 text-xs">Audit · Hukum · Akuntansi · Perpajakan</div>
            </div>
          </div>
          <div className="text-blue-400 text-xs text-center">
            © 2026 PT Juris Auditama Indonesia. Semua hak dilindungi undang-undang.
          </div>
          <div className="flex gap-5 text-sm text-blue-400">
            <a href="#layanan" className="hover:text-white transition-colors">Layanan</a>
            <a href="/business-plan" className="hover:text-white transition-colors">Business Plan</a>
            <a href="/proposal" className="hover:text-white transition-colors">Proposal</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
