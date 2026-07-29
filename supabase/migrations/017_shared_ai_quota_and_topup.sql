-- Migration 017: kuota AI gabungan AAS+LPDP (satu subscription, satu ceiling biaya AI) + Booster
-- Kuota AI (top-up) yang bisa dibeli terpisah lewat lynk.id kalau kuota bulanan habis.

-- 1. Generalisasi ledger token AI: lpdp_token_usage -> ai_token_usage, dipakai AAS Center juga.
ALTER TABLE lpdp_token_usage RENAME TO ai_token_usage;
ALTER TABLE ai_token_usage ADD COLUMN IF NOT EXISTS product TEXT NOT NULL DEFAULT 'lpdp' CHECK (product IN ('lpdp', 'aas'));
ALTER TABLE ai_token_usage ALTER COLUMN product DROP DEFAULT;

ALTER INDEX IF EXISTS lpdp_token_usage_user_created_idx RENAME TO ai_token_usage_user_created_idx;
DROP POLICY IF EXISTS "lpdp_token_usage_select_own" ON ai_token_usage;
CREATE POLICY "ai_token_usage_select_own" ON ai_token_usage FOR SELECT USING (auth.uid() = user_id);

-- 2. Booster Kuota AI — top-up dibeli manual via lynk.id (WhatsApp konfirmasi bayar, sama seperti
-- membership), diaktivasi admin via /admin/users setelah verifikasi. Berlaku untuk bulan kalender
-- saat diaktivasi (month_key) — tidak roll-over ke bulan berikutnya, konsisten dengan reset budget
-- tier bulanan. Paket & harga: lihat TOPUP_PACKAGES di lib/ai-quota.ts.
CREATE TABLE IF NOT EXISTS token_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  price_idr NUMERIC NOT NULL,
  budget_idr NUMERIC NOT NULL,
  month_key TEXT NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE token_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "token_topups_select_own" ON token_topups FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS token_topups_user_month_idx ON token_topups(user_id, month_key);
