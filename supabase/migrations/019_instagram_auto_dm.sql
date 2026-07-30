-- Instagram auto-reply + auto-DM ("ManyChat-style"): admin defines trigger keywords, bot replies
-- publicly to the comment + sends a private DM via Instagram's Private Replies API. See
-- lib/instagram-auto-dm.ts and app/api/instagram/webhook/route.ts.

CREATE TABLE IF NOT EXISTS auto_dm_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_keyword TEXT NOT NULL,
  reply_message TEXT NOT NULL,
  dm_message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE auto_dm_rules ENABLE ROW LEVEL SECURITY;
-- Hanya service_role (backend/admin API) yang boleh baca/tulis — tidak ada policy user biasa.

-- Log komentar yang sudah diproses — mencegah balas dobel kalau Meta mengirim ulang webhook
-- yang sama (retry), dan supaya 1 komentar cuma dibalas 1x meski cocok >1 rule.
CREATE TABLE IF NOT EXISTS auto_dm_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_comment_id TEXT NOT NULL UNIQUE,
  rule_id UUID REFERENCES auto_dm_rules(id) ON DELETE SET NULL,
  commenter_username TEXT,
  reply_ok BOOLEAN NOT NULL DEFAULT false,
  dm_ok BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE auto_dm_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS auto_dm_log_comment_id_idx ON auto_dm_log(ig_comment_id);
