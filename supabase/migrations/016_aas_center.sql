-- Migration 016: AAS Center (Cek Dokumen + Review Esai + Scoring), klon LPDP Center untuk
-- Australia Awards Scholarship. Sumber kriteria: Australia Awards Scholarships Policy Handbook
-- (Nov 2025) + Preview Form AAS Regular Application Portal Masters 2027 Intake — lihat
-- knowledge/aas-handbook.txt. File dokumen disimpan terenkripsi (AES-256-GCM, reuse
-- lib/lpdp-crypto.ts) di private Supabase Storage bucket "aas-docs".
--
-- BEDA dari LPDP: dokumen resmi AAS HANYA menerima PDF/Image (bukan Word), maks 2MB per file
-- (aturan keras sistem OASIS) — lihat lib/aas-requirements.ts. Esai AAS adalah 2 "supporting
-- statement" gabungan (bukan upload docx) dengan batas KARAKTER (bukan kata) per pertanyaan asli.
-- Kuota: AAS Center digerbang HANYA oleh tier (canAccess 'starter'), TIDAK memakai token-quota
-- LPDP — sesuai keputusan scoping token-quota LPDP-only "untuk saat ini".

-- ============================================================
-- 1. AAS_PROFILES: intake data (kategori applicant, status kerja, target studi)
-- ============================================================
CREATE TABLE IF NOT EXISTS aas_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  applicant_category TEXT CHECK (applicant_category IN ('etg', 'goi', 'general')),
  jenjang TEXT CHECK (jenjang IN ('master', 'doktor')),
  status_kerja TEXT CHECK (status_kerja IN ('pns', 'swasta', 'fresh_graduate', 'lainnya')),
  target_kampus TEXT,
  target_prodi TEXT,
  rencana_kontribusi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE aas_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aas_profiles_own" ON aas_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. AAS_DOC_CHECKS: hasil verifikasi Den Dhana per dokumen yang diupload
-- ============================================================
CREATE TABLE IF NOT EXISTS aas_doc_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  verdict TEXT NOT NULL CHECK (verdict IN ('sesuai', 'perlu_perbaikan', 'tidak_sesuai')),
  skor INT,
  temuan JSONB,
  komentar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE aas_doc_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aas_doc_checks_select_own" ON aas_doc_checks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "aas_doc_checks_insert_own" ON aas_doc_checks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS aas_doc_checks_user_doc_idx ON aas_doc_checks(user_id, doc_key, created_at DESC);

-- ============================================================
-- 3. AAS_ESSAY_REVIEWS: hasil review supporting statement (2 kelompok pertanyaan resmi)
-- ============================================================
CREATE TABLE IF NOT EXISTS aas_essay_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  essay_type TEXT NOT NULL CHECK (essay_type IN ('kepemimpinan_dampak', 'rencana_reintegrasi')),
  content TEXT NOT NULL,
  feedback TEXT NOT NULL,
  score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE aas_essay_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aas_essay_reviews_select_own" ON aas_essay_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "aas_essay_reviews_insert_own" ON aas_essay_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS aas_essay_reviews_user_type_idx ON aas_essay_reviews(user_id, essay_type, created_at DESC);

-- ============================================================
-- 4. STORAGE BUCKET: aas-docs (private — tanpa policy klien, akses hanya via service-role)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('aas-docs', 'aas-docs', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. SEED ACHIEVEMENTS: AAS Center
-- ============================================================
INSERT INTO achievements (code, title, description, icon) VALUES
  ('aas_profile_set', 'Kenalan sama AAS Center', 'Mengisi profil intake AAS Center pertama kali', '🤝'),
  ('aas_first_doc', 'Dokumen AAS Pertama Dicek', 'Mengunggah dan mendapat verifikasi dokumen AAS pertama', '🔍'),
  ('aas_docs_clear', 'Berkas AAS Aman', 'Semua dokumen wajib AAS dinyatakan sesuai', '🛡️'),
  ('aas_first_essay', 'Supporting Statement Pertama Direview', 'Mendapat review supporting statement AAS pertama', '📝'),
  ('aas_ready', 'Siap Tempur AAS', 'Mencapai Skor Kesiapan AAS minimal 80', '🦘')
ON CONFLICT (code) DO NOTHING;
