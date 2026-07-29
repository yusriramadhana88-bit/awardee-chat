// Link pembelian Booster Kuota AI ("Extra Kuota Kecil/Sedang/Besar" di lynk.id) — one-time payment,
// tanpa webhook/subscription API, sama pola dengan LYNK_MEMBERSHIP_LINKS di lib/payment-links.ts.
// Setelah user bayar, custom message produk lynk.id mengarahkan mereka WhatsApp bukti bayar ke
// +62 812-8721-2755 untuk aktivasi manual oleh admin (lihat /admin/users, tab Booster Kuota AI).
//
// Paket & harga: lihat TOPUP_PACKAGES di lib/ai-quota.ts — id di sana (booster_kecil/sedang/besar)
// berkorespondensi 1:1 dengan link di bawah ini.
export const LYNK_TOPUP_LINKS: Record<'booster_kecil' | 'booster_sedang' | 'booster_besar', string> = {
  booster_kecil: 'https://lynk.id/dendhana/ndv4n887ynz3',
  booster_sedang: 'https://lynk.id/dendhana/kogzx8r20o12',
  booster_besar: 'https://lynk.id/dendhana/xkzyrxmy16gg',
}
