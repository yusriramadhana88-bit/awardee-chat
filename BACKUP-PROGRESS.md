# BACKUP PROGRESS - AwardeeOS

**Tanggal backup:** 2026-06-15
**Versi:** AwardeeOS v2.0.1 (package.json)
**Status:** Tidak ada perubahan signifikan sejak sesi terakhir (2026-06-11) — kondisi proyek persis sama (build sukses, belum di-commit, belum deploy).

## Fitur yang sudah jalan (lokal, build sukses)
- `/` Landing page
- `/register`, `/login`
- `/chat` — Chat AI "Den Dhana" (rate limit per tier, modal verifikasi WhatsApp untuk free tier)
- `/tracker` (+ new, [id], [id]/stages, share/[token]) — Scholarship application tracker
- `/dashboard` — Overview AwardeeOS (sidebar, stats, feature grid, upgrade section)
- `/dashboard/calendar` — Kalender Beasiswa (Starter+)
- `/dashboard/documents` — Checklist Dokumen (Free, semua tier) — AAS/LPDP/Chevening/GKS
- `/dashboard/ielts` — IELTS/Test Score Tracker (Starter+)
- `/dashboard/cv` — CV Analyzer via AI (Starter+ 3x/bulan, Pro unlimited)
- `/dashboard/essay` — Essay Workshop + kritik AI "GALI DIRI" (Pro only)

`npx tsc --noEmit` dan `npm run build` SUKSES — 21 routes, no errors (terakhir diverifikasi 2026-06-11).

## Bug yang SUDAH diperbaiki
- Limit chat free tier diseragamkan jadi 10/hari (sebelumnya inconsistent 3 vs 10)
- `.env.local.example` ditambah dokumentasi `SUPABASE_SERVICE_ROLE_KEY`
- Modal verifikasi WhatsApp untuk error `PHONE_REQUIRED` di chat
- 4 bug "stuck loading state" (setSaving/setReviewing tidak reset saat session expired) di calendar, ielts, essay, chat

## Bug yang BELUM diperbaiki / risiko
- Essay Workshop (Pro) AI critique **tidak ada limit pemakaian** — potensi cost gap API
- Migration SQL `002_awardeeos_v2.sql` belum dipastikan sudah dijalankan di Supabase — tanpa ini, fitur calendar_events, test_scores, essay_drafts, cv_analyses, document_checklist_items tidak akan berfungsi
- XENDIT_LINKS di `app/dashboard/page.tsx` masih placeholder (payment belum live)

## Status deploy
- **Lokal:** `.env.local` sudah ada dan terisi lengkap (Supabase URL/Anon/Service Role, Anthropic, OpenAI API key)
- **Git:** branch `master`, banyak perubahan belum di-commit (lihat git status di bawah) — commit terakhir `10520e3` (docs: add CLAUDE.md and memory)
- **Vercel:** BELUM deploy
- **Supabase:** schema dasar ada, migration `002_awardeeos_v2.sql` status eksekusi belum dipastikan

## Langkah selanjutnya (pending)
1. Jalankan migration di Supabase SQL Editor secara berurutan: `schema.sql` → `add_phone_to_profiles.sql` → `002_awardeeos_v2.sql`
2. Commit perubahan AwardeeOS v2.0.1 ke git
3. Push ke GitHub, deploy ke Vercel (set semua env vars termasuk `SUPABASE_SERVICE_ROLE_KEY`)
4. Arahkan CNAME `chat.awardee.id` ke Vercel
5. Setup Xendit payment links, ganti `XENDIT_LINKS` di `app/dashboard/page.tsx`
6. Extract YouTube transcripts: `npm run extract-youtube` (via `scripts/extract-youtube.mjs`)
7. (Opsional) Tambahkan limit harian untuk Essay Workshop AI critique (Pro) untuk kontrol biaya API

## Git status saat backup (belum di-commit)
```
 M .env.local.example
 M CARA-DEPLOY.md
 M app/api/chat/route.ts
 M app/chat/page.tsx
 M app/dashboard/page.tsx
 M app/layout.tsx
 M package.json
 M supabase/schema.sql
?? app/api/cv-analyze/
?? app/api/essay-analyze/
?? app/dashboard/_components/
?? app/dashboard/calendar/
?? app/dashboard/cv/
?? app/dashboard/documents/
?? app/dashboard/essay/
?? app/dashboard/ielts/
?? app/dashboard/layout.tsx
?? app/tracker/
?? lib/tracker.ts
?? lib/use-user.ts
?? supabase/migrations/002_awardeeos_v2.sql
```
