-- Add phone column with UNIQUE constraint to profiles table
-- This ensures 1 WhatsApp number = 1 account (anti-abuse)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Unique constraint: 1 phone per account
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_phone_unique;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles (phone);
