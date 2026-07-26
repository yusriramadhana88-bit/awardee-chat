-- Newsletter beasiswa 3x/minggu — subscription otomatis saat daftar member (opt-in default true,
-- transparan lewat copy di halaman register), dengan unsubscribe 1-klik lewat link di tiap email.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS newsletter_unsubscribed_at timestamptz;
