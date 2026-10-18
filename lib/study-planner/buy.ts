import { loadEnvKey } from '@/lib/env'

// Tautan pembelian produk lynk.id "Akses Database STUDY PLANNER by Awardee.id" (URL publik, bukan rahasia).
// Bisa ditimpa lewat env STUDY_PLANNER_LYNK_URL bila produk dipindah.
export const studyPlannerBuyUrl = () => loadEnvKey('STUDY_PLANNER_LYNK_URL') || 'https://lynk.id/dendhana/x4ggjep9mg0l'

// Tautan pembelian versi internasional (USD). Diisi setelah produk lynk.id internasional dibuat; bisa ditimpa env STUDY_PLANNER_LYNK_URL_EN.
export const studyPlannerBuyUrlEn = () => loadEnvKey('STUDY_PLANNER_LYNK_URL_EN') || 'https://lynk.id/dendhana/mk992kg57v62'

// Halaman penjualan (tahap funnel setelah hasil kuis gratis). Tombol "Akses Database" di hasil kuis mengarah ke sini, bukan langsung ke lynk.id.
export const salesPageUrl = () => loadEnvKey('STUDY_PLANNER_SALES_URL') || 'https://awardee.id/study-planner/'
export const salesPageUrlEn = () => loadEnvKey('STUDY_PLANNER_SALES_URL_EN') || 'https://awardee.id/study-planner/en/'
