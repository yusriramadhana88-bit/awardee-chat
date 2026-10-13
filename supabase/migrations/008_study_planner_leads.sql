-- Migration 008: Mini Study Planner leads (halaman khusus awardee.id/study-planner/ -> kuis -> WhatsApp).
-- Menyimpan jawaban kuis + status pengiriman WhatsApp. Hanya service-role (API route) yang boleh baca/tulis.

CREATE TABLE IF NOT EXISTS public.study_planner_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,                       -- format internasional tanpa '+': 62812xxxxxxx
  consent BOOLEAN NOT NULL DEFAULT false,    -- centang persetujuan di form
  consent_at TIMESTAMPTZ,
  answers JSONB NOT NULL,                    -- jawaban kuis (tujuan, jenjang, bidang, IPK, karier, bahasa, kota, status)
  picks JSONB,                               -- 2 program yang dikirim (nama, kampus, kode CRICOS) + total kecocokan
  mode TEXT NOT NULL DEFAULT 'web',          -- 'web' = hasil tampil di halaman; 'whatsapp' = dikirim lewat WA
  wa_status TEXT NOT NULL DEFAULT 'none',    -- none | template_sent | results_sent | offer_sent | failed | opted_out
  wa_last_error TEXT,
  results_sent_at TIMESTAMPTZ,
  offer_sent_at TIMESTAMPTZ,
  opted_out_at TIMESTAMPTZ,
  utm JSONB,                                 -- utm_source/medium/campaign/content/term dari iklan
  fbp TEXT,                                  -- cookie _fbp (Meta Pixel) untuk pencocokan event server-side
  fbc TEXT,                                  -- cookie _fbc / fbclid
  event_id TEXT,                             -- event_id untuk deduplikasi Pixel <-> Conversions API
  ip_hash TEXT,                              -- hash IP (tanpa menyimpan IP mentah) untuk batas laju
  user_agent TEXT
);

COMMENT ON TABLE public.study_planner_leads IS 'Lead Mini Study Planner (kuis -> hasil via WhatsApp). Dipakai untuk pengiriman hasil, penawaran Akses Database, dan retargeting. Hormati opt-out (wa_status = opted_out).';

ALTER TABLE public.study_planner_leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS study_planner_leads_created_idx ON public.study_planner_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS study_planner_leads_phone_idx ON public.study_planner_leads(phone);
CREATE INDEX IF NOT EXISTS study_planner_leads_status_idx ON public.study_planner_leads(wa_status, created_at);
