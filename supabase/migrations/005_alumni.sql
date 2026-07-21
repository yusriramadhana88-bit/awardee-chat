-- Migration 005: Awardee Alumni Initiative — dashboard for alumni giving back
-- Run AFTER: 003_gamification_admin_affiliate.sql (reuses profiles.is_admin for admin gating)

-- ============================================================
-- 1. ALUMNI: Aplikasi & status keanggotaan alumni
-- ============================================================
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  scholarship_name TEXT NOT NULL,
  university TEXT,
  graduation_year INTEGER,
  story TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);

COMMENT ON TABLE alumni IS 'Aplikasi & keanggotaan Awardee Alumni Initiative — alumni yang lolos beasiswa lewat Awardee.id mendaftar untuk berkontribusi balik';
COMMENT ON COLUMN alumni.status IS 'pending = menunggu review admin, approved = alumni aktif, rejected = ditolak';

ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alumni_select_own" ON alumni
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "alumni_insert_own" ON alumni
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS alumni_user_id_idx ON alumni(user_id);
CREATE INDEX IF NOT EXISTS alumni_status_idx ON alumni(status);

-- ============================================================
-- 2. ALUMNI_CONTRIBUTIONS: Log kontribusi alumni (mentoring, webinar, referral, dll)
-- ============================================================
CREATE TABLE IF NOT EXISTS alumni_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id) ON DELETE CASCADE,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('mentoring_session', 'webinar', 'referral', 'other')),
  description TEXT,
  hours NUMERIC(5,2),
  contributed_at DATE NOT NULL DEFAULT current_date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE alumni_contributions IS 'Log kontribusi yang dicatat sendiri oleh alumni — dasar untuk statistik dampak (Dampak Terukur di alumni.awardee.id)';

ALTER TABLE alumni_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alumni_contributions_select_own" ON alumni_contributions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM alumni a WHERE a.id = alumni_id AND a.user_id = auth.uid())
  );

CREATE POLICY "alumni_contributions_insert_own" ON alumni_contributions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM alumni a WHERE a.id = alumni_id AND a.user_id = auth.uid() AND a.status = 'approved')
  );

CREATE INDEX IF NOT EXISTS alumni_contributions_alumni_id_idx ON alumni_contributions(alumni_id);
CREATE INDEX IF NOT EXISTS alumni_contributions_contributed_at_idx ON alumni_contributions(contributed_at);
