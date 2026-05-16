import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LIMITS: Record<string, number> = { free: 10, starter: 50, pro: 999 }

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, subscription_tier, subscription_expires_at')
      .eq('id', user.id)
      .single()

    const tier = profile?.subscription_tier || 'free'
    const today = new Date().toISOString().split('T')[0]

    const { data: usage } = await supabase
      .from('daily_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    return NextResponse.json({
      name: profile?.name || user.email?.split('@')[0] || 'User',
      tier,
      limit: LIMITS[tier] ?? 10,
      used: usage?.count || 0,
      expires_at: profile?.subscription_expires_at || null,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
