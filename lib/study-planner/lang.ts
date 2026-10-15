'use client'

import { useEffect, useState } from 'react'

export type Lang = 'id' | 'en'
const KEY = 'sp_lang'

/** Pilihan bahasa tersimpan di browser; bila belum memilih, ikuti bahasa browser (Indonesia -> id, lainnya -> en). */
export function getLang(): Lang {
  try {
    const v = window.localStorage.getItem(KEY)
    if (v === 'id' || v === 'en') return v
  } catch {}
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('id') ? 'id' : 'en'
}

export function useLang() {
  const [lang, setL] = useState<Lang>('id')
  useEffect(() => {
    setL(getLang())
    const h = () => setL(getLang())
    window.addEventListener('sp-lang', h)
    return () => window.removeEventListener('sp-lang', h)
  }, [])
  const setLang = (l: Lang) => {
    try { window.localStorage.setItem(KEY, l) } catch {}
    window.dispatchEvent(new Event('sp-lang'))
  }
  return { lang, setLang }
}

export const T = {
  id: {
    title: 'Database STUDY PLANNER', loading: 'Memuat database…', loadErr: 'Gagal memuat database. Muat ulang halaman.',
    lockedTitle: 'Akses Database STUDY PLANNER',
    lockedBody: 'Buka semua program D1–S3 di Australia yang cocok dengan profilmu, kode CRICOS siap salin, link resmi, peringkat QS & THE, serta 400+ beasiswa pascasarjana.',
    lockedPrice: 'Sekali bayar, akses selamanya · promo untuk 88 pembeli pertama', getAccess: 'Dapatkan Akses',
    lockedHelp: (email: string) => `Sudah bayar tapi belum terbuka? Pastikan kamu masuk dengan email/HP yang sama dengan saat membeli (${email || 'akunmu'}), atau `,
    contactWa: 'hubungi kami di WhatsApp', waMsg: (email: string) => 'Halo, saya sudah bayar Akses Database STUDY PLANNER tapi belum terbuka. Email: ' + email,
    stats: (p: string, i: number, u: number, s: number, snap: string) => `${p} program · ${i} institusi · ${u} universitas · ${s} beasiswa pascasarjana · data ${snap}`,
    quizBtn: '🎯 Cari lewat kuis (7 pertanyaan)', quizTitle: 'Kuis pencarian · 7 pertanyaan', quizBusy: 'Mencari program yang cocok…', quizFail: 'Gagal memproses kuis. Coba lagi.',
    quizResult: (n: string, shown: number, total: number) => `${n} program cocok dengan profilmu${total > shown ? `, ${shown} teratas ditampilkan` : ''}, urut dari yang paling cocok.`,
    sendWa: '📲 Kirim ke WhatsApp', waShare: (items: string) => `MINI STUDY PLANNER-ku (Awardee.id)

${items}

Cek semua program lain di Database Study Planner.`,
    quizResultLabel: 'Hasil kuis:', quizGeneric: ' Targetmu belum spesifik, jadi dimulai dari program umum.', quizAgain: 'Ulangi kuis', quizBack: 'Kembali ke pencarian bebas',
    tabProgram: 'Program studi', tabSch: 'Beasiswa kampus', level: 'Jenjang', allLevels: 'Semua jenjang',
    search: (p: boolean) => `Cari ${p ? 'nama program / kampus' : 'beasiswa'}`, searchPh: (p: boolean) => (p ? 'ketik 2 huruf, mis. pub → Public Policy, Public Health' : 'mis. women, merit, engineering'),
    campus: 'Kampus (ketik namanya)', campusPh: 'mis. Monash, Flinders, Curtin', field: 'Bidang', allFields: 'Semua bidang', state: 'Negara bagian', allStates: 'Semua negara bagian',
    city: 'Kota (ketik namanya)', cityPh: 'mis. Canberra, Perth, Hobart', ielts: 'IELTS maksimal yang diminta', all: 'Semua', tuitionMax: 'Total biaya kuliah maks. (AUD)',
    sort: 'Urutkan berdasarkan', sortRank: 'Peringkat kampus (QS/THE)', sortTuition: 'Total biaya kuliah', sortName: 'Nama program', sortDur: 'Durasi studi', sortIelts: 'Syarat IELTS', sortRel: 'Paling cocok (hasil kuis)', sortAmount: 'Nominal beasiswa', sortDeadline: 'Tenggat pendaftaran', dirLabel: 'Arah urutan', dirAsc: 'Naik ↑ (terkecil, termurah, terbaik, A–Z dulu)', dirDesc: 'Turun ↓ (terbesar, termahal, Z–A dulu)', aasOnly: 'Hanya kampus peserta AAS',
    searching: 'Mencari…', results: (n: string, p: number, pages: number) => `${n} hasil · halaman ${p} dari ${pages}`, curatedNote: ' · ★ = universitas dengan data syarat bahasa terverifikasi',
    none: 'Tidak ada hasil. Longgarkan filter atau ubah kata kunci.', prev: '← Sebelumnya', next: 'Berikutnya →',
    notFound: 'Tidak ditemukan', clear: 'Hapus',
    disclaimer: 'Angka biaya adalah estimasi biaya kuliah saja (belum termasuk biaya hidup). Selalu verifikasi syarat bahasa, biaya, dan jadwal di halaman resmi kampus sebelum mendaftar.',
    fitIn: 'Cocok di: ', priority: 'Bidang prioritas', duration: (y: string) => `${y} tahun`, durationNone: 'durasi ikut kampus',
    cost: (t: string, y: string | null) => `total ±${t}${y ? ` (±${y}/tahun)` : ''}`, costNone: 'biaya: cek halaman resmi',
    langReq: (o: string, b: string | null, src: string) => `IELTS ${o}${b ? ` (band ≥ ${b})` : ''} · ${src === 'program' ? 'program' : 'kampus'}`, langNone: 'syarat bahasa: cek halaman resmi', intakeGeneral: ' (umum)',
    cricosProg: 'Kode CRICOS program:', campusCode: 'Kampus:', copied: 'Tersalin ✓', topics: 'Bidang:', intl: 'Mahasiswa internasional:',
    careers: 'Karier ke depan (dipetakan otomatis ke klasifikasi pekerjaan resmi Australia, bukan jaminan):', median: (n: string) => ` — median AUD ${n}/minggu`,
    schLink: (n: number, u: string) => `Lihat ${n} beasiswa pascasarjana di ${u} →`, officialProg: (t: string) => `Halaman resmi program (${t}) ↗`,
    perYear: 'tahun', upTo: 'hingga', amountNone: 'nominal: lihat halaman resmi', closes: 'tutup', recipients: (n: number) => `${n} penerima/tahun`, researchOnly: 'khusus riset',
    citizenship: 'Kewarganegaraan:', eligibility: 'Syarat ringkas:', officialSch: 'Halaman resmi beasiswa ↗', checkSch: 'Selalu cek ulang syarat & tenggat di halaman resmi sebelum mendaftar.',
    version: 'Versi', dataAsOf: 'Data per',
    headerSub: 'Study Planner', logout: 'Keluar', langLabel: 'Bahasa',
  },
  en: {
    title: 'STUDY PLANNER Database', loading: 'Loading database…', loadErr: 'Could not load the database. Please reload the page.',
    lockedTitle: 'STUDY PLANNER Database Access',
    lockedBody: 'Unlock every D1–PhD program in Australia that fits your profile, copy-ready CRICOS codes, official links, QS & THE rankings, and 400+ postgraduate scholarships.',
    lockedPrice: 'One-time payment, lifetime access · launch promo', getAccess: 'Get Access',
    lockedHelp: (email: string) => `Paid but still locked? Make sure you sign in with the same email/phone you used at checkout (${email || 'your account'}), or `,
    contactWa: 'contact us on WhatsApp', waMsg: (email: string) => 'Hi, I paid for STUDY PLANNER Database Access but it is still locked. Email: ' + email,
    stats: (p: string, i: number, u: number, s: number, snap: string) => `${p} programs · ${i} institutions · ${u} universities · ${s} postgraduate scholarships · data ${snap}`,
    quizBtn: '🎯 Find with the quiz (7 questions)', quizTitle: 'Search quiz · 7 questions', quizBusy: 'Finding matching programs…', quizFail: 'Could not process the quiz. Please try again.',
    quizResult: (n: string, shown: number, total: number) => `${n} programs match your profile${total > shown ? `, top ${shown} shown` : ''}, best match first.`,
    sendWa: '📲 Send to WhatsApp', waShare: (items: string) => `My MINI STUDY PLANNER (Awardee.id)

${items}

See all other programs in the Study Planner Database.`,
    quizResultLabel: 'Quiz results:', quizGeneric: ' Your goal is not specific yet, so we started from general programs.', quizAgain: 'Retake the quiz', quizBack: 'Back to free search',
    tabProgram: 'Programs', tabSch: 'University scholarships', level: 'Level', allLevels: 'All levels',
    search: (p: boolean) => `Search ${p ? 'program / campus name' : 'scholarships'}`, searchPh: (p: boolean) => (p ? 'type 2 letters, e.g. pub → Public Policy, Public Health' : 'e.g. women, merit, engineering'),
    campus: 'Campus (type a name)', campusPh: 'e.g. Monash, Flinders, Curtin', field: 'Field', allFields: 'All fields', state: 'State / territory', allStates: 'All states & territories',
    city: 'City (type a name)', cityPh: 'e.g. Canberra, Perth, Hobart', ielts: 'Max IELTS required', all: 'All', tuitionMax: 'Max total tuition (AUD)',
    sort: 'Sort by', sortRank: 'Campus ranking (QS/THE)', sortTuition: 'Total tuition', sortName: 'Program name', sortDur: 'Study duration', sortIelts: 'IELTS requirement', sortRel: 'Best match (quiz result)', sortAmount: 'Scholarship amount', sortDeadline: 'Application deadline', dirLabel: 'Order', dirAsc: 'Ascending ↑ (lowest, cheapest, best, A–Z first)', dirDesc: 'Descending ↓ (highest, most expensive, Z–A first)', aasOnly: 'AAS participating campuses only',
    searching: 'Searching…', results: (n: string, p: number, pages: number) => `${n} results · page ${p} of ${pages}`, curatedNote: ' · ★ = university with verified English requirements',
    none: 'No results. Loosen the filters or change the keyword.', prev: '← Previous', next: 'Next →',
    notFound: 'Not found', clear: 'Clear',
    disclaimer: 'Costs are tuition estimates only (living costs not included). Always verify English requirements, costs and intake dates on the official campus page before applying.',
    fitIn: 'Matches: ', priority: 'Priority field', duration: (y: string) => `${y} year${y === '1' ? '' : 's'}`, durationNone: 'duration set by the campus',
    cost: (t: string, y: string | null) => `total ±${t}${y ? ` (±${y}/year)` : ''}`, costNone: 'cost: see the official page',
    langReq: (o: string, b: string | null, src: string) => `IELTS ${o}${b ? ` (bands ≥ ${b})` : ''} · ${src === 'program' ? 'program' : 'campus'}`, langNone: 'English requirement: see the official page', intakeGeneral: ' (typical)',
    cricosProg: 'Program CRICOS code:', campusCode: 'Campus:', copied: 'Copied ✓', topics: 'Fields:', intl: 'International students:',
    careers: 'Career paths (auto-mapped to official Australian occupation classifications, not a guarantee):', median: (n: string) => ` — median AUD ${n}/week`,
    schLink: (n: number, u: string) => `See ${n} postgraduate scholarships at ${u} →`, officialProg: (t: string) => `Official program page (${t}) ↗`,
    perYear: 'year', upTo: 'up to', amountNone: 'amount: see the official page', closes: 'closes', recipients: (n: number) => `${n} recipients/year`, researchOnly: 'research only',
    citizenship: 'Citizenship:', eligibility: 'Eligibility (summary):', officialSch: 'Official scholarship page ↗', checkSch: 'Always re-check eligibility and deadlines on the official page before applying.',
    version: 'Version', dataAsOf: 'Data as of',
    headerSub: 'Study Planner', logout: 'Sign out', langLabel: 'Language',
  },
}
