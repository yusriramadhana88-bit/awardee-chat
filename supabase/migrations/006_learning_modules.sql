-- Migration 006: Learning Modules, Quizzes, Achievements — Udemy-style member dashboard
-- Run AFTER: 003_gamification_admin_affiliate.sql (reuses profiles.is_admin)

-- ============================================================
-- 1. MODULES: kategori pembelajaran (mis. Metode GALI DIRI, Essay, Interview)
-- ============================================================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '📘',
  order_index INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_select_all" ON modules FOR SELECT USING (true);

-- ============================================================
-- 2. LESSONS: materi di dalam tiap modul
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, slug)
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_select_all" ON lessons FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS lessons_module_id_idx ON lessons(module_id);

-- ============================================================
-- 3. USER_LESSON_PROGRESS: pelacakan lesson yang sudah selesai per user
-- ============================================================
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ulp_select_own" ON user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ulp_insert_own" ON user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ulp_delete_own" ON user_lesson_progress FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS ulp_user_id_idx ON user_lesson_progress(user_id);

-- ============================================================
-- 4. QUIZZES + QUIZ_QUESTIONS: kuis per modul
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_select_all" ON quizzes FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qq_select_all" ON quiz_questions FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS quiz_questions_quiz_id_idx ON quiz_questions(quiz_id);

-- ============================================================
-- 5. QUIZ_ATTEMPTS: hasil percobaan kuis user
-- Insert hanya lewat API (service role) supaya skor divalidasi server-side,
-- bukan dipercaya dari client — cegah user curang kirim skor palsu.
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_select_own" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON quiz_attempts(user_id);

-- ============================================================
-- 6. ACHIEVEMENTS + USER_ACHIEVEMENTS: badge/pencapaian
-- Insert user_achievements hanya lewat API (service role) — cegah self-award.
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_select_all" ON achievements FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ua_select_own" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON user_achievements(user_id);

