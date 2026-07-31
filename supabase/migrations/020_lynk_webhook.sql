-- lynk.id payment webhook: auto-upgrade subscription_tier when payment.received fires.
-- See lib/lynk-webhook.ts and app/api/webhook/lynk/route.ts.

-- Log setiap webhook yang masuk — mencegah proses dobel kalau lynk.id retry (non-200 response),
-- dan jadi audit trail transaksi + hasil matching (user mana yang ke-upgrade, atau kenapa gagal).
CREATE TABLE IF NOT EXISTS lynk_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL UNIQUE,
  ref_id TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_name TEXT,
  item_title TEXT,
  grand_total INTEGER,
  matched_tier TEXT,
  matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  matched_via TEXT,
  status TEXT NOT NULL,
  error TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lynk_webhook_log ENABLE ROW LEVEL SECURITY;
-- Hanya service_role (backend/admin API) yang boleh baca/tulis — tidak ada policy user biasa.

CREATE INDEX IF NOT EXISTS lynk_webhook_log_message_id_idx ON lynk_webhook_log(message_id);
CREATE INDEX IF NOT EXISTS lynk_webhook_log_status_idx ON lynk_webhook_log(status);
