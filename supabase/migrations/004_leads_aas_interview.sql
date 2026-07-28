-- Migration 004: Leads table untuk lead magnet opt-in (mis. AAS Interview Guide)
-- Run AFTER: schema.sql, add_phone_to_profiles.sql, 002_awardeeos_v2.sql, 003_gamification_admin_affiliate.sql

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  telegram_chat_id BIGINT,
  telegram_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

COMMENT ON TABLE public.leads IS 'Lead magnet opt-ins. Filled by landing page (name/source), then linked to a Telegram chat once the user presses Start on the bot deep link — the bot never initiates contact.';
COMMENT ON COLUMN public.leads.source IS 'Which landing page / campaign the lead came from, e.g. aas-interview';
COMMENT ON COLUMN public.leads.telegram_chat_id IS 'Set by the bot after the user starts a chat via the t.me deep link — null until then';

-- RLS on, no public policies: only the service-role key (server-side API routes, bot backend) can read/write.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
