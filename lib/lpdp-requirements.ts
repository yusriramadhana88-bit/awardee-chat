// Client-safe: checklist dokumen & jadwal resmi LPDP Batch 2 2026, dipakai UI dan sistem prompt LPDP Center.
// Sumber: Buku Panduan resmi LPDP SHARE/STEM Batch 2 2026 (dipublikasikan 30 Juni 2026) — lihat
// knowledge/lpdp-handbook.txt untuk detail lengkap. Jangan tambah/ubah kriteria tanpa mengacu ke situ.
//
// CATATAN AKURASI: checklist Awardee.id "beasiswa" MCP (surat sehat, bebas TBC, bebas napza, pas foto)
// TERBUKTI TIDAK MUNCUL di Buku Panduan resmi Batch 2 2026 — sengaja TIDAK dimasukkan di sini.

export type LpdpJenjang = 'magister' | 'doktor'
export type LpdpTujuan = 'dalam_negeri' | 'luar_negeri'
export type LpdpStatusKerja = 'asn_tni_polri' | 'swasta' | 'fresh_graduate' | 'lainnya'

export type LpdpProfileLite = {
  jenjang: LpdpJenjang | null
  tujuan: LpdpTujuan | null
  punya_loa: boolean
  loa_unconditional: boolean
  status_kerja: LpdpStatusKerja | null
  lulusan_luar_negeri: boolean
  pernah_gagal_studi: boolean
  pendanaan_parsial: boolean
}

// Pendaftaran ditutup 31 Juli 2026 23:59 WIB — dikonfirmasi dari teks Buku Panduan resmi SHARE:
// "Pendaftaran Seleksi 30 Juni – 31 Juli 2026" (knowledge/lpdp-handbook.txt Bagian 1).
export const BATCH2_DEADLINE = new Date('2026-07-31T23:59:00+07:00')

// Batas ukuran file upload — didefinisikan di sini (bukan lib/lpdp-files.ts) karena harus client-safe
// (dipakai untuk validasi & warning di UI sebelum upload, lib/lpdp-files.ts tidak boleh diimpor client
// karena bergantung ke `mammoth`/Node builtins).
export const MAX_FILE_BYTES = 4 * 1024 * 1024 // hard limit 4MB
export const WARN_FILE_BYTES = 2 * 1024 * 1024 // portal LPDP kadang menolak file besar — warning, bukan blokir

export type LpdpDoc = {
  key: string
  label: string
  wajib: boolean // dihitung ke Skor Kelengkapan Dokumen kalau applicable; dokumen opsional tetap muncul di checklist tapi tidak menghambat 100%
  hint: string
  acceptedTypes: Array<'pdf' | 'jpg' | 'png' | 'docx'>
  appliesTo: (p: LpdpProfileLite) => boolean
}

const ALWAYS = () => true