-- ============================================================
-- 7. SEED DATA: modul & lesson dari materi asli Awardee.id (GALI DIRI,
-- blog-posts/*.md yang sudah diverifikasi) — bukan konten karangan.
-- ============================================================

INSERT INTO modules (slug, title, description, icon, order_index, tier) VALUES
  ('gali-diri', 'Metode #GaliDiri', 'Metode trademark Awardee.id untuk menggali profil kandidat secara menyeluruh sebelum menulis essay atau strategi beasiswa.', '🔍', 1, 'free'),
  ('profil-diri-essay', 'Profil Diri & Essay Komitmen', 'Struktur resmi Profil Diri LPDP dan formula 4-langkah Esai Komitmen Kembali ke Indonesia.', '✍️', 2, 'free'),
  ('interview', 'Persiapan Interview Beasiswa', 'Kriteria penilaian JST (AAS) dan cara menjawab yang meyakinkan panel interview.', '🎤', 3, 'starter'),
  ('pilih-beasiswa', 'Memilih Beasiswa & Jurusan', 'Perbandingan AAS vs LPDP dan cara memetakan latar belakangmu ke jurusan prioritas.', '🎯', 4, 'free'),
  ('sanggahan', 'Sanggahan & Administrasi', 'Kapan sanggahan LPDP layak diajukan dan kapan percuma.', '📋', 5, 'starter')
ON CONFLICT (slug) DO NOTHING;

-- Lessons: Metode #GaliDiri (8 dimensi asli dari system prompt Den Dhana AI)
INSERT INTO lessons (module_id, slug, title, content, order_index, duration_minutes)
SELECT id, 'apa-itu-gali-diri', 'Apa Itu #GaliDiri?',
$$## Kenapa #GaliDiri Ada

Kebanyakan kandidat gagal beasiswa bukan karena kurang berprestasi, tapi karena tidak tahu cara menceritakan diri mereka dengan tepat. **#GaliDiri** adalah pendekatan sistematis yang dikembangkan Den Dhana untuk menggali profil kandidat secara menyeluruh — akademis maupun non-akademis — sebelum menulis satu kata pun di essay.

Tanpa GALI DIRI yang tuntas, essay apapun akan terasa generik dan tidak bernyawa.

## 8 Dimensi yang Digali

1. **Pengalaman kerja** — apa yang sudah dikerjakan, apa dampaknya, peran spesifik, tanggung jawab
2. **Latar belakang pendidikan** — bidang studi, prestasi akademik, relevansi dengan tujuan
3. **Pencapaian (achievement)** — penghargaan, kontribusi nyata yang bisa diukur, proyek penting
4. **Minat dan passion** — apa yang benar-benar disukai dan mengapa itu penting
5. **Pekerjaan saat ini** — posisi, institusi, dampak yang dihasilkan sehari-hari
6. **Kontribusi yang pernah dilakukan** — ke komunitas, organisasi, masyarakat, atau bidang keahlian
7. **Goals** — jangka pendek dan jangka panjang, mengapa goals itu penting bagimu
8. **Keselarasan (alignment) berlapis** — goals kamu ↔ goals organisasi tempatmu bekerja ↔ goals Indonesia ↔ goals negara tujuan ↔ nilai sponsor beasiswa

## Cara Pakai

Jangan jawab kedelapan dimensi ini sekaligus. Gali satu per satu, mulai dari yang paling konkret (pengalaman kerja/pencapaian), baru masuk ke yang abstrak (goals, alignment). Setiap jawaban, tanyakan lagi ke diri sendiri: "kenapa ini penting?" sampai kamu menemukan jawaban yang benar-benar personal, bukan template.$$,
1, 8
FROM modules WHERE slug = 'gali-diri'
ON CONFLICT (module_id, slug) DO NOTHING;

-- Lessons: Profil Diri & Essay Komitmen (dari blog-posts/01)
INSERT INTO lessons (module_id, slug, title, content, order_index, duration_minutes)
SELECT id, 'struktur-profil-diri', 'Struktur Resmi Profil Diri LPDP',
$$## 3 Bagian Wajib

Sejak LPDP Batch 2 2026, Personal Statement esai naratif diganti **Profil Diri** — dokumen berbasis poin dengan 3 bagian:

### 1. Kekuatan
Tulis 2-3 poin, masing-masing disertai bukti singkat — pencapaian konkret, pengalaman spesifik, atau hasil kerja yang bisa diverifikasi. Hindari sifat abstrak ("saya pekerja keras") tanpa bukti.

> Kerangka: "[Nama kekuatan] — dibuktikan saat [situasi konkret], menghasilkan [hasil terukur]."

### 2. Kelemahan
Tulis 1-2 poin secara jujur, tapi setiap kelemahan **wajib** disertai langkah perbaikan konkret yang sudah/sedang kamu jalani.

> Kerangka: "[Kelemahan] — saya sadari lewat [momen konkret], dan sedang mengatasinya dengan [langkah spesifik]."

### 3. Pengalaman Relevan
Kronologis singkat, fokus hanya pada pengalaman paling relevan dengan rencana studi dan kontribusimu — bukan CV lengkap.

## Penting: Profil Diri ≠ Esai Komitmen

Profil Diri (poin per bagian) dan Esai Komitmen Kembali ke Indonesia (esai naratif maks. 1.500 kata) adalah **dua dokumen terpisah** dengan tujuan berbeda. Jangan digabung.$$,
1, 7
FROM modules WHERE slug = 'profil-diri-essay'
ON CONFLICT (module_id, slug) DO NOTHING;

INSERT INTO lessons (module_id, slug, title, content, order_index, duration_minutes)
SELECT id, 'formula-esai-komitmen', 'Formula 4 Langkah Esai Komitmen',
$$## Problem — Peran — Bukti — Rencana

Esai Komitmen Kembali ke Indonesia & Kontribusi (maks. 1.500 kata) ditulis dengan formula 4 langkah:

1. **Problem** — masalah nyata dan spesifik yang ingin kamu selesaikan. Bukan masalah umum, tapi yang benar-benar sudah kamu lihat/alami langsung.
2. **Peran Kamu** — kenapa kamu yang harus menyelesaikan masalah ini? Apa keunikan latar belakangmu?
3. **Bukti Nyata** — rekam jejak konkret yang menunjukkan kamu sudah bergerak ke arah ini, bukan cuma niat di atas kertas.
4. **Rencana Ke Depan** — apa yang akan kamu lakukan setelah lulus, bersama siapa, dengan cara apa.

## Tes Cepat 2 Menit

Minta orang yang tidak mengenalmu membaca esaimu. Kalau dalam 2 menit mereka tidak paham apa yang ingin kamu lakukan dan kenapa itu penting, esai itu harus ditulis ulang.

Hindari kalimat pembuka klise seperti "Sejak kecil saya bercita-cita...".$$,
2, 6
FROM modules WHERE slug = 'profil-diri-essay'
ON CONFLICT (module_id, slug) DO NOTHING;

-- Lessons: Interview (dari blog-posts/03, JST bukan GST)
INSERT INTO lessons (module_id, slug, title, content, order_index, duration_minutes)
SELECT id, 'apa-itu-jst', 'Apa Itu JST (Joint Selection Team)?',
$$## Bukan "GST" — Istilah Resminya JST

JST adalah singkatan dari **Joint Selection Team** — panel resmi gabungan interviewer Australia dan Indonesia yang mewawancarai dan menyeleksi kandidat Australia Awards Scholarship. Kamu mungkin pernah membaca "GST" — itu bukan istilah resmi, hanya kekeliruan eja/dengar yang beredar.

## 3 Kriteria yang Sebenarnya Dinilai

Semua pertanyaan interview AAS, seaneh apapun bentuknya, sebenarnya menguji 3 kriteria:

1. **Leadership** — bukti kepemimpinan nyata, bukan sekadar jabatan
2. **Academic Capability** — kesiapan akademik untuk program yang dituju
3. **Future Leader Potential** — potensi dampak jangka panjang untuk Indonesia

## Fungsi Utama Interview

Interview mengonfirmasi esai yang sudah kamu tulis — bukan ronde baru untuk cerita hal lain. Ketidaksesuaian antara esai dan jawaban interview adalah red flag terbesar.

Durasi: ~10-15 menit untuk short course (3 panelis), ~30 menit untuk S2/S3 (4 panelis).$$,
1, 8
FROM modules WHERE slug = 'interview'
ON CONFLICT (module_id, slug) DO NOTHING;

-- Lessons: Pilih Beasiswa & Jurusan (dari blog-posts/04, 05)
INSERT INTO lessons (module_id, slug, title, content, order_index, duration_minutes)
SELECT id, 'aas-vs-lpdp', 'AAS vs LPDP: Mana yang Cocok?',
$$## Beda Fokus Penilaian

- **AAS**: Future leader, strong academic capability, community/social impact, leadership potential, keterkaitan dengan pembangunan Indonesia
- **LPDP**: Kontribusi untuk Indonesia, relevansi dengan kebutuhan nasional, rekam jejak kepemimpinan, rencana pulang dan berkontribusi

Cek selalu ketentuan resmi terbaru di situs masing-masing beasiswa untuk cakupan negara tujuan dan syarat spesifik — ini bisa berubah tiap siklus.

## Cara Memilih

Petakan dulu profil dan tujuanmu (lewat #GaliDiri), baru cocokkan ke beasiswa yang nilai utamanya paling selaras — bukan sebaliknya.$$,
1, 6
FROM modules WHERE slug = 'pilih-beasiswa'
ON CONFLICT (module_id, slug) DO NOTHING;

-- Lessons: Sanggahan (dari blog-posts/02)
INSERT INTO lessons (module_id, slug, title, content, order_index, duration_minutes)
SELECT id, 'kapan-sanggahan-layak', 'Kapan Sanggahan LPDP Layak Diajukan',
$$## Sanggahan Bukan untuk Semua Kasus

Sanggahan hasil seleksi administrasi LPDP hanya layak diajukan kalau ada **kesalahan sistem yang bisa dibuktikan** — misalnya sertifikat bahasa resmi yang tidak terdeteksi sistem padahal sudah diunggah dengan benar.

Sanggahan yang percuma: mengunggah dokumen tidak resmi, atau menyanggah keputusan substansi (bukan kesalahan teknis).

## Masa Sanggah Singkat

Masa sanggah historisnya sangat singkat (~1 hari) — siapkan bukti pendukung SEBELUM pengumuman, jangan menunggu hasil keluar baru mencari dokumen.

Cek selalu tanggal dan mekanisme resmi terbaru di situs LPDP, karena bisa berubah tiap periode.$$,
1, 5
FROM modules WHERE slug = 'sanggahan'
ON CONFLICT (module_id, slug) DO NOTHING;

-- Quiz singkat per modul inti (grounded di lesson di atas)
INSERT INTO quizzes (module_id, title, passing_score)
SELECT id, 'Kuis: Metode #GaliDiri', 70 FROM modules WHERE slug = 'gali-diri'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation, order_index)
SELECT q.id, 'Ada berapa dimensi yang digali dalam metode #GaliDiri?',
  '["5 dimensi", "8 dimensi", "10 dimensi", "3 dimensi"]'::jsonb, 1,
  'Metode #GaliDiri menggali 8 dimensi: pengalaman kerja, pendidikan, pencapaian, minat, pekerjaan saat ini, kontribusi, goals, dan keselarasan.', 1
FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE m.slug = 'gali-diri';

INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation, order_index)
SELECT q.id, 'Kenapa essay terasa generik kalau tidak melalui GALI DIRI?',
  '["Karena terlalu pendek", "Karena tidak menggali profil kandidat secara menyeluruh", "Karena tidak pakai bahasa Inggris", "Karena tidak ada foto"]'::jsonb, 1,
  'Tanpa GALI DIRI yang tuntas, essay apapun akan terasa generik dan tidak bernyawa karena tidak menggali unique value kandidat.', 2
FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE m.slug = 'gali-diri';

INSERT INTO quizzes (module_id, title, passing_score)
SELECT id, 'Kuis: Interview & JST', 70 FROM modules WHERE slug = 'interview'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation, order_index)
SELECT q.id, 'Apa kepanjangan resmi dari JST dalam seleksi AAS?',
  '["General Selection Team", "Joint Selection Team", "Judicial Screening Team", "Junior Scholar Team"]'::jsonb, 1,
  'JST = Joint Selection Team, panel gabungan interviewer Australia dan Indonesia. "GST" adalah kekeliruan eja yang beredar.', 1
FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE m.slug = 'interview';

INSERT INTO quiz_questions (quiz_id, question, options, correct_index, explanation, order_index)
SELECT q.id, 'Apa fungsi utama sesi interview beasiswa?',
  '["Ronde baru untuk cerita pengalaman lain", "Mengonfirmasi esai yang sudah ditulis", "Tes kemampuan bahasa Inggris semata", "Menilai penampilan fisik"]'::jsonb, 1,
  'Interview mengonfirmasi esai yang sudah kamu tulis. Ketidaksesuaian antara esai dan jawaban interview adalah red flag terbesar.', 2
FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE m.slug = 'interview';

-- Achievements dasar
INSERT INTO achievements (code, title, description, icon) VALUES
  ('first_lesson', 'Langkah Pertama', 'Menyelesaikan lesson pertama di Learning Modules', '🌱'),
  ('module_complete', 'Modul Tuntas', 'Menyelesaikan semua lesson dalam satu modul', '📗'),
  ('first_quiz_pass', 'Lulus Kuis Pertama', 'Lulus kuis pertama dengan skor di atas passing grade', '🎓'),
  ('perfect_quiz', 'Skor Sempurna', 'Mendapatkan skor 100% di sebuah kuis', '💯'),
  ('first_essay', 'Essay Pertama', 'Mengirim essay pertama untuk direview AI', '✏️'),
  ('first_cv', 'CV Pertama', 'Menganalisis CV pertama kali', '📄'),
  ('application_tracked', 'Mulai Tracking', 'Menambahkan aplikasi beasiswa pertama ke Tracker', '📋'),
  ('alumni_approved', 'Resmi Jadi Alumni', 'Pengajuan Awardee Alumni disetujui', '🎓')
ON CONFLICT (code) DO NOTHING;
