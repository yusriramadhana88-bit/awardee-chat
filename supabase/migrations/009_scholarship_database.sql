-- ============================================================
-- Database beasiswa fully-funded global + tanggal penting, untuk
-- ditampilkan di Kalender Beasiswa (/dashboard/calendar, Starter+).
-- Data riset per 2026-07-23 — sebagian "confirmed" (dari sumber resmi
-- musim ini), sebagian "estimated" (pola siklus tahun lalu, tanggal
-- pasti belum diumumkan). Jangan sajikan tanggal "estimated" sebagai
-- kepastian ke user.
--
-- Commonwealth Scholarship SENGAJA TIDAK dimasukkan — Indonesia bukan
-- anggota Commonwealth, tidak eligible.
-- Holland Scholarship / Orange Tulip SENGAJA TIDAK dimasukkan — hanya
-- pendanaan parsial (EUR 5000 sekali, bukan fully-funded), di luar
-- kebijakan Awardee.id yang hanya menampilkan beasiswa fully-funded.
--
-- Jalankan di Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  provider TEXT NOT NULL,
  official_url TEXT NOT NULL,
  degree_levels TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scholarship_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id UUID REFERENCES public.scholarships(id) ON DELETE CASCADE NOT NULL,
  deadline_date DATE,
  deadline_label TEXT NOT NULL,
  cycle_pattern_note TEXT,
  confidence TEXT NOT NULL DEFAULT 'estimated' CHECK (confidence IN ('confirmed', 'estimated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scholarship_deadlines_date_idx ON public.scholarship_deadlines(deadline_date);

ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read scholarships" ON public.scholarships
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read scholarship deadlines" ON public.scholarship_deadlines
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA — 16 beasiswa fully-funded
-- ============================================================

INSERT INTO public.scholarships (name, country, provider, official_url, degree_levels) VALUES
  ('LPDP', 'Indonesia', 'Lembaga Pengelola Dana Pendidikan (Kemenkeu)', 'https://lpdp.kemenkeu.go.id', ARRAY['S2','S3']),
  ('Australia Awards Scholarship (AAS)', 'Australia', 'Pemerintah Australia (DFAT) via Australia Awards Indonesia', 'https://www.australiaawardsindonesia.org', ARRAY['S2']),
  ('Chevening Scholarship', 'Inggris', 'UK Foreign, Commonwealth & Development Office (FCDO)', 'https://www.chevening.org', ARRAY['S2']),
  ('Fulbright Scholarship', 'Amerika Serikat', 'AMINEF / U.S. Department of State', 'https://www.aminef.or.id/grants-for-indonesians/fulbright-programs/scholarship/', ARRAY['S2','S3']),
  ('DAAD EPOS', 'Jerman', 'Deutscher Akademischer Austauschdienst (DAAD)', 'https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/', ARRAY['S2']),
  ('MEXT Scholarship', 'Jepang', 'Kementerian Pendidikan Jepang via Kedutaan Besar Jepang Jakarta', 'https://www.id.emb-japan.go.jp/itpr_id/sch_rs.html', ARRAY['S2','S3']),
  ('Global Korea Scholarship (GKS/KGSP) - Pascasarjana', 'Korea Selatan', 'NIIED via Kedutaan Besar Korea Selatan Jakarta', 'https://www.studyinkorea.go.kr', ARRAY['S2','S3']),
  ('Stipendium Hungaricum', 'Hungaria', 'Tempus Public Foundation / Pemerintah Hungaria', 'https://stipendiumhungaricum.hu', ARRAY['S1','S2','S3']),
  ('Turkiye Burslari', 'Turki', 'YTB (Presidency for Turks Abroad and Related Communities)', 'https://www.turkiyeburslari.gov.tr', ARRAY['S1','S2','S3']),
  ('Erasmus Mundus Joint Master Degrees', 'Uni Eropa', 'European Commission / Erasmus+ (EACEA)', 'https://erasmus-plus.ec.europa.eu', ARRAY['S2']),
  ('Swiss Government Excellence Scholarship', 'Swiss', 'Federal Commission for Scholarships (FCS/SBFI) via Kedutaan Besar Swiss Jakarta', 'https://www.sbfi.admin.ch/en/swiss-government-excellence-scholarships', ARRAY['S3']),
  ('Global Korea Scholarship (GKS) - Sarjana', 'Korea Selatan', 'NIIED via Kedutaan Besar Korea Selatan Jakarta', 'https://www.studyinkorea.go.kr', ARRAY['S1']),
  ('Chinese Government Scholarship (CSC)', 'China', 'China Scholarship Council via Kedutaan Besar China Jakarta', 'https://www.campuschina.org', ARRAY['S1','S2','S3']),
  ('TaiwanICDF Scholarship', 'Taiwan', 'Taiwan International Cooperation and Development Fund', 'https://www.icdf.org.tw', ARRAY['S1','S2','S3']),
  ('Eiffel Excellence Scholarship', 'Prancis', 'Kementerian Luar Negeri Prancis via Campus France', 'https://www.campusfrance.org/en/france-excellence-eiffel-scholarship-program', ARRAY['S2','S3']),
  ('Gates Cambridge Scholarship', 'Inggris', 'Gates Cambridge Trust, University of Cambridge', 'https://www.gatescambridge.org', ARRAY['S2','S3']);

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, '2026-07-31', 'Batch 2 2026', 'Batch 1 biasanya buka sekitar Januari-Februari, Batch 2 sekitar Juni-Juli setiap tahun.', 'confirmed'
FROM public.scholarships WHERE name = 'LPDP';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, '2028 intake (belum dibuka)', 'Buka 1 Februari, tutup 30 April setiap tahun untuk intake tahun berikutnya. Window 2027-intake (1 Feb-30 Apr 2026) sudah tutup.', 'estimated'
FROM public.scholarships WHERE name = 'Australia Awards Scholarship (AAS)';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, '2026-10-06', '2027/2028 intake', 'Buka setiap Agustus, tutup awal Oktober, untuk program master 1 tahun mulai musim gugur tahun berikutnya.', 'confirmed'
FROM public.scholarships WHERE name = 'Chevening Scholarship';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, '2027-02-15', 'Cycle intake 2028', 'AMINEF menyebut deadline tahunan berulang setiap 15 Februari — konfirmasi tahun pastinya langsung ke AMINEF sebelum submit.', 'estimated'
FROM public.scholarships WHERE name = 'Fulbright Scholarship';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, '2027 intake (deadline bervariasi per program)', 'Tidak ada deadline tunggal — tiap program EPOS di universitas tuan rumah punya deadline sendiri, umumnya Juni-Oktober untuk intake Oktober tahun berikutnya. Cek portal universitas tujuan langsung.', 'estimated'
FROM public.scholarships WHERE name = 'DAAD EPOS';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Siklus berikutnya (intake 2028, belum diumumkan)', 'Kedutaan Jepang Jakarta biasanya buka pendaftaran Research Student dengan deadline pertengahan-akhir April setiap tahun.', 'estimated'
FROM public.scholarships WHERE name = 'MEXT Scholarship';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Siklus Embassy Track berikutnya (intake 2027)', 'Embassy Track untuk jenjang pascasarjana biasanya buka dengan deadline akhir Februari setiap tahun.', 'estimated'
FROM public.scholarships WHERE name = 'Global Korea Scholarship (GKS/KGSP) - Pascasarjana';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Siklus 2027/2028', 'Call for applications biasanya terbit sekitar Oktober, deadline pertengahan Januari (14:00 CET) setiap tahun.', 'estimated'
FROM public.scholarships WHERE name = 'Stipendium Hungaricum';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Siklus 2027', 'Jendela pendaftaran biasanya sekitar 10 Januari-20 Februari setiap tahun; tanggal resmi baru diumumkan YTB beberapa minggu sebelum dibuka.', 'estimated'
FROM public.scholarships WHERE name = 'Turkiye Burslari';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Intake 2027/2028', 'Tidak ada deadline tunggal — tiap program Joint Master punya deadline sendiri, umumnya berkisar Oktober 2026-Mei 2027 tergantung program dan kategori pelamar.', 'estimated'
FROM public.scholarships WHERE name = 'Erasmus Mundus Joint Master Degrees';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Siklus 2027/2028', 'SBFI mempublikasikan detail per negara mulai sekitar 20 Agustus setiap tahun. Dua siklus terakhir untuk Indonesia deadline-nya awal Desember, dikirim hard copy ke Kedutaan Swiss Jakarta.', 'estimated'
FROM public.scholarships WHERE name = 'Swiss Government Excellence Scholarship';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Siklus Embassy Track S1 berikutnya (~akhir 2026)', 'Embassy Track jenjang sarjana biasanya buka pertengahan September, tutup akhir September-akhir Oktober setiap tahun.', 'estimated'
FROM public.scholarships WHERE name = 'Global Korea Scholarship (GKS) - Sarjana';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Siklus 2027/2028', 'Untuk siklus 2026/2027, deadline submit online via campuschina.org adalah 8 Februari 2026. Siklus berikutnya diperkirakan buka sekitar Desember 2026, deadline universitas/kedutaan bervariasi Januari-April 2027.', 'estimated'
FROM public.scholarships WHERE name = 'Chinese Government Scholarship (CSC)';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Siklus 2027 (buka ~1 Desember 2026)', 'Jendela pendaftaran konsisten setiap tahun: 1 Desember-15 Maret.', 'estimated'
FROM public.scholarships WHERE name = 'TaiwanICDF Scholarship';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, NULL, 'Kampanye 2027 (belum diumumkan resmi)', 'Aplikasi diajukan lewat universitas tuan rumah di Prancis (bukan langsung oleh mahasiswa), deadline internal universitas umumnya Oktober-Desember. Deadline campagne terakhir yang terkonfirmasi resmi: 8 Januari 2026.', 'estimated'
FROM public.scholarships WHERE name = 'Eiffel Excellence Scholarship';

INSERT INTO public.scholarship_deadlines (scholarship_id, deadline_date, deadline_label, cycle_pattern_note, confidence)
SELECT id, '2026-12-08', '2027/2028 entry (pelamar non-AS)', 'Ada 2 jalur deadline: warga AS yang tinggal di AS (pertengahan Oktober), pelamar lain termasuk Indonesia (awal Desember atau awal Januari, tergantung program studi Cambridge yang dituju).', 'confirmed'
FROM public.scholarships WHERE name = 'Gates Cambridge Scholarship';