// Hanya dokumen bertipe [Unggah] (file upload) dari checklist resmi. Field [Online] seperti Profil
// Diri, "Komitmen kembali ke Indonesia...", dan Surat Pernyataan (centang) DITANGANI di menu Review
// Esai / tidak butuh verifikasi file terpisah.
export const LPDP_DOCS: LpdpDoc[] = [
  {
    key: 'ktp',
    label: 'KTP',
    wajib: true,
    hint: 'Kartu Tanda Penduduk yang masih berlaku, foto/scan jelas, NIK dan nama terbaca.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'ijazah-skl',
    label: 'Ijazah (atau Surat Keterangan Lulus)',
    wajib: true,
    hint: 'Scan ijazah D4/S1/S2/Spesialis asli atau legalisir, ATAU Surat Keterangan Lulus (SKL) resmi jika ijazah belum terbit.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'transkrip',
    label: 'Transkrip Nilai',
    wajib: true,
    hint: 'Transkrip D4/S1/S2/Spesialis (BUKAN Transkrip Profesi), asli atau legalisir, IPK terbaca jelas.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'loa',
    label: 'LoA (Letter of Acceptance) Unconditional',
    wajib: true,
    hint: 'Wajib diunggah kalau kamu bilang sudah punya LoA. LoA Unconditional membebaskan dari sertifikat bahasa & Seleksi Bakat Skolastik. Pastikan nama pendaftar & program studi sesuai pendaftaran.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.punya_loa,
  },
  {
    key: 'sertifikat-bahasa',
    label: 'Sertifikat Kemampuan Bahasa Inggris',
    wajib: true,
    hint: 'Wajib kecuali sudah punya LoA Unconditional (atau kategori Papua yang dibebaskan). Dari ETS/PTE/IELTS/TOEP/Duolingo/tes mandiri PT resmi, berlaku maksimal 2 tahun dihitung sampai 22 September 2026.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => !p.loa_unconditional,
  },
  {
    key: 'surat-usulan-atasan',
    label: 'Surat Usulan/Izin Atasan',
    wajib: true,
    hint: 'Wajib HANYA untuk CPNS/PNS/TNI/POLRI (bukan karyawan swasta). Minimal ditandatangani pejabat setingkat eselon II yang membidangi SDM (TNI: Mabes TNI/AD/AL/AU; POLRI: Mabes POLRI), mencantumkan nama lengkap + NIP/NRP.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.status_kerja === 'asn_tni_polri',
  },
  {
    key: 'surat-rekomendasi',
    label: 'Surat Rekomendasi',
    wajib: false,
    hint: 'Opsional secara resmi (ada pilihan "tidak ada" di form) tapi sangat disarankan. Dari akademisi/atasan, terbit maksimal 1 tahun sebelum pendaftaran. Bisa via Online Form atau upload (Offline Form).',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'surat-pemberhentian',
    label: 'Surat Pemberhentian sebagai Mahasiswa',
    wajib: true,
    hint: 'Wajib kalau kamu pernah studi di jenjang ini tapi tidak lulus, atau sedang on-going pindah ke program/PT lain. Diterbitkan PT sebelumnya.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.pernah_gagal_studi,
  },
  {
    key: 'penyetaraan-ijazah',
    label: 'Dokumen Penyetaraan Ijazah',
    wajib: true,
    hint: 'Wajib untuk lulusan PT luar negeri di jenjang sebelumnya. Dari Kemendiktisaintek (piln.kemdiktisaintek.go.id) atau Kemenag — atau tangkapan layar pengajuan jika belum terbit.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.lulusan_luar_negeri,
  },
  {
    key: 'konversi-ipk',
    label: 'Dokumen Konversi IPK',
    wajib: true,
    hint: 'Wajib untuk lulusan PT luar negeri di jenjang sebelumnya (dari lembaga yang sama dengan penyetaraan ijazah), atau tangkapan layar pengajuan jika belum terbit.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.lulusan_luar_negeri,
  },
  {
    key: 'proposal-penelitian',
    label: 'Proposal Penelitian',
    wajib: true,
    hint: 'Khusus jenjang Doktor. Panjang 1.500–2.500 kata, wajib ikuti struktur 8 bagian: Judul, Latar Belakang, Perumusan Permasalahan, Pertanyaan/Tujuan Penelitian, Kelogisan/Rationale, Metode & Desain, Signifikansi/Manfaat, Daftar Pustaka.',
    acceptedTypes: ['pdf', 'docx'],
    appliesTo: (p) => p.jenjang === 'doktor',
  },
  {
    key: 'sptjm',
    label: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)',
    wajib: true,
    hint: 'Wajib untuk Skema Pendanaan Parsial — pernyataan dana individu tidak bersumber dari APBN/APBD.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.pendanaan_parsial,
  },
]

export function applicableDocs(p: LpdpProfileLite): LpdpDoc[] {
  return LPDP_DOCS.filter((d) => d.appliesTo(p))
}

export type LpdpEssayType = 'profil_diri' | 'esai_komitmen'

// Catatan: key DB tetap 'esai_komitmen' (sudah dipakai di migration), tapi nama resmi field ini di
// Buku Panduan BUKAN "Esai Komitmen" — nama resminya "Komitmen kembali ke Indonesia, rencana pasca
// studi, dan rencana kontribusi di Indonesia", panjang 1.500–2.000 kata (rentang, BUKAN maksimal 1.500).
export const ESSAY_TYPES: Record<LpdpEssayType, { label: string; minWords: number | null; maxWords: number | null; hint: string }> = {
  profil_diri: {
    label: 'Profil Diri',
    minWords: null,
    maxWords: null,
    hint: 'Syarat resmi yang terkonfirmasi: wajib mencantumkan riwayat pendidikan yang TIDAK diselesaikan/drop out, bukan hanya yang berhasil. Struktur Kekuatan/Kelemahan/Pengalaman Relevan adalah pola umum tampilan form portal (belum terkonfirmasi tertulis di buku panduan resmi) — cek tampilan form asli saat login untuk field pastinya.',
  },
  esai_komitmen: {
    label: 'Komitmen Kembali ke Indonesia, Rencana Pasca Studi & Kontribusi',
    minWords: 1500,
    maxWords: 2000,
    hint: 'Panjang resmi 1.500–2.000 kata (rentang, bukan maksimal 1.500). Wajib menjelaskan: komitmen kembali ke Indonesia, rencana pasca studi, dan rencana kontribusi di Indonesia — disertai bentuk pengabdian di bidang/industri yang sesuai program studi tujuan.',
  },
}
