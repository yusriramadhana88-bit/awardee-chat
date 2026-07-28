-- Migration 015: rename tier (kopi/starter/pro -> starter/vip/vvip) + tabel promo slot & ledger token LPDP.

-- 1. Migrasi DATA dulu (sebelum constraint baru menolak nilai lama)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_tier_check;

UPDATE profiles SET subscription_tier = CASE subscription_tier
  WHEN 'pro' THEN 'vvip'
  WHEN 'starter' THEN 'vip'
  WHEN 'kopi' THEN 'starter'
  ELSE subscription_tier
END
WHERE subscription_tier IN ('kopi', 'starter', 'pro');

UPDATE modules SET tier = CASE tier
  WHEN 'pro' THEN 'vvip'
  WHEN 'starter' THEN 'vip'
  WHEN 'kopi' THEN 'starter'
  ELSE tier
END
WHERE tier IN ('kopi', 'starter', 'pro');

-- 2. Constraint baru
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'starter', 'vip', 'vvip'));
ALTER TABLE modules ADD CONSTRAINT modules_tier_check
  CHECK (tier IN ('free', 'starter', 'vip', 'vvip'));

-- 3. Slot promo (diskon 50 user pertama / 25 user pertama Starter) — diklaim manual oleh admin
-- saat aktivasi tier (lihat app/api/admin/users/route.ts), karena pembayaran lynk.id tidak
-- terhubung otomatis (konfirmasi manual via WhatsApp).
CREATE TABLE IF NOT EXISTS tier_promo_slots (
  tier TEXT PRIMARY KEY CHECK (tier IN ('starter', 'vip', 'vvip')),
  cap INT NOT NULL,
  claimed INT NOT NULL DEFAULT 0
);
INSERT INTO tier_promo_slots (tier, cap, claimed) VALUES
  ('starter', 25, 0),
  ('vip', 50, 0),
  ('vvip', 50, 0)
ON CONFLICT (tier) DO NOTHING;

ALTER TABLE tier_promo_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tier_promo_slots_select_all" ON tier_promo_slots FOR SELECT USING (true);

-- 4. Ledger token AI untuk LPDP Center (Cek Dokumen + Review Esai) — dasar kuota bulanan
-- per tier. Insert hanya lewat service-role di API route (bukan lewat RLS klien).
CREATE TABLE IF NOT EXISTS lpdp_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('doc_check', 'essay_review')),
  model TEXT NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  cost_idr NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lpdp_token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lpdp_token_usage_select_own" ON lpdp_token_usage FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS lpdp_token_usage_user_created_idx ON lpdp_token_usage(user_id, created_at DESC);
