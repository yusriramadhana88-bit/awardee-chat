'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export type { Tier } from '@/lib/tier'
export { canAccess, TIER_LABEL, TIER_COLOR, TIER_PRICE } from '@/lib/tier'
import type { Tier } from '@/lib/tier'

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
