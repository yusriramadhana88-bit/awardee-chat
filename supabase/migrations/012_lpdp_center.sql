-- Migration 012: LPDP Center — agent "Bima" (Cek Dokumen + Review Esai + Scoring)
-- Fitur khusus LPDP Batch 2 2026. File dokumen/esai disimpan terenkripsi (AES-256-GCM,
-- app-level, lihat lib/lpdp-crypto.ts) di private Supabase Storage bucket "lpdp-docs" —
-- tidak ada akses klien langsung, semua upload/download lewat service-role di API route.

-- ============================================================
-- 1. LPDP_PROFILES: intake data (skema, jenjang, tujuan studi, status, CV)
-- ============================================================
CREATE TABLE IF NOT EXISTS lpdp_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  skema TEXT,
  jenjang TEXT CHECK (jenjang IN ('magister', 'doktor')),
  tujuan TEXT CHECK (tujuan IN ('dalam_negeri', 'luar_negeri')),
  target_kampus TEXT,
  target_prodi TEXT,
  punya_loa BOOLEAN NOT NULL DEFAULT false,
  loa_unconditional BOOLEAN NOT NULL DEFAULT false,
  status_kerja TEXT CHECK (status_kerja IN ('asn_tni_polri', 'swasta', 'fresh_graduate', 'lainnya')),
  rencana_kontribusi TEXT,
  cv_text TEXT,
  cv_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lpdp_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lpdp_profiles_own" ON lpdp_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. LPDP_DOC_CHECKS: hasil verifikasi Bima per dokumen yang diupload
-- ============================================================
CREATE TABLE IF NOT EXISTS lpdp_doc_checks (
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
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lpdp_doc_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lpdp_doc_checks_select_own" ON lpdp_doc_checks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lpdp_doc_checks_insert_own" ON lpdp_doc_checks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS lpdp_doc_checks_user_doc_idx ON lpdp_doc_checks(user_id, doc_key, created_at DESC);

-- ============================================================
-- 3. LPDP_ESSAY_REVIEWS: hasil review Bima untuk Profil Diri / Esai Komitmen
-- ============================================================
CREATE TABLE IF NOT EXISTS lpdp_essay_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  essay_type TEXT NOT NULL CHECK (essay_type IN ('profil_diri', 'esai_komitmen')),
  content TEXT NOT NULL,
  feedback TEXT NOT NULL,
  score INT,
  mood TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lpdp_essay_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lpdp_essay_reviews_select_own" ON lpdp_essay_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lpdp_essay_reviews_insert_own" ON lpdp_essay_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS lpdp_essay_reviews_user_type_idx ON lpdp_essay_reviews(user_id, essay_type, created_at DESC);

-- ============================================================
-- 4. STORAGE BUCKET: lpdp-docs (private — tanpa policy klien, akses hanya via service-role)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('lpdp-docs', 'lpdp-docs', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. SEED ACHIEVEMENTS: LPDP Center
-- ============================================================
INSERT INTO achievements (code, title, description, icon) VALUES
  ('lpdp_profile_set', 'Kenalan sama Bima', 'Mengisi profil intake LPDP Center pertama kali', '🤝'),
  ('lpdp_first_doc', 'Dokumen Pertama Dicek', 'Mengunggah dan mendapat verifikasi dokumen LPDP pertama dari Bima', '🔍'),
  ('lpdp_docs_clear', 'Administrasi Aman', 'Semua dokumen wajib LPDP dinyatakan sesuai oleh Bima', '🛡️'),
  ('lpdp_first_essay', 'Esai Pertama Direview Bima', 'Mendapat review esai LPDP pertama dari Bima', '📝'),
  ('lpdp_ready', 'Siap Tempur LPDP', 'Mencapai Skor Kesiapan LPDP minimal 80', '⚔️')
ON CONFLICT (code) DO NOTHING;
