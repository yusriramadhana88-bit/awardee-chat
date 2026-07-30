# Changelog — AWARDEE APP

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versi: [Semantic Versioning](https://semver.org/) — Major.Minor.Patch

---

## [2.13.0] — 2026-07-30

### Added
- **Instagram Auto-Reply + Auto-DM ("ManyChat-style")** — comment kata kunci tertentu (misal "MAU") di post/reel Instagram → bot otomatis balas comment secara publik + kirim DM privat lewat Instagram Private Replies API (`lib/instagram-auto-dm.ts`, `app/api/instagram/webhook/route.ts`). Admin atur rule (kata kunci → balasan → isi DM) di `/admin/auto-dm`, dengan log 10 aktivitas terakhir buat cek reply/DM berhasil atau tidak
- Migration `019_instagram_auto_dm.sql`: tabel `auto_dm_rules` + `auto_dm_log` (idempotent — komentar yang sama tidak diproses dobel meski webhook retry)
- Signature verification webhook pakai `X-Hub-Signature-256` (HMAC-SHA256 app secret), verified terhadap dokumentasi resmi Meta sebelum implementasi
- Panduan setup manual (`INSTAGRAM_AUTO_DM_SETUP.md`) untuk bagian yang butuh akses Meta Business/Facebook Developer milik sendiri — Claude tidak bisa mengerjakan ini karena butuh kredensial

---

## [2.12.1] — 2026-07-30

### Changed
- **Warna status bar kuota AI di header** kini mengikuti pola indikator kuota Claude — hijau (≥50% sisa), kuning (20-49%), merah (<20%), diterapkan ke bar maupun angka persentasenya

---

## [2.12.0] — 2026-07-30

### Added
- **Tombol "Kembali" global** di setiap halaman dashboard (kecuali Overview) — pakai browser history (`router.back()`), jadi tidak perlu klik Home/sidebar tiap mau balik ke menu sebelumnya
- **"Bingung mulai dari mana?" sekarang jadi To Do List berurutan** (`GettingStartedGuide.tsx`) — pilih LPDP/AAS/belum yakin, langsung muncul checklist bernomor step-by-step (LPDP Center → Checklist Dokumen → Cek Dokumen & Review Esai → Chat → Tracker, dst — sama persis dengan panduan yang sudah dipakai chatbot CS)

### Changed
- **Tampilan kuota AI disederhanakan jadi persentase** — sebelumnya "Rp69.514/Rp72.000", sekarang cukup "96%" (`lib/quota-format.ts`, dipakai di QuotaHeader + semua halaman Review Esai/Cek Dokumen AAS+LPDP + section upgrade dashboard). Angka Rupiah asli tetap dipakai penuh di backend untuk perhitungan quota — ini murni penyederhanaan tampilan

---

## [2.11.0] — 2026-07-30

### Added
- **Testimoni carousel bergaya screenshot chat WA** (`TestimonialCarousel.tsx`) — swipeable, direkonstruksi dari testimoni WhatsApp asli (nama, program, kutipan), dipasang di homepage awardee.id dan dashboard member area
- **Free tier boleh coba Review Esai (AAS+LPDP) 1x** — sebelumnya digated total di tier Starter. Setelah 1x pakai, muncul banner sales-copy upgrade alih-alih diblokir diam-diam
- **Fitur berbayar sekarang tampil blur (bukan disembunyikan total)** untuk tier yang belum upgrade — CV Analyzer, IELTS Tracker, Kalender Beasiswa, Essay Workshop, Checklist Dokumen, Achievements, Cek Dokumen AAS/LPDP, Scholarship Tracker — supaya user lihat gambaran fiturnya sebelum upgrade (`FeatureLock.tsx` sekarang jadi wrapper blur, bukan full block)
- **Learning Modules: silabus (daftar judul lesson) tetap terlihat** untuk modul yang di-lock — isi lesson & kuis tetap digated penuh (tidak diblur, karena kontennya berharga & tidak boleh bocor ke DOM)
- **Tabel perbandingan lengkap semua benefit per tier** (`TierComparisonTable.tsx`) di section upgrade dashboard, tepat di atas tombol checkout lynk.id yang sudah ada
- **AAS Center dibuka untuk semua tier** (sebelumnya Starter+) — konsisten dengan Review Esai yang sekarang bisa dicoba gratis; Cek Dokumen AAS tetap Starter+ (tampil blur untuk free tier)
- **CV Analyzer sekarang terima upload PDF & Word (.docx)**, bukan cuma tempel teks manual (`lib/file-extract.ts`, pakai `pdf-parse` v2 untuk PDF)

---

## [2.10.0] — 2026-07-29

### Fixed
- **Program afiliasi ternyata tidak pernah benar-benar melacak klik/konversi** — audit menemukan tabel `referrals` tidak pernah diisi kode apapun: tidak ada capture `?ref=CODE` di manapun, dan tidak ada koneksi lynk.id (memang sengaja tanpa webhook, sama seperti semua produk lain). Dashboard afiliasi selalu menampilkan 0 klik/0 konversi meskipun affiliate benar-benar berhasil merujuk pembeli

### Added
- **Tracking afiliasi semi-otomatis end-to-end**:
  1. `ReferralCapture.tsx` (dipasang di root layout) mendeteksi `?ref=CODE` di halaman manapun, mencatat 1 baris klik ke tabel `referrals` via `POST /api/affiliate/click`, disimpan di localStorage (30 hari)
  2. Saat orang itu daftar akun (`app/register/page.tsx` → `/api/confirm-user`), klik yang tersimpan otomatis di-attach ke akun barunya (`referee_user_id`)
  3. Saat admin mengaktifkan/upgrade tier user tersebut (`PATCH /api/admin/users`) — langkah yang memang sudah manual untuk semua user karena lynk.id tanpa webhook — sistem otomatis mendeteksi klik referral yang belum terkonversi, menghitung komisi (harga tier × commission_rate afiliasi, termasuk harga promo kalau berlaku), dan mengkredit ke `affiliates.total_earned`
  - Diuji end-to-end langsung ke database production (klik → attach → konversi → komisi Rp49.000×20%=Rp9.800 terverifikasi tepat), lalu dibersihkan

---

## [2.9.0] — 2026-07-29

### Fixed
- **Tombol "kembali ke atas" tidak pernah muncul** — ternyata scroll di app ini terjadi di `document.body`, bukan `window` (efek samping dari `overflow-x: hidden` di `globals.css` yang otomatis membuat `overflow-y` body jadi `auto`). Listener & aksi scroll-to-top sekarang menarget `document.body`, bukan `window`
- **Halaman Chat (Tanya Den Dhana Langsung/AAS/LPDP) tidak ada jalan kembali ke dashboard** — sebelumnya cuma ada tombol "Keluar" (logout total) di kanan atas, bikin bingung karena user pikir bisa kembali tapi malah ke-logout. Sekarang ada tombol **"Dashboard"** terpisah di sebelah "Keluar", dan logo/ikon kiri atas juga mengarah ke `/dashboard` (bukan homepage publik) kalau user sudah login

### Added
- **Banner booking Konsultasi Private 30 menit (Rp200.000)** di semua halaman chat (CS/AAS/LPDP) — link langsung ke WhatsApp Kak Dhana (+62 812-8721-2755) dengan pesan pre-filled. Juga ditambahkan ke katalog produk di system prompt supaya bot bisa menawarkan opsi ini secara proaktif dengan harga yang benar

---

## [2.8.1] — 2026-07-29

### Fixed
- **Tombol collapse sidebar sekarang selalu terlihat saat scroll** — sebelumnya posisinya `absolute` relatif ke wrapper yang ikut scroll normal (beda dari sidebar-nya sendiri yang `sticky`), jadi tombolnya hilang begitu discroll sedikit. Sekarang `fixed` ke viewport, selalu nempel di tempat yang sama
### Added
- **Tombol "kembali ke atas"** (`ScrollToTop.tsx`) — muncul otomatis setelah scroll ke bawah >400px, klik untuk scroll smooth ke atas halaman

---

## [2.8.0] — 2026-07-29

### Added
- **Web search real-time di semua chatbot (CS, AAS, LPDP)** — bot sekarang bisa cari info terkini di internet (tanggal, deadline, syarat, batch) sebelum menjawab, bukan cuma bilang "gak tahu, cek sendiri". Diprioritaskan ke sumber resmi (beasiswalpdp.kemenkeu.go.id, australiaawardsindonesia.org). Dites langsung ke Anthropic API dan terbukti berhasil dapat tanggal resmi LPDP Batch 2 2026 dengan sitasi sumber
### Changed
- System prompt (`lib/prompts.ts`) diperbarui: aturan lama "tidak bisa browsing, akui keterbatasan" diganti jadi "wajib cari real-time dulu sebelum menjawab soal tanggal/syarat beasiswa", baru mengaku keterbatasan kalau pencarian benar-benar tidak menemukan apa-apa

---

## [2.7.0] — 2026-07-29

### Added
- **Sidebar dashboard bisa di-collapse** (desktop) — tombol panah kecil di tepi sidebar untuk sembunyikan/tampilkan menu kiri sesuai kebutuhan, status collapse disimpan di localStorage jadi tetap konsisten walau reload halaman

---

## [2.6.1] — 2026-07-29

### Added
- **Nama user di header kanan atas** (`QuotaHeader.tsx`) — sekarang menampilkan nama user yang sedang login di samping badge tier, sisa kuota AI, dan tombol Upgrade

---

## [2.6.0] — 2026-07-29

### Added
- **Header kuota AI di kanan atas dashboard** (`app/dashboard/_components/QuotaHeader.tsx`, desktop) — menampilkan badge tier aktif, sisa kuota AI bulan ini (Rp), dan tombol Upgrade (disembunyikan untuk tier VVIP). Data dari endpoint baru `GET /api/quota`, ringan (tidak ikut narik riwayat esai/dokumen) supaya cepat dipanggil di tiap halaman dashboard

---

## [2.5.1] — 2026-07-29

### Fixed
- **Resend benar-benar aktif**: domain pengirim `mail.awardee.id` diverifikasi di Resend (DKIM+SPF ditambahkan ke DNS Hostinger, subdomain terpisah dari root `awardee.id` supaya tidak bentrok dengan mailbox asli), `RESEND_API_KEY` diisi di `.env.local` & Vercel Environment Variables, dan `lib/email.ts` diupdate untuk kirim dari `hello@mail.awardee.id`. Lead magnet registrasi (lihat 2.4.0) sekarang benar-benar terkirim, bukan cuma skip diam-diam

---

## [2.5.0] — 2026-07-29

### Fixed
- **Batas karakter Review Esai AAS Center tidak sesuai ketentuan resmi form OASIS** (feedback dari user Febriyanto): sebelumnya 1 textarea gabungan untuk semua pertanyaan per esai dengan cek total gabungan (6500/4500 karakter) — user bisa saja menulis 6000 karakter di jawaban pertanyaan 1 saja dan sistem tetap menerimanya, padahal OASIS membatasi **2000 karakter PER PERTANYAAN** dan menolak kelebihannya. Diperbaiki: sekarang 1 textarea terpisah per pertanyaan, masing-masing hard-capped 2000 karakter (`MAX_CHARS_PER_QUESTION` di `lib/aas-requirements.ts`), divalidasi ulang di server (`app/api/aas/essay-review`), dan disimpan per-pertanyaan (kolom baru `answers` JSONB, migration 018) supaya bisa di-reload dengan benar untuk diedit

### Added
- **Panduan navigasi untuk user baru**: dashboard Overview kini punya section "🧭 Bingung mulai dari mana?" (3 tombol pilihan cepat: LPDP/AAS/belum yakin) dan grid fitur dikelompokkan per kebutuhan (Program Beasiswa / Ngobrol Sama AI / Alat Bantu Persiapan) — bukan 12 kartu menumpuk jadi satu daftar
- **Floating chat widget** (`app/dashboard/_components/FloatingChat.tsx`) — muncul di semua halaman dashboard (bukan cuma halaman /chat), bisa langsung ditanya "menu mana yang harus aku klik" tanpa pindah halaman. System prompt CS bot (`lib/prompts.ts`) ditambah "Peta Menu AWARDEE APP" — panduan urutan menu spesifik per tujuan (LPDP/AAS/belum yakin) supaya AI bisa kasih arahan konkret, bukan generik

---

## [2.4.0] — 2026-07-29

### Added
- **Lead magnet otomatis saat registrasi**: setiap akun baru (semua signup = tier free, upgrade tier terjadi manual belakangan) langsung dapat 1 lead magnet gratis dikirim ke email begitu daftar selesai — dipilih acak dari `LEAD_MAGNETS` di `lib/lead-magnets.ts` (saat ini: "Paket Persiapan Administrasi LPDP Batch 2 2026" via link, dan "Panduan Lolos Interview AAS" sebagai attachment PDF langsung dari `telegram-bot/assets/`)
- `lib/email.ts` — wrapper Resend untuk kirim email transaksional (`sendLeadMagnetEmail`), dipanggil dari `app/api/confirm-user` tepat setelah email dikonfirmasi otomatis
- ⚠️ **Butuh setup manual sebelum benar-benar mengirim**: daftar akun di resend.com, verifikasi domain pengirim (`awardee.id`), lalu isi `RESEND_API_KEY` di `.env.local` (lokal) dan Vercel Environment Variables (production) — lihat `.env.local.example`. Tanpa key ini registrasi tetap jalan normal, hanya email lead magnet yang di-skip diam-diam (ter-log di server)

---

## [2.3.0] — 2026-07-29

### Added
- **Kuota AI gabungan AAS+LPDP**: `lib/ai-quota.ts` (menggantikan `lib/lpdp-quota.ts`) — satu ceiling biaya AI bulanan per tier dipakai bersama oleh Review Esai & Cek Dokumen di AAS Center maupun LPDP Center, konsisten dengan fakta bahwa keduanya sudah satu subscription yang sama
- **Enforcement kuota di AAS Center**: sebelumnya AAS Center tidak punya batas biaya AI sama sekali (hanya gated tier Starter). Sekarang `checkAiQuota` dipanggil di `app/api/aas/essay-review` dan `app/api/aas/doc-check`, hard block begitu kuota bulan berjalan habis — sama seperti LPDP Center
- **Booster Kuota AI** (top-up berbayar): 3 paket dijual manual via lynk.id (WhatsApp konfirmasi bayar, sama seperti membership) — Extra Kuota Kecil Rp20K, Sedang Rp50K, Besar Rp100K, margin ~72%. Berlaku untuk bulan kalender saat diaktivasi, tidak roll-over. Tabel `token_topups` (migration 017), diaktivasi admin via `/admin/users` (`app/api/admin/topups`)
- **DB Migration 017** (`supabase/migrations/017_shared_ai_quota_and_topup.sql`): rename `lpdp_token_usage` → `ai_token_usage` + kolom `product`, tabel baru `token_topups`
- Section "⚡ Booster Kuota AI" di `/dashboard#booster` — tampilkan 3 paket dengan link lynk.id langsung
- Kolom "Booster Kuota AI" di `/admin/users` — admin pilih paket & aktivasi manual per user

### Fixed
- **504/hang pada Review Esai untuk esai panjang** (~3800+ karakter): request bisa kena batas `maxDuration=60` Vercel di tengah generate AI sebelum sempat insert ke DB, browser menunggu stream yang tidak akan pernah selesai tanpa pesan error apa pun. Diperbaiki dengan menurunkan `max_tokens` (3072→2000) di `app/api/aas/essay-review` & `app/api/lpdp/essay-review`, plus timeout client-side 55 detik (AbortController) di kedua halaman esai yang menampilkan pesan error jelas kalau stream tetap macet

### Changed
- Pesan upsell kuota habis di halaman Review Esai & Cek Dokumen (AAS+LPDP) kini menyebut opsi beli Booster Kuota AI, tidak cuma upgrade tier

---

## [2.1.0] — 2026-06-17

### Added
- **Gamification system**: lib/gamification.ts dengan 10 level lucu (Baru Niat → Dewa Beasiswa) untuk CV/essay, 5 level IELTS (Baru Bangun → Beneran Gila Sih), dan 5 level agregat "Pejuang Beasiswa" untuk dashboard overview
- **LevelProgressBar component**: `app/dashboard/_components/LevelProgressBar.tsx` — reusable gamified progress bar dengan nama level, emoji, warna, dan pesan motivasi
- **CV Analyzer**: Score 1-10 kini ditampilkan sebagai LevelProgressBar di atas hasil analisis dan di riwayat analisis (badge level mini)
- **Essay Workshop**: Score 1-10 kini ditampilkan sebagai LevelProgressBar di bawah kritik AI, label diupdate menjadi "Kritik AI — GALI DIRI"
- **IELTS Tracker**: Overall score kini ditampilkan dengan LevelProgressBar + nama level IELTS di header "Progres Menuju Target"
- **Dashboard Overview**: Kartu "Level Pejuang Beasiswa" baru — menghitung XP dari semua aktivitas (CV, essay review, tes, tracker) dan menampilkan level + progress bar ke level berikutnya
- **Admin Dashboard** (`/admin/`): layout gelap terpisah, halaman overview stats (total user per tier, chat hari ini, top affiliates), halaman kelola user (tabel semua user + upgrade/downgrade tier manual), halaman kelola affiliates (tabel afiliasi + toggle suspend/aktif)
- **Sistem Affiliasi**: Tabel `affiliates` dan `referrals` di Supabase. Dashboard member `/dashboard/affiliate` (daftar jadi afiliasi, salin link referral, lihat stats klik/konversi/komisi). API `/api/affiliate` (GET status + POST daftar)
- **Admin API routes**: `/api/admin/users` (GET semua user, PATCH tier), `/api/admin/affiliates` (GET semua afiliasi + stats, PATCH payout/status)
- **Middleware**: `/admin/*` kini dilindungi — hanya user dengan `is_admin = true` yang bisa akses, non-admin di-redirect ke `/dashboard`
- **Support pages**: `/about`, `/disclaimer`, `/privacy`, `/terms`, `/copyright`, `/faq`, `/contact` — semua dengan SEO metadata, format profesional bahasa Indonesia
- **Footer global**: Link ke semua halaman legal di setiap halaman
- **lib/anthropic.ts**: Centralized Anthropic client dengan model constants (`HAIKU_MODEL`, `SONNET_MODEL`)
- **lib/env.ts**: Shared `loadEnvKey()` untuk membaca `.env.local` langsung (workaround Next.js local dev env)
- **DB Migration 003** (`supabase/migrations/003_gamification_admin_affiliate.sql`): kolom `score` di cv_analyses & essay_drafts, kolom `is_admin` di profiles, tabel affiliates + referrals dengan RLS
- **CHANGELOG.md** ini — sistem tracking versi per sesi

### Changed
- **Branding**: Semua referensi "AwardeeOS" di UI diganti menjadi "AWARDEE APP" (layout, dashboard, metadata, footer)
- **Model AI**: CV Analyzer dan Essay Workshop diupgrade dari `claude-haiku-4-5-20251001` ke `claude-sonnet-4-6` untuk kualitas analisis lebih akurat dan mendalam
- **Chat AI Den Dhana**: Tetap menggunakan `claude-haiku-4-5-20251001` untuk efisiensi biaya (volume tinggi, termasuk free tier)
- **CV Analyzer API**: POST kini mengekstrak skor 1-10 dari output AI dan menyimpannya ke kolom `score` di cv_analyses
- **Essay Workshop API**: POST kini mengekstrak skor 1-10 dari output AI dan menyimpannya ke kolom `score` di essay_drafts; GET history sudah include kolom score
- **Dashboard sidebar**: Tambah nav item "Afiliasi & Komisi" 🤝 untuk semua tier
- **app/layout.tsx**: Metadata diupdate ke AWARDEE APP, tambah Footer component dengan link legal, body kini flex column min-h-screen
- **middleware.ts**: Proteksi `/admin/*` dengan cek `is_admin`, matcher diperbarui ke `/dashboard/:path*` dan `/admin/:path*`
- **Duplikasi kode dihilangkan**: `loadEnvKey` dan `getAnthropic` yang duplikat di 3 route files → digantikan import dari `lib/env.ts` dan `lib/anthropic.ts`

### Konvensi versi ke depan
- **Major** (3.0.0): Breaking change atau rilis publik besar
- **Minor** (2.x.0): Fitur baru per fase implementation pass
- **Patch** (2.0.x): Bug fix saja

---

## [2.0.1] — 2026-06-11

### Fixed
- Limit chat free tier diseragamkan jadi 10/hari (sebelumnya inconsistent 3 vs 10 di beberapa tempat)
- `.env.local.example` ditambah dokumentasi `SUPABASE_SERVICE_ROLE_KEY`
- Modal verifikasi WhatsApp untuk error `PHONE_REQUIRED` di halaman chat
- 4 bug "stuck loading state" (setSaving/setReviewing tidak direset saat session expired) di calendar, ielts, essay, chat

---

## [2.0.0] — 2026-05-26

### Added
- Dashboard "AWARDEE APP" lengkap: tracker, kalender, checklist dokumen, IELTS tracker, CV analyzer, essay workshop
- Sistem subscription tier: Free / Starter Rp99K / Pro Rp299K
- Gating fitur via `canAccess()` dan `<FeatureLock>` component
- AI Den Dhana chat dengan rate limit per tier
- Modal verifikasi WhatsApp untuk anti-abuse free tier
- 21 routes, TypeScript strict, Supabase Auth + RLS

---

## Roadmap
| Versi | Fitur | Target |
|-------|-------|--------|
| v2.2.0 | GALI DIRI chatbot (onboarding AI, upload CV/essay/skor, dashboard personal, rekomendasi beasiswa/kampus/jurusan/negara, CTA mentoring 7.5jt) | Fase 2 |
| v2.3.0 | Simulasi Interview Beasiswa gamified (readiness 0-100%, level names interview) | Fase 2 |
| v2.4.0 | Simulasi IELTS/TOEFL full chat-based dengan skor per seksi di akhir | Fase 3 |
| v3.0.0 | Telegram Bot (broadcast harian ke grup gratis + update 2 hari ke member berbayar) + deploy Vercel | Fase 3 |
| v3.1.0 | i18n multi-bahasa (ID / EN / ZH) + AI-friendly website (llms.txt, JSON-LD, sitemap) | Fase 4 |
| v3.2.0 | MCP Server AWARDEE APP (akses konten beasiswa publik via Claude, aman dari data finansial/private) | Fase 5 |
| v4.0.0 | Job Dashboard (tracker lowongan dalam/luar negeri + bimbingan karir) | Project baru |
