// Level system untuk AWARDEE APP — dipakai di CV, Essay, IELTS, Interview, dan dashboard overview

export type Level = {
  name: string
  emoji: string
  color: string        // Tailwind text color class
  bgColor: string      // Tailwind bg color class
  borderColor: string  // Tailwind border color class
  message: string      // Pesan motivasi singkat
}

// Skala 1-10 untuk CV Analyzer & Essay Workshop
export const SCORE_LEVELS: Record<number, Level> = {
  1:  { name: 'Baru Niat',      emoji: '😴', color: 'text-gray-500',    bgColor: 'bg-gray-100',    borderColor: 'border-gray-200',   message: 'Semangat, perjalanan dimulai dari satu langkah!' },
  2:  { name: 'Masih Mager',    emoji: '🥱', color: 'text-gray-600',    bgColor: 'bg-gray-100',    borderColor: 'border-gray-200',   message: 'Yuk, gas dikit lagi! Kamu bisa.' },
  3:  { name: 'Mulai Gerak',    emoji: '🐢', color: 'text-yellow-700',  bgColor: 'bg-yellow-50',   borderColor: 'border-yellow-200', message: 'Pelan tapi pasti, arah udah bener!' },
  4:  { name: 'Pejuang Muda',   emoji: '⚡', color: 'text-yellow-600',  bgColor: 'bg-yellow-50',   borderColor: 'border-yellow-200', message: 'Semangat pejuang udah keliatan, terus!' },
  5:  { name: 'Setengah Jago',  emoji: '🔥', color: 'text-orange-600',  bgColor: 'bg-orange-50',   borderColor: 'border-orange-200', message: 'Separuh jalan udah kamu lewatin!' },
  6:  { name: 'Udah Lumayan',   emoji: '💪', color: 'text-sky-600',     bgColor: 'bg-sky-50',      borderColor: 'border-sky-200',    message: 'Makin solid nih, tinggal poles yang detail.' },
  7:  { name: 'Hampir Kece',    emoji: '🚀', color: 'text-sky-700',     bgColor: 'bg-sky-50',      borderColor: 'border-sky-200',    message: 'Udah kece, tinggal sedikit lagi ke puncak!' },
  8:  { name: 'Udah Gokil',     emoji: '🎯', color: 'text-blue-600',    bgColor: 'bg-blue-50',     borderColor: 'border-blue-200',   message: 'Kompetitif banget! Penilai bakal terkesan.' },
  9:  { name: 'Hampir Dewa',    emoji: '⭐', color: 'text-purple-600',  bgColor: 'bg-purple-50',   borderColor: 'border-purple-200', message: 'Selangkah lagi jadi legenda!' },
  10: { name: 'Dewa Beasiswa',  emoji: '👑', color: 'text-purple-700',  bgColor: 'bg-purple-50',   borderColor: 'border-purple-200', message: 'Sempurna! DenDhana setuju kamu siap kirim.' },
}

// IELTS overall score bands (0–9)
export const IELTS_LEVELS: Array<{ min: number; max: number } & Level> = [
  { min: 0,   max: 4.9, name: 'Baru Bangun',       emoji: '😪', color: 'text-gray-500',   bgColor: 'bg-gray-100',   borderColor: 'border-gray-200',   message: 'Mulai latihan rutin, ada jalan ke atas!' },
  { min: 5.0, max: 5.9, name: 'Masih Ngantuk',     emoji: '🥱', color: 'text-yellow-700', bgColor: 'bg-yellow-50',  borderColor: 'border-yellow-200', message: 'Terus latihan listening & reading ya.' },
  { min: 6.0, max: 6.9, name: 'Udah Melek',        emoji: '👀', color: 'text-orange-600', bgColor: 'bg-orange-50',  borderColor: 'border-orange-200', message: 'Skor 6.5 sudah cukup untuk banyak beasiswa!' },
  { min: 7.0, max: 7.9, name: 'Siap Terbang',      emoji: '✈️', color: 'text-sky-600',    bgColor: 'bg-sky-50',     borderColor: 'border-sky-200',    message: 'Keren! AAS & Chevening butuh minimal 6.5-7.0.' },
  { min: 8.0, max: 9.0, name: 'Beneran Gila Sih',  emoji: '🤯', color: 'text-purple-600', bgColor: 'bg-purple-50',  borderColor: 'border-purple-200', message: 'Skor dewa! Beasiswa terbaik nunggu kamu.' },
]

