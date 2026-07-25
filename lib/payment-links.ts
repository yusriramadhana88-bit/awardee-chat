// Link pembayaran membership via lynk.id (one-time payment per bulan, tanpa webhook/subscription API).
// Setelah user bayar, custom message produk lynk.id mengarahkan mereka WhatsApp bukti bayar ke
// +62 812-8721-2755 untuk aktivasi tier manual oleh admin — lihat catatan aktivasi di app/dashboard/page.tsx.
//
// GANTI placeholder di bawah dengan link produk lynk.id asli setelah produk dibuat (lihat plan
// validated-toasting-nebula.md langkah 9).
import { TIER_PRICE } from './tier'

export const LYNK_MEMBERSHIP_LINKS: Record<'kopi' | 'starter' | 'pro', string> = {
  kopi: 'https://lynk.id/dendhana/lz94p2kkeolo',
  starter: 'https://lynk.id/dendhana/89j75y5pv80o',
  pro: 'https://lynk.id/dendhana/067n847p7vv7',
}

export type PricingCta = { label: string; href: string; external: boolean }

export type PricingGroup = {
  id: 'free' | 'low' | 'mid-high'
  label: string
  price: string
  priceNote: string
  tagline: string
  features: string[]
  cta: PricingCta
  ctaSecondary?: PricingCta
  highlighted?: boolean
}

// 3 kelompok harga (presentasi) di atas 4 tier database (free/kopi/starter/pro) — Starter & Pro
// digabung jadi satu kelompok "mid-high" karena keduanya sama-sama pendampingan lanjutan,
// tapi tetap 2 tombol bayar terpisah karena harga & fiturnya beda di database.
export const PRICING_GROUPS: PricingGroup[] = [
  {
    id: 'free',
    label: 'Free',
    price: TIER_PRICE.free,
    priceNote: 'selamanya',
    tagline: 'Mulai coba tanpa risiko, tanpa kartu kredit',
    features: [
      'Chat AI Den Dhana (CS & konsultan) — 5 pertanyaan/hari',
      'Akses dashboard AWARDEE APP',
      'Checklist Dokumen dasar',
      'Awardee Alumni & program afiliasi',
    ],
    cta: { label: 'Daftar Gratis', href: '/register', external: false },
  },
  {
    id: 'low',
    label: 'Kopi',
    price: TIER_PRICE.kopi,
    priceNote: '/bulan',
    tagline: 'Harga secangkir kopi, buka fitur inti persiapan beasiswa',
    features: [
      'Semua fitur Free',
      '20 pertanyaan chat/hari (AAS, LPDP, & CS)',
      'Learning Modules — materi #GaliDiri, essay, interview + kuis',
      'Scholarship Tracker — pantau progres tiap tahapan',
      'Checklist Dokumen lengkap per jenis beasiswa',
      'Achievements & badge progres',
    ],
    cta: { label: 'Pilih Kopi', href: LYNK_MEMBERSHIP_LINKS.kopi, external: true },
  },
  {
    id: 'mid-high',
    label: 'Starter & Pro',
    price: `${TIER_PRICE.starter}–${TIER_PRICE.pro}`,
    priceNote: '/bulan',
    tagline: 'Pendampingan lebih dalam sampai siap submit aplikasi',
    features: [
      'Semua fitur Kopi',
      'Kalender Beasiswa & IELTS Tracker (Starter)',
      'CV Analyzer (Starter)',
      'Essay Workshop + kritik AI mendalam (Pro)',
      'Chat hampir tanpa batas (50–999 pertanyaan/hari)',
    ],
    cta: { label: `Starter — ${TIER_PRICE.starter}/bulan`, href: LYNK_MEMBERSHIP_LINKS.starter, external: true },
    ctaSecondary: { label: `Pro — ${TIER_PRICE.pro}/bulan`, href: LYNK_MEMBERSHIP_LINKS.pro, external: true },
    highlighted: true,
  },
]
