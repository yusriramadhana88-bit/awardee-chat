'use client'

export default function BusinessPlanPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12px; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Nav */}
      <nav className="no-print fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center text-white font-bold text-xs">JAI</div>
            <span className="font-bold text-gray-900 text-sm">PT Juris Auditama Indonesia</span>
          </div>
          <div className="flex gap-3 text-sm">
            <a href="/consulting" className="text-gray-500 hover:text-gray-800">← Kembali</a>
            <button onClick={() => window.print()} className="bg-blue-800 text-white px-4 py-1.5 rounded-lg hover:bg-blue-900 transition-colors">
              Cetak / PDF
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-20">

        {/* Cover */}
        <div className="text-center mb-16 py-16 border-b-2 border-blue-800">
          <div className="w-20 h-20 rounded-2xl bg-blue-800 flex items-center justify-center text-white font-black text-2xl mx-auto mb-6">JAI</div>
          <h1 className="text-4xl font-black text-blue-900 mb-3">BUSINESS PLAN</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">PT Juris Auditama Indonesia</h2>
          <p className="text-gray-500 text-lg mb-6 italic">"Juris Auditoris — Hukum & Audit sebagai Fondasi Tata Kelola"</p>
          <div className="inline-block bg-blue-50 border border-blue-200 rounded-xl px-8 py-4">
            <p className="text-sm text-gray-600">Perusahaan Konsultasi & Pelatihan Profesional</p>
            <p className="text-sm font-semibold text-gray-800">Bidang: Auditing · Hukum · Akuntansi · Perpajakan</p>
            <p className="text-sm text-gray-500 mt-2">Jakarta, 2026 — Dokumen Rahasia</p>
          </div>
        </div>

        {/* Daftar Isi */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">DAFTAR ISI</h2>
          <div className="space-y-2 text-sm">
            {[
              ['I.', 'Ringkasan Eksekutif'],
              ['II.', 'Profil Perusahaan'],
              ['III.', 'Analisis Pasar'],
              ['IV.', 'Layanan & Produk'],
              ['V.', 'Strategi Pemasaran & Penjualan'],
              ['VI.', 'Struktur Organisasi & SDM'],
              ['VII.', 'Rencana Operasional'],
              ['VIII.', 'Proyeksi Keuangan 5 Tahun'],
              ['IX.', 'Analisis SWOT'],
              ['X.', 'Analisis Risiko & Mitigasi'],
              ['XI.', 'Rencana Pendanaan & Modal Awal'],
            ].map(([no, title]) => (
              <div key={no} className="flex gap-4 py-1 border-b border-dashed border-gray-200">
                <span className="font-semibold text-gray-700 w-8 shrink-0">{no}</span>
                <span className="text-gray-600">{title}</span>
              </div>
            ))}
          </div>
        </section>

        {/* I. Executive Summary */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">I. RINGKASAN EKSEKUTIF</h2>
          <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
            <p className="text-gray-700 leading-relaxed mb-4">
              PT Juris Auditama Indonesia (JAI) adalah perusahaan konsultasi dan pelatihan profesional yang fokus melayani instansi sektor publik Indonesia, meliputi Pemerintah Daerah (Pemda), Pemerintah Desa, Badan Usaha Milik Negara (BUMN), Badan Usaha Milik Daerah (BUMD), serta lembaga dan badan pemerintah lainnya.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Perusahaan ini hadir untuk mengisi kekosongan kebutuhan kapasitas SDM aparatur di bidang <strong>auditing, hukum, akuntansi, dan perpajakan</strong> yang terus meningkat seiring dengan penguatan tata kelola keuangan negara dan daerah.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Target Pasar', val: 'Sektor Publik Indonesia' },
              { label: 'Bidang Usaha', val: 'Konsultasi & Pelatihan' },
              { label: 'Modal Awal', val: 'Rp 2,5 Miliar' },
              { label: 'Target Pendapatan Thn 1', val: 'Rp 3,6 Miliar' },
            ].map((i) => (
              <div key={i.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-xs text-gray-400 mb-1">{i.label}</div>
                <div className="font-bold text-blue-800 text-sm">{i.val}</div>
              </div>
            ))}
          </div>
        </section>

        {/* II. Profil Perusahaan */}
        <section className="mb-12 page-break">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">II. PROFIL PERUSAHAAN</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Identitas Perusahaan</h3>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Nama Perusahaan', 'PT Juris Auditama Indonesia'],
                    ['Singkatan', 'JAI'],
                    ['Bentuk Badan Hukum', 'Perseroan Terbatas (PT)'],
                    ['Bidang Usaha', 'Jasa Konsultasi & Pelatihan'],
                    ['KBLI', '70209 – Aktivitas Konsultansi Manajemen'],
                    ['Domisili', 'Jakarta Selatan, DKI Jakarta'],
                    ['Cakupan Operasi', 'Seluruh Indonesia'],
                    ['Website', 'www.jurisauditama.co.id'],
                    ['Email', 'info@jurisauditama.co.id'],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-100">
                      <td className="py-2 text-gray-500 pr-4 w-40">{k}</td>
                      <td className="py-2 font-medium text-gray-800">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Visi</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                Menjadi perusahaan konsultasi dan pelatihan terkemuka di Indonesia yang dipercaya oleh instansi pemerintah dan BUMN/BUMD dalam mewujudkan tata kelola keuangan yang akuntabel, transparan, dan berintegritas.
              </p>
              <h3 className="font-bold text-gray-800 mb-3">Misi</h3>
              <ul className="space-y-2 text-sm">
                {[
                  'Menyelenggarakan pelatihan berkualitas berbasis regulasi terkini',
                  'Memberikan konsultasi profesional dari praktisi berpengalaman',
                  'Mendampingi instansi menuju opini WTP BPK',
                  'Meningkatkan kapasitas SDM aparatur sektor publik',
                  'Berkontribusi pada penguatan good governance Indonesia',
                ].map((m) => (
                  <li key={m} className="flex items-start gap-2 text-gray-600">
                    <span className="text-blue-600 shrink-0">✦</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Nilai-Nilai Perusahaan</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: '⚖️', val: 'Integritas', desc: 'Independen, jujur, dan tidak berpihak' },
                { icon: '🎯', val: 'Profesionalisme', desc: 'Terlatih, tersertifikasi, dan berpengalaman' },
                { icon: '📚', val: 'Akuntabilitas', desc: 'Bertanggung jawab atas setiap rekomendasi' },
                { icon: '🌱', val: 'Keberlanjutan', desc: 'Berorientasi dampak jangka panjang' },
              ].map((v) => (
                <div key={v.val} className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{v.icon}</div>
                  <div className="font-bold text-sm text-gray-800 mb-1">{v.val}</div>
                  <div className="text-xs text-gray-500">{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* III. Analisis Pasar */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">III. ANALISIS PASAR</h2>
          <h3 className="font-bold text-gray-800 mb-3">Ukuran Pasar (TAM – SAM – SOM)</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'TAM', sub: 'Total Addressable Market', val: 'Rp 15 Triliun/tahun', desc: 'Seluruh pengeluaran diklat & konsultasi sektor publik Indonesia' },
              { label: 'SAM', sub: 'Serviceable Addressable Market', val: 'Rp 3,2 Triliun/tahun', desc: 'Pemda, BUMN/BUMD, dan Pemerintah Desa yang butuh layanan audit, hukum, akuntansi, perpajakan' },
              { label: 'SOM', sub: 'Serviceable Obtainable Market', val: 'Rp 240 Miliar/tahun', desc: 'Target realistis JAI dalam 3 tahun pertama (7,5% dari SAM)' },
            ].map((m) => (
              <div key={m.label} className="border-2 border-blue-200 rounded-xl p-5">
                <div className="text-2xl font-black text-blue-800 mb-1">{m.label}</div>
                <div className="text-xs text-gray-400 mb-2">{m.sub}</div>
                <div className="text-lg font-bold text-gray-900 mb-2">{m.val}</div>
                <div className="text-xs text-gray-500">{m.desc}</div>
              </div>
            ))}
          </div>

          <h3 className="font-bold text-gray-800 mb-3">Segmen Klien & Potensi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="text-left py-3 px-4">Segmen</th>
                  <th className="text-left py-3 px-4">Jumlah Entitas</th>
                  <th className="text-left py-3 px-4">Kebutuhan Utama</th>
                  <th className="text-left py-3 px-4">Potensi/Entitas</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Pemerintah Daerah (Provinsi)', '38 Provinsi', 'Audit kinerja, WTP, pajak daerah', 'Rp 500 juta–2 miliar/tahun'],
                  ['Pemerintah Daerah (Kab/Kota)', '514 Kab/Kota', 'Pelatihan aparatur, WTP, akuntansi', 'Rp 200–500 juta/tahun'],
                  ['Pemerintah Desa', '75.000+ Desa', 'Dana Desa, BUMDes, lap. keuangan', 'Rp 10–50 juta/tahun'],
                  ['BUMN & Anak Perusahaan', '800+ entitas', 'Audit internal, pajak, hukum korporasi', 'Rp 300 juta–1 miliar/tahun'],
                  ['BUMD (PDAM, BPD, dll)', '1.000+ entitas', 'Audit, perpajakan BUMD, tata kelola', 'Rp 150–400 juta/tahun'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="py-3 px-4 border-b border-gray-200 text-gray-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-gray-800 mb-3">Faktor Pendorong Pasar</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: '📜', title: 'Regulasi Ketat', desc: 'PP 12/2019, Permendagri 77/2020, UU Desa 3/2024, dan revisi Perpres pengadaan mendorong peningkatan kapasitas aparatur secara berkelanjutan.' },
                { icon: '🎯', title: 'Target WTP Nasional', desc: 'Pemerintah pusat mendorong seluruh Pemda meraih opini WTP dari BPK. Saat ini masih banyak daerah dengan opini WDP yang butuh pendampingan.' },
                { icon: '💰', title: 'Dana Desa Meningkat', desc: 'Alokasi Dana Desa terus meningkat (Rp 70 triliun+ per tahun), membutuhkan kapasitas pengelolaan keuangan desa yang kuat.' },
                { icon: '🏛️', title: 'Reformasi BUMN/BUMD', desc: 'Program transformasi dan restrukturisasi BUMN/BUMD menciptakan permintaan tinggi untuk layanan audit, hukum korporasi, dan perpajakan.' },
              ].map((f) => (
                <div key={f.title} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                  <span className="text-2xl shrink-0">{f.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm mb-1">{f.title}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* IV. Layanan & Produk */}
        <section className="mb-12 page-break">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">IV. LAYANAN & PRODUK</h2>
          <div className="space-y-6">
            {[
              {
                no: '4.1', icon: '🔍', title: 'Layanan Auditing',
                items: [
                  ['Pelatihan Audit Internal & APIP', 'Rp 15–25 juta/angkatan (30 peserta)'],
                  ['Konsultasi Audit Kinerja Pemda', 'Rp 150–300 juta/penugasan'],
                  ['Reviu Laporan Keuangan BLUD', 'Rp 50–100 juta/penugasan'],
                  ['Pendampingan SPIP & Penguatan APIP', 'Rp 200–400 juta/Pemda'],
                ],
              },
              {
                no: '4.2', icon: '⚖️', title: 'Layanan Hukum',
                items: [
                  ['Pelatihan Hukum Pemerintahan & PBJ', 'Rp 15–25 juta/angkatan'],
                  ['Konsultasi Penyusunan Perda/Perkades', 'Rp 50–150 juta/regulasi'],
                  ['Pendampingan Hukum Kontrak BUMN', 'Rp 100–250 juta/kontrak'],
                  ['Legal Audit Aset Daerah', 'Rp 75–200 juta/penugasan'],
                ],
              },
              {
                no: '4.3', icon: '📊', title: 'Layanan Akuntansi',
                items: [
                  ['Pelatihan SAP & Akuntansi Pemerintahan', 'Rp 12–20 juta/angkatan'],
                  ['Pendampingan Penyusunan LKPD', 'Rp 100–300 juta/Pemda'],
                  ['Pelatihan Akuntansi Keuangan Desa', 'Rp 8–15 juta/angkatan'],
                  ['Konsultasi SAK ETAP untuk BUMD', 'Rp 80–200 juta/entitas'],
                ],
              },
              {
                no: '4.4', icon: '🧾', title: 'Layanan Perpajakan',
                items: [
                  ['Pelatihan Pajak Daerah & Retribusi', 'Rp 12–20 juta/angkatan'],
                  ['Tax Review & Due Diligence BUMD', 'Rp 100–250 juta/entitas'],
                  ['Konsultasi PPh & PPN Instansi Pemerintah', 'Rp 50–150 juta/tahun'],
                  ['Pendampingan Keberatan & Banding Pajak', 'Rp 75–200 juta/kasus'],
                ],
              },
            ].map((s) => (
              <div key={s.no} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-blue-800 text-white px-5 py-3 flex items-center gap-3">
                  <span className="text-xl">{s.icon}</span>
                  <span className="font-bold">{s.no} {s.title}</span>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="text-left py-2 px-5 text-gray-500 font-medium">Produk/Program</th>
                    <th className="text-left py-2 px-5 text-gray-500 font-medium">Kisaran Harga</th>
                  </tr></thead>
                  <tbody>
                    {s.items.map(([prod, price], i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-3 px-5 text-gray-700">{prod}</td>
                        <td className="py-3 px-5 font-semibold text-blue-700">{price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>

        {/* V. Strategi Pemasaran */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">V. STRATEGI PEMASARAN & PENJUALAN</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {[
              {
                title: '🎯 Pendekatan Langsung (Direct Selling)',
                points: [
                  'Tim Business Development khusus untuk sektor publik',
                  'Kunjungan dan presentasi ke kepala daerah, sekda, dan BPPKAD',
                  'Mengikuti pameran diklat dan forum APKASI, APEKSI, APKESI',
                  'Proposal penawaran yang disesuaikan per segmen klien',
                ],
              },
              {
                title: '🤝 Kemitraan Strategis',
                points: [
                  'MOU dengan Asosiasi Pemerintah Daerah (APKASI, APEKSI)',
                  'Kerjasama dengan BPSDM provinsi & kabupaten/kota',
                  'Kolaborasi dengan BPKP, KPK, dan Kemendagri',
                  'Partnership dengan Kementerian Desa untuk program desa',
                ],
              },
              {
                title: '📢 Pemasaran Digital',
                points: [
                  'Website profesional dengan SEO untuk kata kunci sektor publik',
                  'LinkedIn & media sosial untuk thought leadership',
                  'Webinar gratis bulanan sebagai lead generation',
                  'Newsletter regulasi perpajakan & akuntansi pemerintahan',
                ],
              },
              {
                title: '📚 Konten & Reputasi',
                points: [
                  'Publikasi artikel di jurnal dan media pemerintahan',
                  'Modul pelatihan yang dapat diunduh sebagai marketing tool',
                  'Studi kasus keberhasilan klien (case studies)',
                  'Referral program dari klien yang puas',
                ],
              },
            ].map((s) => (
              <div key={s.title} className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">{s.title}</h3>
                <ul className="space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-blue-500 shrink-0 mt-0.5">•</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* VI. Struktur Organisasi */}
        <section className="mb-12 page-break">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">VI. STRUKTUR ORGANISASI & SDM</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="text-left py-3 px-4">Jabatan</th>
                  <th className="text-left py-3 px-4">Kualifikasi</th>
                  <th className="text-left py-3 px-4">Jumlah</th>
                  <th className="text-left py-3 px-4">Gaji/Bulan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Direktur Utama', 'S2, CA/CPA, min. 15 thn pengalaman sektor publik', '1', 'Rp 30–50 juta'],
                  ['Direktur Hukum', 'S2 Hukum, Advokat/konsultan hukum pemerintahan', '1', 'Rp 25–40 juta'],
                  ['Direktur Keuangan & Audit', 'S2, Ak., CA, CIA atau CGAP', '1', 'Rp 25–40 juta'],
                  ['Manajer Pelatihan', 'S1/S2, pengalaman training & curriculum design', '2', 'Rp 12–18 juta'],
                  ['Konsultan Senior', 'S2, berpengalaman di BPK/BPKP/Kemenkeu', '4', 'Rp 15–25 juta'],
                  ['Konsultan Junior', 'S1, fresh graduate atau 1–3 thn pengalaman', '6', 'Rp 6–10 juta'],
                  ['Business Development', 'S1, pengalaman marketing B2G/B2B', '2', 'Rp 8–12 juta'],
                  ['Admin & Keuangan', 'D3/S1, pengalaman administrasi', '3', 'Rp 4–6 juta'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="py-3 px-4 border-b border-gray-200 text-gray-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700">
            <strong>Total SDM Awal:</strong> 20 orang (10 tenaga ahli + 10 staf pendukung). Rencana ekspansi ke 35 orang pada tahun ke-3 seiring pertumbuhan klien.
          </div>
        </section>

        {/* VII. Rencana Operasional */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">VII. RENCANA OPERASIONAL</h2>
          <div className="space-y-4">
            {[
              { fase: 'Fase 1 (Bulan 1–3): Fondasi', items: ['Pendirian PT & pengurusan izin usaha (NIB, KBLI)', 'Sewa kantor representatif di Jakarta Selatan', 'Rekrutmen tim inti (direktur, konsultan senior, admin)', 'Pengembangan kurikulum pelatihan 4 bidang', 'Pembuatan website, brosur, dan materi pemasaran', 'Pendaftaran sebagai vendor di LPSE & SIKAP'] },
              { fase: 'Fase 2 (Bulan 4–6): Akuisisi Klien Pertama', items: ['Roadshow ke 10 Pemda potensial di Jawa & Sulawesi', 'Webinar gratis perdana untuk lead generation', 'Penyerahan proposal ke 5 BUMD target', 'Penandatanganan kontrak perdana (target min. 3 klien)', 'Pelaksanaan pelatihan batch pertama', 'Evaluasi dan refinement layanan'] },
              { fase: 'Fase 3 (Bulan 7–12): Ekspansi', items: ['Ekspansi ke Kalimantan, Sumatera, dan Sulawesi', 'Rekrutmen konsultan daerah (associate)', 'Pengembangan modul online/e-learning', 'MOU dengan minimal 2 asosiasi Pemda', 'Target 15–20 klien aktif di akhir tahun pertama', 'Review dan penyesuaian strategi berdasarkan data'] },
            ].map((f) => (
              <div key={f.fase} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-blue-700 text-white px-5 py-3 font-semibold text-sm">{f.fase}</div>
                <ul className="grid md:grid-cols-2 gap-2 p-5">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 shrink-0 mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* VIII. Proyeksi Keuangan */}
        <section className="mb-12 page-break">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">VIII. PROYEKSI KEUANGAN 5 TAHUN</h2>

          <h3 className="font-bold text-gray-800 mb-3">A. Modal Awal & Kebutuhan Investasi</h3>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-2 px-4">Komponen</th>
                  <th className="text-right py-2 px-4">Nilai</th>
                  <th className="text-left py-2 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Modal dasar PT & notaris', 'Rp 150.000.000', 'Termasuk akta, NIB, NPWP, izin usaha'],
                  ['Sewa kantor (1 tahun)', 'Rp 300.000.000', 'Kantor representatif Jakarta Selatan, ~150 m²'],
                  ['Peralatan & IT', 'Rp 200.000.000', 'Laptop, server, software audit, proyektor'],
                  ['Gaji SDM (6 bulan pertama)', 'Rp 900.000.000', 'Sebelum revenue stabil'],
                  ['Pengembangan kurikulum & modul', 'Rp 150.000.000', 'Desain, print, dan digital content'],
                  ['Pemasaran & branding', 'Rp 200.000.000', 'Website, iklan, roadshow, brosur'],
                  ['Cadangan operasional', 'Rp 600.000.000', 'Dana darurat 6 bulan'],
                  ['Total Kebutuhan Modal', 'Rp 2.500.000.000', ''],
                ].map((row, i) => (
                  <tr key={i} className={i === 7 ? 'bg-blue-50 font-bold border-t-2 border-blue-300' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-4 border-b border-gray-200">{row[0]}</td>
                    <td className="py-3 px-4 border-b border-gray-200 text-right text-blue-700 font-semibold">{row[1]}</td>
                    <td className="py-3 px-4 border-b border-gray-200 text-gray-500 text-xs">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-bold text-gray-800 mb-3">B. Proyeksi Pendapatan & Laba 5 Tahun</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-800 text-white">
                  {['Keterangan', 'Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5'].map((h) => (
                    <th key={h} className="py-3 px-4 text-right first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Pendapatan Pelatihan', '1.200', '2.100', '3.600', '5.400', '7.200'],
                  ['Pendapatan Konsultasi', '2.400', '4.200', '7.200', '10.800', '14.400'],
                  ['Total Pendapatan', '3.600', '6.300', '10.800', '16.200', '21.600'],
                  ['Biaya Operasional', '3.000', '4.500', '7.000', '10.000', '13.500'],
                  ['Laba Sebelum Pajak', '600', '1.800', '3.800', '6.200', '8.100'],
                  ['Pajak PPh Badan (22%)', '132', '396', '836', '1.364', '1.782'],
                  ['Laba Bersih', '468', '1.404', '2.964', '4.836', '6.318'],
                  ['Margin Bersih', '13%', '22%', '27%', '30%', '29%'],
                ].map((row, i) => (
                  <tr key={i} className={
                    i === 2 || i === 6 ? 'bg-blue-50 font-bold' :
                    i === 7 ? 'bg-yellow-50 font-semibold' :
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }>
                    <td className="py-3 px-4 border-b border-gray-200">{row[0]}</td>
                    {row.slice(1).map((cell, j) => (
                      <td key={j} className="py-3 px-4 border-b border-gray-200 text-right text-gray-700">
                        {i < 7 ? `Rp ${cell} jt` : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 italic">*Proyeksi dalam jutaan Rupiah. Asumsi: pertumbuhan klien 40%/tahun, rata-rata 2 kontrak besar & 12 pelatihan/bulan di tahun ke-3.</p>
        </section>

        {/* IX. SWOT */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">IX. ANALISIS SWOT</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'KEKUATAN (Strengths)', color: 'bg-green-50 border-green-300',
                items: ['Tim ahli berlatar belakang BPK, BPKP, Kemenkeu', 'Fokus eksklusif sektor publik = deep expertise', 'Kurikulum berbasis regulasi terbaru & praktis', 'Jaringan alumni aparatur negara yang luas'],
              },
              {
                label: 'KELEMAHAN (Weaknesses)', color: 'bg-red-50 border-red-300',
                items: ['Perusahaan baru, belum memiliki track record', 'Modal terbatas untuk ekspansi cepat', 'Ketergantungan pada beberapa tenaga ahli kunci', 'Siklus pembayaran pemerintah yang panjang (60–120 hari)'],
              },
              {
                label: 'PELUANG (Opportunities)', color: 'bg-blue-50 border-blue-300',
                items: ['75.000+ desa butuh pendampingan pengelolaan Dana Desa', 'Target WTP nasional mendorong permintaan konsultasi', 'Transformasi digital BUMN/BUMD membuka pasar baru', 'Reformasi perpajakan daerah pasca UU HKPD'],
              },
              {
                label: 'ANCAMAN (Threats)', color: 'bg-yellow-50 border-yellow-300',
                items: ['Persaingan dari firma big4 dan konsultan besar', 'Perubahan regulasi pengadaan jasa konsultansi', 'Rotasi pejabat daerah yang mempengaruhi relasi bisnis', 'Anggaran diklat yang sering terpotong saat efisiensi'],
              },
            ].map((s) => (
              <div key={s.label} className={`border-2 rounded-xl p-5 ${s.color}`}>
                <h3 className="font-bold text-gray-800 text-sm mb-3">{s.label}</h3>
                <ul className="space-y-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="shrink-0 mt-0.5">→</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* X. Risiko */}
        <section className="mb-12 page-break">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">X. ANALISIS RISIKO & MITIGASI</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-800 text-white">
                  {['Risiko', 'Tingkat', 'Dampak', 'Mitigasi'].map((h) => (
                    <th key={h} className="text-left py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Keterlambatan pembayaran klien pemerintah', 'Tinggi', 'Arus kas terganggu', 'Cadangan kas 6 bulan; kontrak dengan klausul DP 30%'],
                  ['Rotasi pejabat daerah (pergantian kepala daerah)', 'Sedang', 'Kehilangan relasi', 'Kontrak jangka panjang; hubungan kelembagaan, bukan personal'],
                  ['Tenaga ahli utama keluar (resign)', 'Sedang', 'Kualitas layanan turun', 'Retensi via equity sharing; dokumentasi knowledge base'],
                  ['Perubahan regulasi pengadaan jasa', 'Sedang', 'Proses tender lebih ketat', 'Tim legal internal; update regulasi rutin'],
                  ['Persaingan dari firma besar', 'Tinggi', 'Kehilangan klien besar', 'Fokus pada niche (desa, BUMD kecil); harga kompetitif'],
                  ['Pemalsuan sertifikat/modul pelatihan', 'Rendah', 'Reputasi tercoreng', 'Sistem sertifikasi digital; watermark & QR code'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, j) => (
                      <td key={j} className={`py-3 px-4 border-b border-gray-200 text-gray-700 ${
                        j === 1 ? (cell === 'Tinggi' ? 'text-red-600 font-semibold' : cell === 'Sedang' ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold') : ''
                      }`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* XI. Pendanaan */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-6">XI. RENCANA PENDANAAN & MODAL AWAL</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { source: 'Modal Pendiri', pct: '60%', val: 'Rp 1,5 Miliar', desc: 'Setoran modal dari para pendiri perusahaan' },
              { source: 'Investor Strategis', pct: '30%', val: 'Rp 750 Juta', desc: 'Angel investor atau mitra bisnis dari sektor konsultansi' },
              { source: 'KUR / Kredit Bank', pct: '10%', val: 'Rp 250 Juta', desc: 'KUR Mikro atau pinjaman bank dengan agunan aset' },
            ].map((f) => (
              <div key={f.source} className="border-2 border-blue-200 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-blue-800 mb-1">{f.pct}</div>
                <div className="font-bold text-gray-800 mb-1">{f.source}</div>
                <div className="text-blue-600 font-semibold text-sm mb-2">{f.val}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            ))}
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h3 className="font-bold text-green-800 mb-2">Target Break Even Point (BEP)</h3>
            <p className="text-sm text-gray-700">Berdasarkan proyeksi keuangan, PT Juris Auditama Indonesia diestimasi mencapai <strong>Break Even Point pada bulan ke-8 hingga ke-10</strong> operasional, dengan asumsi berhasil mengakuisisi minimal 5 klien konsultasi aktif dan menyelenggarakan 3–4 pelatihan per bulan.</p>
          </div>
        </section>

        {/* Penutup */}
        <div className="text-center py-12 border-t-2 border-blue-200 mt-12">
          <div className="w-16 h-16 rounded-2xl bg-blue-800 flex items-center justify-center text-white font-black text-xl mx-auto mb-4">JAI</div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">PT Juris Auditama Indonesia</h3>
          <p className="text-gray-500 text-sm italic mb-4">"Juris Auditoris — Hukum & Audit sebagai Fondasi Tata Kelola"</p>
          <p className="text-xs text-gray-400">Dokumen ini bersifat rahasia dan hanya untuk keperluan internal serta presentasi kepada investor/mitra strategis.</p>
          <p className="text-xs text-gray-400 mt-1">Jakarta, 2026 · info@jurisauditama.co.id · www.jurisauditama.co.id</p>
        </div>

      </div>
    </div>
  )
}
