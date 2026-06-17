-- ============================================================
-- AwardeeOS v2.0 — Tabel tambahan untuk Dashboard Lengkap
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1) Skor tes bahasa (IELTS/TOEFL/dll) + target
CREATE TABLE IF NOT EXISTS public.test_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('ielts', 'toefl_ibt', 'pte', 'duolingo', 'other')),
  test_date DATE,
  overall_score NUMERIC(4,1),
  listening NUMERIC(4,1),
  reading NUMERIC(4,1),
  writing NUMERIC(4,1),
  speaking NUMERIC(4,1),
  is_target BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.test_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own test scores" ON public.test_scores
  FOR ALL USING (auth.uid() = user_id);

-- 2) Draft essay + AI feedback (Essay Workshop, Pro)
CREATE TABLE IF NOT EXISTS public.essay_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.scholarship_applications(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  essay_type TEXT DEFAULT 'other' CHECK (essay_type IN ('personal_statement', 'leadership', 'community_impact', 'study_plan', 'motivation', 'other')),
  content TEXT DEFAULT '',
  ai_feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.essay_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own essay drafts" ON public.essay_drafts
  FOR ALL USING (auth.uid() = user_id);

-- 3) Deadline kalender personal (di luar aplikasi tracker, mis. tes IELTS, submit LoA, dll)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('deadline', 'test', 'interview', 'document', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar events" ON public.calendar_events
  FOR ALL USING (auth.uid() = user_id);

-- 4) Riwayat analisis CV (CV Analyzer)
CREATE TABLE IF NOT EXISTS public.cv_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cv_content TEXT NOT NULL,
  target_scholarship TEXT,
  analysis TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cv analyses" ON public.cv_analyses
  FOR ALL USING (auth.uid() = user_id);

-- 5) Checklist dokumen per beasiswa (status centang per item, per user)
CREATE TABLE IF NOT EXISTS public.document_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scholarship_key TEXT NOT NULL,
  item_key TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scholarship_key, item_key)
);

ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checklist progress" ON public.document_checklist_items
  FOR ALL USING (auth.uid() = user_id);
