-- Migration 007: Member interest leads (dari sneak-peek member area di awardee.id)
-- Dikumpulkan lewat form publik di halaman utama (nama, WA, email) untuk retargeting.

CREATE TABLE IF NOT EXISTS public.member_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'sneak_peek_main_page',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.member_leads IS 'Lead capture dari form "sneak peek member area" di awardee.id — dipakai untuk database WA/email retargeting, bukan akun aplikasi.';
COMMENT ON COLUMN public.member_leads.source IS 'Asal form, mis. sneak_peek_main_page — untuk membedakan campaign kalau ditambah form lain nanti.';

-- RLS on, tanpa policy publik: hanya service-role (API route) yang boleh baca/tulis.
ALTER TABLE public.member_leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS member_leads_created_at_idx ON public.member_leads(created_at DESC);
