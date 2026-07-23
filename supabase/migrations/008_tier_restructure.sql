-- ============================================================
-- Tier restructure: Free → Kopi (Rp25K) → Starter (Rp99K) → Pro (Rp249K)
-- Free sekarang hanya dapat akses Chat AI (5x/hari); semua menu lain
-- (Learning Modules, Tracker, Checklist Dokumen, Achievements) pindah
-- ke tier baru "kopi". Starter & Pro tidak berubah fiturnya, hanya
-- harga Pro turun dari Rp299K -> Rp249K (harga tidak disimpan di DB).
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'kopi', 'starter', 'pro'));

ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_tier_check;
ALTER TABLE public.modules ADD CONSTRAINT modules_tier_check
  CHECK (tier IN ('free', 'kopi', 'starter', 'pro'));

-- Modul yang sebelumnya gratis sekarang minimal butuh tier Kopi
UPDATE public.modules SET tier = 'kopi' WHERE tier = 'free';
