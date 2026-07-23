-- Guest (belum login) chat usage — dibatasi per guest_id yang disimpan di localStorage browser,
-- bukan per IP, karena banyak user berbagi IP (kantor/kampus/mobile carrier NAT).
-- Diakses hanya oleh server (service role) dari app/api/chat/route.ts, jadi tidak ada policy
-- untuk anon/authenticated — RLS default-deny sudah cukup.
CREATE TABLE IF NOT EXISTS public.guest_chat_usage (
  guest_id text NOT NULL,
  date date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (guest_id, date)
);

ALTER TABLE public.guest_chat_usage ENABLE ROW LEVEL SECURITY;
