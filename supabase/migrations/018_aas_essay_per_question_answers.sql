-- Migration 018: simpan jawaban AAS Center per pertanyaan (bukan hanya gabungan `content`) supaya
-- batas resmi form OASIS (2000 karakter PER PERTANYAAN, bukan kata) bisa ditegakkan per kolom saat
-- di-reload untuk diedit, bukan cuma dicek sebagai total gabungan seperti sebelumnya.
ALTER TABLE aas_essay_reviews ADD COLUMN IF NOT EXISTS answers JSONB;
