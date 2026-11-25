// Tautan buat/atur password yang TIDAK bergantung pada Redirect URL / Site URL di dashboard Supabase.
// Memakai hashed_token dari admin.generateLink lalu diverifikasi di /reset-password (verifyOtp di klien),
// sehingga tidak bisa nyasar ke localhost:3000 dan tidak terkena batas email bawaan Supabase.
export const MEMBER_BASE_URL = 'https://member.awardee.id'

export async function createPasswordLink(supabase: any, email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.generateLink({ type: 'recovery', email })
  const tokenHash: string | undefined = data?.properties?.hashed_token
  if (error || !tokenHash) return null
  return `${MEMBER_BASE_URL}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`
}
