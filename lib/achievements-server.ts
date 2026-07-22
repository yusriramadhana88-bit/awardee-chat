import { SupabaseClient } from '@supabase/supabase-js'

// Cek dan berikan achievement ke user jika syarat terpenuhi dan belum pernah didapat.
// Dipanggil dari API route dengan admin client (service role) — tidak boleh dipanggil dari client.
export async function awardAchievement(admin: SupabaseClient, userId: string, code: string): Promise<boolean> {
  const { data: achievement } = await admin.from('achievements').select('id').eq('code', code).single()
  if (!achievement) return false

  const { data: existing } = await admin
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievement.id)
    .maybeSingle()
  if (existing) return false

  await admin.from('user_achievements').insert({ user_id: userId, achievement_id: achievement.id })
  return true
}

export async function checkLessonAchievements(admin: SupabaseClient, userId: string, moduleId: string): Promise<string[]> {
  const newlyAwarded: string[] = []

  const { count: totalCompleted } = await admin
    .from('user_lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((totalCompleted ?? 0) >= 1) {
    if (await awardAchievement(admin, userId, 'first_lesson')) newlyAwarded.push('first_lesson')
  }

  const { data: moduleLessons } = await admin.from('lessons').select('id').eq('module_id', moduleId)
  const { data: completedInModule } = await admin
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', (moduleLessons || []).map(l => l.id))

  if ((moduleLessons?.length ?? 0) > 0 && (completedInModule?.length ?? 0) >= (moduleLessons?.length ?? 0)) {
    if (await awardAchievement(admin, userId, 'module_complete')) newlyAwarded.push('module_complete')
  }

  return newlyAwarded
}

export async function checkQuizAchievements(admin: SupabaseClient, userId: string, passed: boolean, score: number, total: number): Promise<string[]> {
  const newlyAwarded: string[] = []
  if (passed) {
    if (await awardAchievement(admin, userId, 'first_quiz_pass')) newlyAwarded.push('first_quiz_pass')
  }
  if (total > 0 && score === total) {
    if (await awardAchievement(admin, userId, 'perfect_quiz')) newlyAwarded.push('perfect_quiz')
  }
  return newlyAwarded
}
