'use client'

import { useState } from 'react'

type Tab = 'pemda' | 'bumd' | 'desa'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'pemda', label: 'Pemerintah Daerah', icon: '🏛️' },
  { id: 'bumd', label: 'BUMN & BUMD', icon: '🏢' },
  { id: 'desa', label: 'Pemerintah Desa', icon: '🏘️' },
]

const CONTACT = {
  name: 'PT Juris Auditama Indonesia',
  short: 'JAI',
  address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
  phone: '(021) 1234-5678',
  email: 'info@jurisauditama.co.id',
  web: 'www.jurisauditama.co.id',
}

function ProposalHeader({ to, attn, date }: { to: string; attn: string; date: string }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-8">
      <div className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center text-blue-900 font-black text-sm">JAI</div>
          <div>
            <div className="font-bold text-sm">{CONTACT.name}</div>
            <div className="text-blue-200 text-xs">{CONTACT.address}</div>
          </div>
        </div>
        <div className="text-right text-xs text-blue-200">
          <div>{CONTACT.phone}</div>
          <div>{CONTACT.email}</div>
          <div>{CONTACT.web}</div>
        </div>
      </div>
      <div className="px-6 py-5 bg-white">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <table className="text-sm w-full">
              <tbody>
                {[
                  ['Nomor', ': 001/JAI-PROP/V/2026'],
                  ['Lampiran', ': 1 (satu) berkas'],
                  ['Perihal', ': Penawaran Jasa Konsultasi dan Pelatihan'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-0.5 text-gray-500 w-24">{k}</td>
                    <td className="py-0.5 text-gray-800">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <table className="text-sm w-full">
              <tbody>
                <tr><td className="py-0.5 text-gray-500 w-24">Kepada Yth.</td><td className="py-0.5 font-semibold text-gray-800">{to}</td></tr>
                <tr><td className="py-0.5 text-gray-500">u.p.</td><td className="py-0.5 text-gray-800">{attn}</td></tr>
                <tr><td className="py-0.5 text-gray-500">Di-</td><td className="py-0.5 text-gray-800">Tempat</td></tr>
                <tr><td className="py-0.5 text-gray-500">Tanggal</td><td className="py-0.5 text-gray-800">{date}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="font-bold text-blue-900 text-base border-l-4 border-blue-800 pl-3 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function ProposalPemda() {
  return (
    <div>
      <ProposalHeader
        to="Bupati/Walikota / Kepala BPPKAD / Sekretaris Daerah"
        attn="Kepala Badan Pengelolaan Keuangan dan Aset Daerah (BPPKAD)"
        date="19 Mei 2026"
      />

      <div className="prose max-w-none text-sm text-gray-700 mb-8">
        <p className="leading-relaxed mb-4">Dengan hormat,</p>
        <p className="leading-relaxed mb-4">
          Sehubungan dengan upaya peningkatan kualitas tata kelola keuangan daerah dan pencapaian opini <strong>Wajar Tanpa Pengecualian (WTP)</strong> dari Badan Pemeriksa Keuangan (BPK) RI, kami dari <strong>PT Juris Auditama Indonesia (JAI)</strong> dengan hormat menyampaikan penawaran layanan jasa konsultasi dan pelatihan profesional kepada Pemerintah Daerah Bapak/Ibu.
        </p>
        <p className="leading-relaxed">
          PT Juris Auditama Indonesia adalah perusahaan konsultasi yang secara eksklusif bergerak di bidang <strong>auditing, hukum, akuntansi, dan perpajakan</strong> untuk instansi sektor publik, dengan tenaga ahli berpengalaman yang berasal dari BPK RI, BPKP, dan Kementerian Keuangan.
        </p>
      </div>

      <Section title="I. PROFIL SINGKAT PERUSAHAAN">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            ['Badan Hukum', 'PT (Perseroan Terbatas)'],
            ['KBLI', '70209 – Konsultansi Manajemen'],
            ['Didirikan', 'Jakarta, 2026'],
            ['Tenaga Ahli', '15+ orang bersertifikasi'],
            ['Cakupan', 'Seluruh Indonesia'],
            ['Klien', 'Sektor Publik & BUMN/BUMD'],
          ].map(([k, v]) => (
            <div key={k} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-400">{k}</div>
              <div className="text-sm font-semibold text-gray-800">{v}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="II. PAKET LAYANAN UNTUK PEMERINTAH DAERAH">
        <div className="space-y-4">
          {[
            {
              paket: 'PAKET A — Pendampingan Menuju WTP',
              harga: 'Rp 250.000.000 – Rp 500.000.000',
              durasi: '6–12 bulan',
              isi: [
                'Diagnosis awal kondisi LKPD dan identifikasi temuan berulang BPK',
                'Pendampingan penyusunan Laporan Keuangan Pemerintah Daerah (LKPD) berbasis SAP',
                'Reviu internal laporan keuangan sebelum audit BPK',
                'Penyusunan tindak lanjut atas temuan BPK tahun sebelumnya',
                'Pelatihan penyusun laporan keuangan di seluruh OPD',
                'Laporan kemajuan bulanan kepada pimpinan daerah',
              ],
            },
            {
              paket: 'PAKET B — Pelatihan Aparatur Daerah',
              harga: 'Rp 15.000.000 – Rp 25.000.000 / angkatan',
              durasi: '2–5 hari per angkatan',
              isi: [
                'Pelatihan Akuntansi Pemerintahan & SAP berbasis Permendagri 77/2020',
                'Pelatihan Audit Internal & Penguatan APIP',
                'Pelatihan Perpajakan untuk Bendahara & Pejabat Keuangan',
                'Pelatihan Hukum Pengadaan Barang/Jasa (Perpres 12/2021)',
                'Sertifikat pelatihan resmi & modul tercetak untuk peserta',
                'Kapasitas: 25–40 peserta per angkatan, dapat dilaksanakan in-house',
              ],
            },
            {
              paket: 'PAKET C — Konsultasi Hukum & Regulasi Daerah',
              harga: 'Rp 75.000.000 – Rp 200.000.000',
              durasi: 'Per penugasan / per Perda',
              isi: [
                'Penyusunan dan review Peraturan Daerah (Perda) bidang keuangan & pajak',
                'Konsultasi legal atas sengketa aset daerah dan pengelolaan BMD',
                'Review kontrak pengadaan barang/jasa bernilai besar',
                'Pendampingan hukum dalam pemeriksaan BPK & BPKP',
                'Konsultasi Pajak Daerah & Retribusi pasca UU HKPD No. 1/2022',
              ],
            },
          ].map((p) => (
            <div key={p.paket} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-blue-700 text-white px-5 py-3">
                <div className="font-bold text-sm">{p.paket}</div>
                <div className="flex gap-4 text-xs text-blue-200 mt-1">
                  <span>Investasi: <strong className="text-yellow-300">{p.harga}</strong></span>
                  <span>Durasi: {p.durasi}</span>
                </div>
              </div>
              <ul className="p-5 space-y-2">
                {p.isi.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="III. KEUNGGULAN KOMPETITIF">
        <div className="grid md:grid-cols-2 gap-3">
          {[
            ['🎯 Spesialis Sektor Publik', 'Fokus 100% pada instansi pemerintah — bukan layanan sampingan seperti kantor akuntan publik umum.'],
            ['👨‍💼 Tim Ex-BPK & BPKP', 'Konsultan kami pernah menjabat sebagai auditor di BPK RI dan BPKP, sehingga paham betul apa yang diperiksa.'],
            ['📋 Berbasis Regulasi Terbaru', 'Seluruh materi dan metodologi selalu diperbarui sesuai aturan terbaru (Permendagri, PP, UU).'],
            ['🌍 Layanan In-House', 'Pelatihan dapat dilaksanakan di kantor Pemda, tidak perlu biaya akomodasi peserta ke luar kota.'],
          ].map(([title, desc]) => (
            <div key={title} className="bg-blue-50 rounded-xl p-4">
              <div className="font-semibold text-gray-800 text-sm mb-1">{title}</div>
              <div className="text-xs text-gray-600">{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="IV. MEKANISME PELAKSANAAN & PEMBAYARAN">
        <div className="text-sm text-gray-700 space-y-3">
          <p>Penugasan dapat dilakukan melalui mekanisme:</p>
          <ul className="space-y-1 ml-4">
            <li className="flex gap-2"><span className="text-blue-600">1.</span> Pengadaan Langsung (untuk nilai di bawah Rp 200 juta sesuai Perpres 12/2021)</li>
            <li className="flex gap-2"><span className="text-blue-600">2.</span> Pemilihan Langsung / Seleksi Sederhana (untuk nilai Rp 200 juta – Rp 1 miliar)</li>
            <li className="flex gap-2"><span className="text-blue-600">3.</span> Seleksi Umum (untuk nilai di atas Rp 1 miliar)</li>
          </ul>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <strong>Skema Pembayaran:</strong> Uang muka 30% setelah penandatanganan kontrak, 40% setelah deliverable tahap pertama, 30% setelah selesai dan laporan akhir diterima.
          </div>
        </div>
      </Section>

      <div className="text-sm text-gray-700 mt-8 leading-relaxed">
        <p className="mb-4">Demikian proposal penawaran ini kami sampaikan. Besar harapan kami untuk dapat berkolaborasi dengan Pemerintah Daerah Bapak/Ibu dalam mewujudkan tata kelola keuangan yang lebih akuntabel dan transparan.</p>
        <p className="mb-8">Atas perhatian dan kepercayaan Bapak/Ibu, kami ucapkan terima kasih.</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-gray-500 text-xs">Hormat kami,</p>
            <p className="font-bold mt-1">PT Juris Auditama Indonesia</p>
            <div className="h-16 my-2"></div>
            <p className="font-semibold">Dr. Ahmad Fauzi, Ak., CA</p>
            <p className="text-xs text-gray-500">Direktur Utama</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProposalBUMD() {
  return (
    <div>
      <ProposalHeader
        to="Direksi / Dewan Komisaris"
        attn="Direktur Utama / Direktur Keuangan BUMN/BUMD"
        date="19 Mei 2026"
      />

      <div className="prose max-w-none text-sm text-gray-700 mb-8">
        <p className="leading-relaxed mb-4">Dengan hormat,</p>
        <p className="leading-relaxed mb-4">
          Dalam rangka penguatan tata kelola perusahaan (<em>good corporate governance</em>) dan peningkatan kepatuhan terhadap regulasi keuangan, perpajakan, serta hukum korporasi, kami dari <strong>PT Juris Auditama Indonesia (JAI)</strong> dengan hormat menyampaikan penawaran layanan konsultasi dan pelatihan profesional kepada Perusahaan Bapak/Ibu.
        </p>
        <p className="leading-relaxed">
          Kami memiliki rekam jejak dalam mendampingi BUMN, BUMD, dan anak perusahaan negara dalam memenuhi standar audit, kepatuhan pajak, dan regulasi hukum yang semakin kompleks.
        </p>
      </div>

      <Section title="I. PAKET LAYANAN UNTUK BUMN & BUMD">
        <div className="space-y-4">
          {[
            {
              paket: 'PAKET PREMIER — Audit Internal & GCG',
              harga: 'Rp 300.000.000 – Rp 800.000.000/tahun',
              durasi: 'Retainer Tahunan',
              isi: [
                'Pembangunan sistem audit internal berbasis COSO framework',
                'Pelaksanaan audit internal tahunan di seluruh unit bisnis',
                'Penilaian implementasi Good Corporate Governance (GCG)',
                'Review sistem pengendalian internal (SPI) & manajemen risiko',
                'Pelaporan langsung kepada Direktur Utama & Dewan Komisaris',
                'Quarterly Board Report atas temuan dan rekomendasi',
              ],
            },
            {
              paket: 'PAKET TAX COMPLIANCE — Kepatuhan Perpajakan',
              harga: 'Rp 150.000.000 – Rp 400.000.000/tahun',
              durasi: 'Retainer Tahunan',
              isi: [
                'Tax review menyeluruh atas kepatuhan PPh Badan, PPh 21/23/26, dan PPN',
                'Pendampingan penyusunan SPT Tahunan PPh Badan',
                'Konsultasi transfer pricing documentation (TP Doc)',
                'Pendampingan pemeriksaan pajak dan penyelesaian sengketa',
                'Tax planning yang legal sesuai peraturan perpajakan berlaku',
                'Update regulasi pajak terbaru (newsletter bulanan)',
              ],
            },
            {
              paket: 'PAKET LEGAL — Konsultasi Hukum Korporasi',
              harga: 'Rp 100.000.000 – Rp 300.000.000',
              durasi: 'Per Penugasan',
              isi: [
                'Legal audit atas seluruh dokumen korporasi & perizinan',
                'Review dan penyusunan kontrak komersial & perjanjian kerja sama',
                'Konsultasi hukum pengadaan barang/jasa BUMN (Permen BUMN)',
                'Pendampingan dalam proses litigasi atau arbitrase',
                'Kepatuhan regulasi OJK (untuk BUMD sektor keuangan)',
                'Due diligence hukum untuk akuisisi/merger',
              ],
            },
            {
              paket: 'PAKET PELATIHAN — Capacity Building SDM',
              harga: 'Rp 20.000.000 – Rp 35.000.000/angkatan',
              durasi: '3–5 hari',
              isi: [
                'Pelatihan Akuntansi Berbasis SAK & PSAK terbaru',
                'Pelatihan Perpajakan untuk Finance Team & Tax Officer',
                'Pelatihan Hukum Kontrak & Pengadaan untuk Procurement Team',
                'Pelatihan Audit Internal berbasis IIA Standards',
                'Sertifikat, modul, dan studi kasus nyata dari BUMN/BUMD',
              ],
            },
          ].map((p) => (
            <div key={p.paket} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-blue-700 text-white px-5 py-3">
                <div className="font-bold text-sm">{p.paket}</div>
                <div className="flex gap-4 text-xs text-blue-200 mt-1">
                  <span>Investasi: <strong className="text-yellow-300">{p.harga}</strong></span>
                  <span>Durasi: {p.durasi}</span>
                </div>
              </div>
              <ul className="p-5 space-y-2">
                {p.isi.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="II. KEPATUHAN REGULASI YANG KAMI KUASAI">
        <div className="flex flex-wrap gap-2">
          {[
            'PP 54/2017 (BUMD)', 'Permen BUMN PER-02/MBU/03/2023', 'PMK Perpajakan Terbaru',
            'PSAK & SAK ETAP', 'UU No. 40/2007 (PT)', 'IIA Standards (Audit Internal)',
            'OJK POJK Perbankan', 'COSO Framework', 'UU No. 11/2020 (Cipta Kerja)',
            'Perpres 12/2021 (Pengadaan)', 'PP 12/2019 (Keuangan Daerah)', 'IFRS Adopsi Indonesia',
          ].map((reg) => (
            <span key={reg} className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs">{reg}</span>
          ))}
        </div>
      </Section>

      <div className="text-sm text-gray-700 mt-8 leading-relaxed">
        <p className="mb-4">Demikian proposal ini kami sampaikan. Kami siap melakukan presentasi lebih lanjut kepada Direksi dan Dewan Komisaris untuk menjelaskan metodologi dan rencana kerja secara detail.</p>
        <p className="mb-8">Kami berharap dapat menjadi mitra terpercaya perusahaan Bapak/Ibu dalam perjalanan menuju tata kelola yang unggul.</p>
        <div>
          <p className="text-gray-500 text-xs">Hormat kami,</p>
          <p className="font-bold mt-1">PT Juris Auditama Indonesia</p>
          <div className="h-16 my-2"></div>
          <p className="font-semibold">Dr. Ahmad Fauzi, Ak., CA</p>
          <p className="text-xs text-gray-500">Direktur Utama</p>
        </div>
      </div>
    </div>
  )
}

function ProposalDesa() {
  return (
    <div>
      <ProposalHeader
        to="Kepala Desa / Perangkat Desa / Ketua BPD"
        attn="Kepala Desa & Bendahara Desa"
        date="19 Mei 2026"
      />

      <div className="prose max-w-none text-sm text-gray-700 mb-8">
        <p className="leading-relaxed mb-4">Dengan hormat,</p>
        <p className="leading-relaxed mb-4">
          Seiring meningkatnya alokasi <strong>Dana Desa</strong> yang kini mencapai lebih dari Rp 70 triliun per tahun secara nasional, pengelolaan keuangan desa yang akuntabel dan transparan menjadi semakin krusial. Kami dari <strong>PT Juris Auditama Indonesia (JAI)</strong> hadir dengan program khusus yang dirancang untuk membantu perangkat desa mengelola keuangan desa secara benar, legal, dan akuntabel.
        </p>
        <p className="leading-relaxed">
          Program kami disusun oleh praktisi yang berpengalaman langsung dalam pemeriksaan dan pendampingan desa, menggunakan bahasa yang mudah dipahami namun tetap berbasis regulasi resmi Kementerian Desa dan Kemendagri.
        </p>
      </div>

      <Section title="I. PROGRAM KHUSUS DESA — 'DESA AKUNTABEL'">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <h4 className="font-bold text-green-800 mb-2">🌱 Program Desa Akuntabel</h4>
          <p className="text-sm text-gray-700">Program terpadu yang dirancang untuk membantu desa memenuhi seluruh kewajiban pelaporan keuangan, pengelolaan aset desa, dan kepatuhan hukum — mulai dari level kepala desa hingga BPD dan LPMD.</p>
        </div>
        <div className="space-y-4">
          {[
            {
              paket: 'PAKET DESA DASAR — Pelatihan Keuangan Desa',
              harga: 'Rp 8.000.000 – Rp 15.000.000 / desa',
              durasi: '3 hari (dapat dikombinasikan lintas desa)',
              isi: [
                'Pengantar Pengelolaan Keuangan Desa sesuai Permendesa & Permendagri',
                'Tata cara penyusunan APBDes (Anggaran Pendapatan & Belanja Desa)',
                'Pembukuan & pencatatan keuangan desa secara sederhana',
                'Pelaporan penggunaan Dana Desa kepada kecamatan & kabupaten',
                'Pencegahan penyimpangan dan korupsi Dana Desa',
                'Modul panduan tercetak untuk seluruh peserta',
              ],
            },
            {
              paket: 'PAKET DESA MENENGAH — Akuntansi & Laporan Keuangan',
              harga: 'Rp 20.000.000 – Rp 40.000.000 / desa',
              durasi: '2–3 bulan pendampingan',
              isi: [
                'Penyusunan Laporan Realisasi APBDes yang benar dan tepat waktu',
                'Laporan Kekayaan Milik Desa (aset tetap & aset lancar)',
                'Pendampingan penggunaan aplikasi Siskeudes (Sistem Keuangan Desa)',
                'Inventarisasi dan pencatatan Aset Desa',
                'Persiapan dokumen untuk pemeriksaan Inspektorat & BPKP',
                'Kunjungan pendamping ke desa minimal 2x/bulan',
              ],
            },
            {
              paket: 'PAKET BUMDes — Tata Kelola Badan Usaha Milik Desa',
              harga: 'Rp 25.000.000 – Rp 60.000.000',
              durasi: '3–6 bulan',
              isi: [
                'Pendampingan pendirian & legalisasi BUMDes sesuai PP 11/2021',
                'Penyusunan AD/ART dan Perdes tentang BUMDes',
                'Pelatihan manajemen & akuntansi sederhana BUMDes',
                'Konsultasi pemilihan unit usaha BUMDes yang feasible',
                'Penyusunan laporan keuangan BUMDes tahunan',
                'Pendampingan akses permodalan (KUR, hibah, dll)',
              ],
            },
            {
              paket: 'PAKET HUKUM DESA — Regulasi & Perlindungan Hukum',
              harga: 'Rp 10.000.000 – Rp 25.000.000',
              durasi: 'Per penugasan',
              isi: [
                'Penyusunan Peraturan Desa (Perkades) yang sah secara hukum',
                'Konsultasi hukum pengelolaan aset dan tanah desa',
                'Pendampingan hukum saat pemeriksaan APH (kepolisian/kejaksaan)',
                'Pelatihan hak & kewajiban kepala desa & perangkat desa',
                'Review kontrak kerjasama desa dengan pihak ketiga',
              ],
            },
          ].map((p) => (
            <div key={p.paket} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-green-700 text-white px-5 py-3">
                <div className="font-bold text-sm">{p.paket}</div>
                <div className="flex gap-4 text-xs text-green-200 mt-1">
                  <span>Investasi: <strong className="text-yellow-300">{p.harga}</strong></span>
                  <span>Durasi: {p.durasi}</span>
                </div>
              </div>
              <ul className="p-5 space-y-2">
                {p.isi.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 shrink-0 mt-0.5">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="II. REGULASI YANG MENJADI DASAR PROGRAM">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'UU No. 3/2024 tentang Desa',
            'PP No. 11/2021 tentang BUMDes',
            'Permendesa No. 7/2023 (Prioritas Dana Desa)',
            'Permendagri No. 20/2018 (Keuangan Desa)',
            'Perka BPKP No. 10/2019 (Pengawasan Desa)',
            'PMK No. 190/2023 (Penyaluran Dana Desa)',
          ].map((reg) => (
            <div key={reg} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800">{reg}</div>
          ))}
        </div>
      </Section>

      <Section title="III. MEKANISME KERJASAMA">
        <div className="text-sm text-gray-700 space-y-3">
          <p>Program Desa Akuntabel dapat diakses melalui beberapa mekanisme:</p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['📋 Anggaran APBDes', 'Biaya program dapat dianggarkan melalui APBDes pos Pemberdayaan Masyarakat atau Penguatan Kapasitas Perangkat Desa.'],
              ['🏛️ Fasilitasi Kabupaten', 'Program dapat difasilitasi oleh Dinas PMD Kabupaten/Kota untuk beberapa desa sekaligus dalam satu kecamatan (cost-sharing).'],
              ['💡 Dana Desa Prioritas', 'Sesuai Permendesa terbaru, peningkatan kapasitas perangkat desa dapat dibiayai dari Dana Desa bidang pemberdayaan.'],
              ['🤝 Hibah/Bantuan', 'Kami siap membantu desa mengakses hibah pelatihan dari program CSR BUMN atau lembaga donor yang bermitra dengan kami.'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-gray-50 rounded-lg p-4">
                <div className="font-semibold text-gray-800 text-sm mb-1">{title}</div>
                <div className="text-xs text-gray-600">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-8">
        <h3 className="font-bold text-yellow-800 mb-2">💬 Konsultasi Awal Gratis</h3>
        <p className="text-sm text-gray-700">Kami menyediakan sesi konsultasi awal <strong>tanpa biaya</strong> untuk mendiagnosis kebutuhan desa Bapak/Ibu dan merekomendasikan paket yang paling sesuai. Hubungi kami untuk menjadwalkan kunjungan tim ke desa Anda.</p>
      </div>

      <div className="text-sm text-gray-700 mt-6 leading-relaxed">
        <p className="mb-4">Demikian penawaran program ini kami sampaikan. Kami percaya bahwa desa yang akuntabel adalah fondasi Indonesia yang kuat. Bersama PT Juris Auditama Indonesia, kami siap mendampingi Bapak/Ibu membangun desa yang transparan, tertib administrasi, dan terbebas dari permasalahan hukum.</p>
        <p className="mb-8">Atas perhatian dan kepercayaan Bapak/Ibu, kami ucapkan terima kasih.</p>
        <div>
          <p className="text-gray-500 text-xs">Hormat kami,</p>
          <p className="font-bold mt-1">PT Juris Auditama Indonesia</p>
          <div className="h-16 my-2"></div>
          <p className="font-semibold">Dr. Ahmad Fauzi, Ak., CA</p>
          <p className="text-xs text-gray-500">Direktur Utama</p>
        </div>
      </div>
    </div>
  )
}

export default function ProposalPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pemda')

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; font-size: 12px; }
        }
      `}</style>

      {/* Nav */}
      <nav className="no-print fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center text-white font-bold text-xs">JAI</div>
            <span className="font-bold text-gray-900 text-sm">Proposal Penawaran — PT Juris Auditama Indonesia</span>
          </div>
          <div className="flex gap-3 text-sm">
            <a href="/consulting" className="text-gray-500 hover:text-gray-800">← Profil Perusahaan</a>
            <a href="/business-plan" className="text-gray-500 hover:text-gray-800">Business Plan</a>
            <button onClick={() => window.print()} className="bg-blue-800 text-white px-4 py-1.5 rounded-lg hover:bg-blue-900 transition-colors">
              Cetak / PDF
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-20">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-blue-900 mb-2">PROPOSAL PENAWARAN LAYANAN</h1>
          <p className="text-gray-500">PT Juris Auditama Indonesia · Auditing · Hukum · Akuntansi · Perpajakan</p>
        </div>

        {/* Tabs */}
        <div className="no-print flex gap-2 mb-8 bg-white rounded-xl p-2 shadow-sm border border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-800 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Proposal Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {activeTab === 'pemda' && <ProposalPemda />}
          {activeTab === 'bumd' && <ProposalBUMD />}
          {activeTab === 'desa' && <ProposalDesa />}
        </div>

      </div>
    </div>
  )
}
