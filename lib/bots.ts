// Konfigurasi 3 chatbot Awardee.id — dipakai oleh ChatUI, halaman chat, dashboard, dan demo page.
// Client-safe (tidak ada fs/server-only import di sini).

export type BotId = 'cs' | 'aas' | 'lpdp'

export type BotConfig = {
  id: BotId
  path: string
  navLabel: string
  navIcon: string
  title: string
  subtitle: string
  welcome: string
  guestAllowed: boolean
}

export const BOTS: Record<BotId, BotConfig> = {
  cs: {
    id: 'cs',
    path: '/chat',
    navLabel: 'Tanya Produk & Layanan',
    navIcon: '💬',
    title: 'Den Dhana AI',
    subtitle: 'Customer Service · Online 24/7',
    welcome:
      'Hei! 👋 Aku Den Dhana dari Awardee.id. Lagi butuh info soal apa nih — Konsultasi Beasiswa, Persiapan Dokumen, Private Mentoring, Penerjemah Tersumpah, atau produk digital kami? Cerita aja, nanti aku arahkan ke yang paling pas buat kamu. Gratis buat coba — dan kalau cocok, boleh juga daftar member gratis biar pengalamannya lebih lengkap 😊',
    guestAllowed: true,
  },
  aas: {
    id: 'aas',
    path: '/chat/aas',
    navLabel: 'Chat AAS · Den Dhana',
    navIcon: '🇦🇺',
    title: 'Den Dhana AI — AAS',
    subtitle: 'Konsultan Persiapan Australia Awards',
    welcome:
      'Hei! Aku Den Dhana 👋 Aku awardee AAS ke Australia dan sudah 7+ tahun bantu orang-orang lolos AAS. Kamu lagi di tahap apa — masih riset, nyusun essay, atau udah masuk interview? Cerita ke aku, biar kita GALI DIRI kamu bareng-bareng.',
    guestAllowed: false,
  },
  lpdp: {
    id: 'lpdp',
    path: '/chat/lpdp',
    navLabel: 'Chat LPDP · Den Dhana',
    navIcon: '🇮🇩',
    title: 'Den Dhana AI — LPDP',
    subtitle: 'Konsultan Persiapan LPDP',
    welcome:
      'Hei! Aku Den Dhana 👋 Aku sudah bantu banyak pejuang LPDP dari seleksi administrasi sampai wawancara. Kamu lagi di tahap apa — nyiapin Profil Diri, seleksi bakat skolastik, atau udah masuk substansi/wawancara? Cerita ke aku, biar aku bantu strateginya.',
    guestAllowed: false,
  },
}

export const BOT_LIST: BotConfig[] = [BOTS.cs, BOTS.aas, BOTS.lpdp]
