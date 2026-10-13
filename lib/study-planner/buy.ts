import { loadEnvKey } from '@/lib/env'

// Tautan pembelian produk lynk.id "Akses Database STUDY PLANNER by Awardee.id" (URL publik, bukan rahasia).
// Bisa ditimpa lewat env STUDY_PLANNER_LYNK_URL bila produk dipindah.
export const studyPlannerBuyUrl = () => loadEnvKey('STUDY_PLANNER_LYNK_URL') || 'https://lynk.id/dendhana/x4ggjep9mg0l'
