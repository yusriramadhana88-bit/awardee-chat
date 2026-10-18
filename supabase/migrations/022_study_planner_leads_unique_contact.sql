-- Migration 022: satu kontak hanya boleh memakai lead magnet gratis SEKALI.
-- contact_key: 'wa:62812...' (Indonesia) atau 'em:nama@domain' (English; email dinormalisasi: huruf kecil,
-- titik Gmail dan tag +alias dibuang) supaya tidak bisa diakali dengan variasi penulisan.

ALTER TABLE public.study_planner_leads ADD COLUMN IF NOT EXISTS contact_key TEXT;

-- Baris lama: hanya yang paling awal per kontak yang mendapat key (menghindari bentrok pada duplikat lama).
WITH k AS (
  SELECT id,
         CASE WHEN email IS NOT NULL THEN 'em:' || lower(email) ELSE 'wa:' || phone END AS key,
         row_number() OVER (PARTITION BY CASE WHEN email IS NOT NULL THEN 'em:' || lower(email) ELSE 'wa:' || phone END ORDER BY created_at, id) AS rn
  FROM public.study_planner_leads
  WHERE contact_key IS NULL AND (email IS NOT NULL OR phone IS NOT NULL)
)
UPDATE public.study_planner_leads l SET contact_key = k.key FROM k WHERE l.id = k.id AND k.rn = 1;

CREATE UNIQUE INDEX IF NOT EXISTS study_planner_leads_contact_key_uniq ON public.study_planner_leads(contact_key) WHERE contact_key IS NOT NULL;
