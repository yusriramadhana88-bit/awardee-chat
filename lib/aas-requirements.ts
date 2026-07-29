// Client-safe: checklist dokumen & pertanyaan supporting statement resmi AAS, dipakai UI dan
// sistem prompt AAS Center. Sumber: Australia Awards Scholarships Policy Handbook (November 2025)
// + Preview Form AAS Regular Application Portal Masters 2027 Intake — lihat
// knowledge/aas-handbook.txt untuk detail lengkap. Jangan tambah/ubah kriteria tanpa mengacu ke situ.
//
// CATATAN JADWAL: form sumber (Intake 2027) menyebut deadline 30 April 2026 — sudah lewat dari
// tanggal berjalan sesi ini. Siklus intake berikutnya (tanggal pasti) BELUM terkonfirmasi dari
// dokumen resmi manapun di proyek ini — jangan tampilkan countdown ke tanggal spesifik, arahkan
// user cek jadwal terbaru di situs resmi australiaawardsindonesia.org.

export type AasApplicantCategory = 'etg' | 'goi' | 'general'
export type AasJenjang = 'master' | 'doktor'
export type AasStatusKerja = 'pns' | 'swasta' | 'fresh_graduate' | 'lainnya'

export type AasProfileLite = {
  applicant_category: AasApplicantCategory | null
  jenjang: AasJenjang | null
  status_kerja: AasStatusKerja | null
}

// Batas ukuran file upload — 2MB adalah batas KERAS sistem OASIS resmi (bukan sekadar warning
// seperti di LPDP), jadi di sini langsung jadi hard limit, tidak ada tingkat "warning" terpisah.
export const MAX_FILE_BYTES = 2 * 1024 * 1024

export type AasDoc = {
  key: string
  label: string
  wajib: boolean
  hint: string
  acceptedTypes: Array<'pdf' | 'jpg' | 'png' | 'docx'> // docx hanya untuk slot CV (lihat catatan di bawah) — dokumen resmi AAS lain TIDAK menerima Word
  appliesTo: (p: AasProfileLite) => boolean
}

const ALWAYS = () => true

