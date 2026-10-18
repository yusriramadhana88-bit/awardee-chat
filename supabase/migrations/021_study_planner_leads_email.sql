-- Migration 021: lead internasional Mini Study Planner (versi English) hanya merekam EMAIL, bukan nomor WhatsApp.
-- phone menjadi opsional; email + lang ditambahkan.

ALTER TABLE public.study_planner_leads ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.study_planner_leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.study_planner_leads ADD COLUMN IF NOT EXISTS lang TEXT NOT NULL DEFAULT 'id';   -- 'id' | 'en'

CREATE INDEX IF NOT EXISTS study_planner_leads_email_idx ON public.study_planner_leads(email);
