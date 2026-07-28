// Link pembayaran membership via lynk.id (one-time payment per bulan, tanpa webhook/subscription API).
// Setelah user bayar, custom message produk lynk.id mengarahkan mereka WhatsApp bukti bayar ke
// +62 812-8721-2755 untuk aktivasi tier manual oleh admin — lihat catatan aktivasi di app/dashboard/page.tsx.
//
// Produk lynk.id di-rename & harga di-update manual ke harga PROMO (Rp25K/Rp74,5K/Rp120K) selama
// slot promo tier_promo_slots masih tersedia — lihat lib/tier.ts TIER_PRICE_PROMO/TIER_PROMO_CAP.
// ⚠️ Begitu slot sebuah tier penuh (cek /admin/users atau tabel tier_promo_slots), harga produk
// tier itu di lynk.id HARUS diganti manual ke harga normal (Rp49K/Rp149K/Rp240K) — tidak otomatis.
// Admin tetap verifikasi manual via WhatsApp harga mana yang dibayar user sebelum aktivasi tier.
import { TIER_PRICE } from './tier'

export const LYNK_MEMBERSHIP_LINKS: Record<'starter' | 'vip' | 'vvip', string> = {
  starter: 'https://lynk.id/dendhana/lz94p2kkeolo',
  vip: 'https://lynk.id/dendhana/89j75y5pv80o',
  vvip: 'https://lynk.id/dendhana/067n847p7vv7',
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

// 3 kelompok harga (presentasi) di atas 4 tier database (free/starter/vip/vvip) — VIP & VVIP
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
    label: 'Starter',
    price: TIER_PRICE.starter,
    priceNote: '/bulan',
    tagline: 'Buka fitur inti persiapan beasiswa',
    features: [
      'Semua fitur Free',
      '20 pertanyaan chat/hari (AAS, LPDP, & CS)',
      'Learning Modules — materi #GaliDiri, essay, interview + kuis',
      'Scholarship Tracker — pantau progres tiap tahapan',
      'Checklist Dokumen lengkap per jenis beasiswa',
      'Achievements & badge progres',
    ],
    cta: { label: 'Pilih Starter', href: LYNK_MEMBERSHIP_LINKS.starter, external: true },
  },
  {
    id: 'mid-high',
    label: 'VIP & VVIP',
    price: `${TIER_PRICE.vip}–${TIER_PRICE.vvip}`,
    priceNote: '/bulan',
    tagline: 'Pendampingan lebih dalam sampai siap submit aplikasi',
    features: [
      'Semua fitur Starter',
      'Kalender Beasiswa & IELTS Tracker (VIP)',
      'CV Analyzer (VIP)',
      'Essay Workshop + kritik AI mendalam (VVIP)',
      'Chat hampir tanpa batas (50–999 pertanyaan/hari)',
    ],
    cta: { label: `VIP — ${TIER_PRICE.vip}/bulan`, href: LYNK_MEMBERSHIP_LINKS.vip, external: true },
    ctaSecondary: { label: `VVIP — ${TIER_PRICE.vvip}/bulan`, href: LYNK_MEMBERSHIP_LINKS.vvip, external: true },
    highlighted: true,
  },
]
