-- Migration 009: hak akses "Akses Database STUDY PLANNER by Awardee.id" (produk lynk.id, sekali bayar, selamanya).
-- Diisi otomatis oleh webhook lynk.id (lib/lynk-webhook.ts) saat judul produk mengandung "study planner".
-- Pencocokan ke akun AWARDEE APP lewat email atau nomor HP pembeli, saat user membuka halaman database.

CREATE TABLE IF NOT EXISTS public.study_planner_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ref_id TEXT UNIQUE,                 -- refId transaksi lynk.id (idempotensi); NULL untuk pemberian manual
  email TEXT,                         -- huruf kecil
  phone TEXT,                         -- 10 digit terakhir tanpa 0/62 (sama seperti normalizePhone di lynk-webhook)
  name TEXT,
  amount NUMERIC,
  source TEXT NOT NULL DEFAULT 'lynk',  -- lynk | manual
  expires_at TIMESTAMPTZ,             -- NULL = selamanya
  note TEXT
);

COMMENT ON TABLE public.study_planner_access IS 'Pembeli Akses Database STUDY PLANNER. Cocokkan email/phone ke akun untuk membuka /dashboard/study-planner. Jumlah baris = kuota promo 88 user pertama.';

ALTER TABLE public.study_planner_access ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS study_planner_access_email_idx ON public.study_planner_access(email);
CREATE INDEX IF NOT EXISTS study_planner_access_phone_idx ON public.study_planner_access(phone);
