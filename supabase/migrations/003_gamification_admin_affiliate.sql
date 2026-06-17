-- Migration 003: Gamification + Admin + Affiliate system
-- Run AFTER: schema.sql, add_phone_to_profiles.sql, 002_awardeeos_v2.sql

-- ============================================================
-- 1. GAMIFICATION: Score columns untuk CV & Essay
-- ============================================================
ALTER TABLE cv_analyses ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE essay_drafts ADD COLUMN IF NOT EXISTS score INTEGER;

COMMENT ON COLUMN cv_analyses.score IS 'Skor kesiapan CV 1-10, diekstrak dari output AI untuk gamifikasi';
COMMENT ON COLUMN essay_drafts.score IS 'Skor essay 1-10, diekstrak dari output AI untuk gamifikasi';

-- ============================================================
-- 2. ADMIN: Tandai akun admin di profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.is_admin IS 'Flag akun admin — set manual di Supabase untuk akun Dhana';

-- ============================================================
-- 3. AFFILIATES: Tabel program afiliasi
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC(4,2) NOT NULL DEFAULT 20.00,
  total_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

-- Afiliasi bisa baca datanya sendiri
CREATE POLICY "affiliates_select_own" ON affiliates
  FOR SELECT USING (auth.uid() = user_id);

-- Hanya service_role (backend) yang bisa insert/update
CREATE POLICY "affiliates_insert_service" ON affiliates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS affiliates_user_id_idx ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS affiliates_referral_code_idx ON affiliates(referral_code);

-- ============================================================
-- 4. REFERRALS: Tracking klik & konversi referral
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referee_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  subscription_value NUMERIC(12,2),
  commission_earned NUMERIC(12,2),
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN ('pending', 'approved', 'paid'))
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Afiliasi bisa baca referral yang terhubung ke akun mereka
CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates a WHERE a.id = affiliate_id AND a.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS referrals_affiliate_id_idx ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS referrals_referee_user_id_idx ON referrals(referee_user_id);
CREATE INDEX IF NOT EXISTS referrals_referral_code_idx ON referrals(referral_code);