export const AAS_DOCS: AasDoc[] = [
  {
    key: 'akta-kelahiran',
    label: 'Akta Kelahiran',
    wajib: true,
    hint: 'Akta kelahiran asli atau dokumen setara, tersertifikasi (disahkan pihak berwenang: instansi penerbit, kedutaan Australia, atau notaris) — bukan applicant sendiri.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'ktp',
    label: 'KTP (Bukti Kewarganegaraan)',
    wajib: true,
    hint: 'KTP yang masih berlaku, foto/scan jelas, NIK dan nama terbaca, tersertifikasi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'cv',
    label: 'Curriculum Vitae (CV)',
    wajib: true,
    hint: 'CV terbaru yang menjelaskan singkat riwayat kerja & tanggung jawab (dan pengalaman riset kalau relevan dengan pendaftaran). Catatan: form OASIS asli hanya menerima PDF/Image untuk upload resmi — Word diterima DI SINI khusus untuk kemudahan review AI, bukan format yang bisa langsung dipakai submit ke OASIS.',
    acceptedTypes: ['pdf', 'jpg', 'png', 'docx'],
    appliesTo: ALWAYS,
  },
  {
    key: 'ijazah',
    label: 'Ijazah S1/D4 (+ D3 kalau relevan)',
    wajib: true,
    hint: 'Salinan tersertifikasi ijazah/testamur asli. Kalau tidak berbahasa Inggris, wajib disertai terjemahan tersertifikasi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'transkrip',
    label: 'Transkrip Nilai S1/D4 (+ D3 kalau relevan)',
    wajib: true,
    hint: 'Salinan tersertifikasi transkrip akademik asli. Kalau tidak berbahasa Inggris, wajib disertai terjemahan tersertifikasi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'sertifikat-bahasa',
    label: 'Sertifikat IELTS/TOEFL/PTE',
    wajib: true,
    hint: 'Hasil tes asli & current, valid sampai 1 Januari tahun mulai studi. Skor minimum: IELTS 6.5 (tiap band >=6.0), TOEFL iBT 84 (tiap subtes >=21), atau PTE Academic 58 (tiap skill >=50) — angka ini TIDAK bisa dinegosiasi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'nominating-agency',
    label: 'Nominating Agency Declaration',
    wajib: true,
    hint: 'WAJIB hanya untuk pelamar berstatus PNS/Civil Servant — pakai template resmi Nominating Agency Declaration.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.status_kerja === 'pns',
  },
  {
    key: 'sk-pengangkatan',
    label: 'SK Pengangkatan PNS',
    wajib: true,
    hint: 'WAJIB hanya untuk pelamar berstatus PNS/Civil Servant.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.status_kerja === 'pns',
  },
  {
    key: 'referee-1',
    label: 'Reference Letter 1',
    wajib: true,
    hint: 'Minimal 1 referee akademik. Pelamar Master by Research/PhD wajib 2 referee akademik. Pakai template Referee Report Template resmi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'referee-2',
    label: 'Reference Letter 2',
    wajib: true,
    hint: 'Referee kedua — akademik atau non-akademik (misal atasan kerja), pakai template Referee Report Template resmi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'terjemahan-akta',
    label: 'Terjemahan Resmi Akta Kelahiran',
    wajib: false,
    hint: 'Wajib disertakan hanya kalau dokumen asli tidak berbahasa Inggris — harus tersertifikasi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'terjemahan-ijazah-transkrip',
    label: 'Terjemahan Resmi Ijazah & Transkrip',
    wajib: false,
    hint: 'Wajib disertakan hanya kalau dokumen asli tidak berbahasa Inggris — harus tersertifikasi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'referensi-pembimbing-s1',
    label: 'Referensi Pembimbing S1 (opsional)',
    wajib: false,
    hint: 'Opsional untuk pelamar Master — memperkuat aplikasi kalau ada hubungan riset dengan pembimbing S1.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
  {
    key: 'publikasi',
    label: 'Daftar Publikasi/Tesis (opsional)',
    wajib: false,
    hint: 'Untuk pelamar dengan komponen riset (Master by Research/PhD) — daftar publikasi atau tesis yang belum dipublikasi.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: (p) => p.jenjang === 'doktor',
  },
  {
    key: 'korespondensi-kampus',
    label: 'Korespondensi dengan Universitas Australia (opsional)',
    wajib: false,
    hint: 'Opsional — bukti komunikasi relevan dengan calon supervisor/universitas tujuan, kalau ada.',
    acceptedTypes: ['pdf', 'jpg', 'png'],
    appliesTo: ALWAYS,
  },
]

export function applicableDocs(p: AasProfileLite): AasDoc[] {
  return AAS_DOCS.filter((d) => d.appliesTo(p))
}

export type AasEssayType = 'kepemimpinan_dampak' | 'rencana_reintegrasi'

// Batas resmi form OASIS: MAKSIMAL 2000 KARAKTER per pertanyaan (bukan kata, bukan gabungan) —
// jawaban lebih tidak akan dipertimbangkan sistem. Ditegakkan per kotak jawaban di UI (satu
// textarea per pertanyaan) dan divalidasi ulang di server — lihat app/api/aas/essay-review.
export const MAX_CHARS_PER_QUESTION = 2000

// maxChars di sini = jumlah pertanyaan digabung x 2000 + buffer (dipakai untuk info/progres total,
// BUKAN gate keras lagi — gate keras sekarang per pertanyaan via MAX_CHARS_PER_QUESTION).
export const ESSAY_TYPES: Record<AasEssayType, { label: string; maxChars: number; questions: string[]; hint: string }> = {
  kepemimpinan_dampak: {
    label: 'Alasan Studi, Dampak & Kepemimpinan',
    maxChars: 6500,
    questions: [
      'Why did you choose your proposed course and institution? (sertakan riset yang sudah dilakukan)',
      'What impact do you believe this study will have on your career, life and community?',
      'How have you contributed to solving a challenge or implementing change or reform in the context of one of the AAI priority development areas? (sebutkan aspek kepemimpinan spesifik, siapa yang diajak kerja sama, metode kreatif apa)',
    ],
    hint: 'Gabungan 3 pertanyaan resmi form OASIS — tempel jawaban masing-masing pertanyaan (maks 2000 karakter/pertanyaan, TIDAK bisa dinegosiasi sistem). Dinilai terhadap rubrik resmi Program Area: akademik kuat + kapasitas kepemimpinan strategis + potensi dampak nyata ke pembangunan Indonesia.',
  },
  rencana_reintegrasi: {
    label: 'Rencana Reintegrasi (Kembali ke Indonesia)',
    maxChars: 4500,
    questions: [
      'Please provide three practical and realistic examples of how you intend to use the knowledge, skills and connections you will gain from your scholarship on your return to Indonesia.',
      'List any possible constraints you think may prevent you from achieving above tasks (sertakan mitigasinya).',
    ],
    hint: 'Ini SETARA dengan "Reintegration Plan" wajib di Policy Handbook — panel seleksi menilai seberapa matang & realistis rencana ini, bukan cuma soal niat baik generik.',
  },
}
