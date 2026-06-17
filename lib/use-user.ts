'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export type UserProfile = {
  name: string
  email: string
  tier: 'free' | 'starter' | 'pro'
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

export function canAccess(tier: string | undefined, requiredTier: 'starter' | 'pro' | null): boolean {
  if (!requiredTier) return true
  if (requiredTier === 'starter') return tier === 'starter' || tier === 'pro'
  if (requiredTier === 'pro') return tier === 'pro'
  return false
}

export const TIER_LABEL: Record<string, string> = {
  free: 'Gratis',
  starter: 'Starter',
  pro: 'Pro',
}

export const TIER_COLOR: Record<string, string> = {
  free: 'text-gray-600 bg-gray-100',
  starter: 'text-sky-700 bg-sky-100',
  pro: 'text-purple-700 bg-purple-100',
}
