'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export type Tier = 'free' | 'kopi' | 'starter' | 'pro'

export type UserProfile = {
  name: string
  email: string
  tier: Tier
  used: number
  limit: number
  expires_at: string | null
}

export function useUser(redirectIfUnauth = true) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (redirectIfUnauth) router.push('/login')
        setLoading(false)
        return
      }
      const res = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        if (redirectIfUnauth) router.push('/login')
        setLoading(false)
        return
      }
      const data = await res.json()
      setUser({ ...data, email: session.user.email ?? '' })
      setLoading(false)
    }
    load()
  }, [])

  return { user, loading }
}

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
