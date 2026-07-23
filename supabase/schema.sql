-- Jalankan SQL ini di Supabase Dashboard > SQL Editor

-- Tabel profil user
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'kopi', 'starter', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa lihat/edit data sendiri
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Tabel hitung pemakaian harian
CREATE TABLE IF NOT EXISTS public.daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.daily_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Fungsi otomatis buat profil saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SCHOLARSHIP TRACKER TABLES
-- Jalankan bagian ini setelah tabel di atas sudah dibuat
-- ============================================================

-- Aplikasi beasiswa per user (custom, user isi sendiri)
CREATE TABLE IF NOT EXISTS public.scholarship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scholarship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own applications" ON public.scholarship_applications
  FOR ALL USING (auth.uid() = user_id);

-- Tahapan per aplikasi (custom, user atur sendiri)
CREATE TABLE IF NOT EXISTS public.application_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.scholarship_applications(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.application_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own stages" ON public.application_stages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.scholarship_applications a
      WHERE a.id = application_stages.application_id
        AND a.user_id = auth.uid()
    )
  );

-- Checklist item per stage
CREATE TABLE IF NOT EXISTS public.stage_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES public.application_stages(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stage_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checklist items" ON public.stage_checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.application_stages s
      JOIN public.scholarship_applications a ON a.id = s.application_id
      WHERE s.id = stage_checklist_items.stage_id
        AND a.user_id = auth.uid()
    )
  );

-- Fungsi SECURITY DEFINER untuk public share link (bypass RLS, verifikasi via share_token)
CREATE OR REPLACE FUNCTION public.get_shared_application(p_token TEXT)
RETURNS JSON SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', a.id,
    'name', a.name,
    'description', a.description,
    'deadline', a.deadline,
    'overall_progress', a.overall_progress,
    'status', a.status,
    'stages', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', s.id,
          'name', s.name,
          'stage_order', s.stage_order,
          'status', s.status,
          'due_date', s.due_date,
          'notes', s.notes,
          'checklist_items', COALESCE((
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'text', c.text,
                'is_completed', c.is_completed
              ) ORDER BY c.created_at
            ) FROM public.stage_checklist_items c WHERE c.stage_id = s.id
          ), '[]'::json)
        ) ORDER BY s.stage_order
      ) FROM public.application_stages s WHERE s.application_id = a.id
    ), '[]'::json)
  ) INTO result
  FROM public.scholarship_applications a
  WHERE a.share_token = p_token
    AND a.status != 'cancelled';

  RETURN result;
END;
$$ LANGUAGE plpgsql;