// Level "Pejuang Beasiswa" agregat untuk dashboard overview
export type PejuangLevel = {
  level: number  // 1-5
  name: string
  emoji: string
  color: string
  bgColor: string
  xp: number
  nextLevelXp: number
}

export const PEJUANG_LEVELS: Array<Omit<PejuangLevel, 'xp' | 'nextLevelXp'> & { minXp: number; maxXp: number }> = [
  { level: 1, minXp: 0,  maxXp: 9,  name: 'Calon Awardee',   emoji: '🌱', color: 'text-gray-600',   bgColor: 'bg-gray-100'   },
  { level: 2, minXp: 10, maxXp: 24, name: 'Pejuang Aktif',   emoji: '⚔️', color: 'text-yellow-700', bgColor: 'bg-yellow-50'  },
  { level: 3, minXp: 25, maxXp: 49, name: 'Warrior Beasiswa', emoji: '🛡️', color: 'text-orange-600', bgColor: 'bg-orange-50'  },
  { level: 4, minXp: 50, maxXp: 99, name: 'Veteran Lolos',   emoji: '🏆', color: 'text-sky-600',    bgColor: 'bg-sky-50'     },
  { level: 5, minXp: 100, maxXp: 9999, name: 'Legend Awardee', emoji: '👑', color: 'text-purple-700', bgColor: 'bg-purple-50' },
]

// Helper: dapatkan level dari skor 1-10
export function getScoreLevel(score: number | null): Level {
  if (!score || score < 1) return SCORE_LEVELS[1]
  const clamped = Math.min(10, Math.max(1, Math.round(score)))
  return SCORE_LEVELS[clamped]
}

// Helper: dapatkan level IELTS dari skor overall
export function getIeltsLevel(score: number | null): (typeof IELTS_LEVELS)[0] | null {
  if (score === null || score === undefined) return null
  return IELTS_LEVELS.find(l => score >= l.min && score <= l.max) ?? IELTS_LEVELS[0]
}

// Helper: konversi skor ke persentase untuk progress bar
export function scoreToPercent(score: number | null, max: number): number {
  if (!score) return 0
  return Math.round((Math.min(score, max) / max) * 100)
}

// Helper: hitung XP dari aktivitas user
export function calculateXp(data: {
  cvAnalysesCount: number
  essayReviewsCount: number
  testScoresCount: number
  applicationsCount: number
  lpdpDocChecksCount?: number
  lpdpEssayReviewsCount?: number
  aasDocChecksCount?: number
  aasEssayReviewsCount?: number
}): number {
  return (
    data.cvAnalysesCount * 5 +
    data.essayReviewsCount * 8 +
    data.testScoresCount * 3 +
    data.applicationsCount * 4 +
    (data.lpdpDocChecksCount ?? 0) * 3 +
    (data.lpdpEssayReviewsCount ?? 0) * 8 +
    (data.aasDocChecksCount ?? 0) * 3 +
    (data.aasEssayReviewsCount ?? 0) * 8
  )
}

// Helper: dapatkan level Pejuang Beasiswa dari XP
export function getPejuangLevel(xp: number): PejuangLevel {
  const found = [...PEJUANG_LEVELS].reverse().find(l => xp >= l.minXp) ?? PEJUANG_LEVELS[0]
  const nextLevel = PEJUANG_LEVELS.find(l => l.level === found.level + 1)
  return {
    level: found.level,
    name: found.name,
    emoji: found.emoji,
    color: found.color,
    bgColor: found.bgColor,
    xp,
    nextLevelXp: nextLevel?.minXp ?? found.maxXp,
  }
}
