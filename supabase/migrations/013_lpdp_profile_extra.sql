-- Migration 013: kolom intake tambahan di lpdp_profiles — dibutuhkan supaya checklist dokumen
-- kondisional akurat sesuai Buku Panduan resmi LPDP Batch 2 2026 (bukan hanya loa/status_kerja/jenjang).
ALTER TABLE lpdp_profiles
  ADD COLUMN IF NOT EXISTS lulusan_luar_negeri BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pernah_gagal_studi BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pendanaan_parsial BOOLEAN NOT NULL DEFAULT false;
