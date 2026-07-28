export type Tier = 'free' | 'starter' | 'vip' | 'vvip'

const TIER_RANK: Record<string, number> = { free: 0, starter: 1, vip: 2, vvip: 3 }

export function canAccess(tier: string | undefined, requiredTier: 'starter' | 'vip' | 'vvip' | null): boolean {
  if (!requiredTier) return true
  return (TIER_RANK[tier ?? 'free'] ?? 0) >= TIER_RANK[requiredTier]
}

export const TIER_LABEL: Record<string, string> = {
  free: 'Gratis',
  starter: 'Starter',
  vip: 'VIP',
  vvip: 'VVIP',
}

export const TIER_COLOR: Record<string, string> = {
  free: 'text-gray-600 bg-gray-100',
  starter: 'text-amber-700 bg-amber-100',
  vip: 'text-sky-700 bg-sky-100',
  vvip: 'text-purple-700 bg-purple-100',
}

// Harga normal (setelah slot promo habis / user ke-N+1 dst)
export const TIER_PRICE: Record<string, string> = {
  free: 'Rp0',
  starter: 'Rp49K',
  vip: 'Rp149K',
  vvip: 'Rp240K',
}

// Harga promo — hanya berlaku untuk TIER_PROMO_CAP user pertama per tier (lihat tier_promo_slots di DB)
export const TIER_PRICE_PROMO: Record<'starter' | 'vip' | 'vvip', string> = {
  starter: 'Rp25K',
  vip: 'Rp74,5K',
  vvip: 'Rp120K',
}

export const TIER_PROMO_CAP: Record<'starter' | 'vip' | 'vvip', number> = {
  starter: 25,
  vip: 50,
  vvip: 50,
}
