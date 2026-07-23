export type Tier = 'free' | 'kopi' | 'starter' | 'pro'

const TIER_RANK: Record<string, number> = { free: 0, kopi: 1, starter: 2, pro: 3 }

export function canAccess(tier: string | undefined, requiredTier: 'kopi' | 'starter' | 'pro' | null): boolean {
  if (!requiredTier) return true
  return (TIER_RANK[tier ?? 'free'] ?? 0) >= TIER_RANK[requiredTier]
}

export const TIER_LABEL: Record<string, string> = {
  free: 'Gratis',
  kopi: 'Kopi',
  starter: 'Starter',
  pro: 'Pro',
}

export const TIER_COLOR: Record<string, string> = {
  free: 'text-gray-600 bg-gray-100',
  kopi: 'text-amber-700 bg-amber-100',
  starter: 'text-sky-700 bg-sky-100',
  pro: 'text-purple-700 bg-purple-100',
}

export const TIER_PRICE: Record<string, string> = {
  free: 'Rp0',
  kopi: 'Rp25K',
  starter: 'Rp99K',
  pro: 'Rp249K',
}
