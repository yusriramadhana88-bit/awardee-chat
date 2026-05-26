# Project: awardee-chat

**Status:** Live — Production
**Live URL:** https://dendhana.awardee.id
**Backup URL:** https://awardee-chat.vercel.app
**Repo:** https://github.com/yusriramadhana88-bit/awardee-chat
**Local:** C:\Users\yusri\awardee-chat

## Stack
- Next.js 14, TypeScript, Tailwind CSS
- Supabase (auth + PostgreSQL)
- Anthropic Claude Haiku (`claude-haiku-4-5-20251001`)
- Vercel (hosting, auto-deploy dari GitHub master)

## Infrastructure
- **Supabase:** project `[SUPABASE_PROJECT_REF - lihat di .env.local]` (URL di .env.local)
- **Vercel team:** `dhana-awardee-id-s-projects`
- **Domain registrar:** Hostinger (DNS CNAME sudah ditambah)
- **Vercel Token:** lihat di vercel.com/account/tokens → `awardee-chat-deploy`
- **GitHub PAT:** lihat di github.com/settings/tokens → `awardee-chat-cli`

## Database Schema (Supabase)

### profiles
```
id UUID PK, name TEXT, subscription_tier TEXT (free/starter/pro),
subscription_expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ, phone TEXT UNIQUE
```

### daily_usage
```
user_id UUID, date TEXT (YYYY-MM-DD), count INT
```
⚠️ Perlu diubah untuk mendukung per-week (free) dan per-5-jam (starter)

## Key Files
```
app/api/chat/route.ts        — AI API, limit logic, SYSTEM_PROMPT (Den Dhana)
app/api/check-phone/route.ts — Cek duplikat nomor WA
app/api/save-phone/route.ts  — Simpan nomor WA ke profiles
app/page.tsx                 — Landing page + PRICING (perlu diupdate copy-nya)
app/register/page.tsx        — Form registrasi dengan field WhatsApp
app/chat/page.tsx            — Halaman chat (history belum disimpan ke DB)
knowledge/base.txt           — 34 video YouTube (1.87M chars knowledge base)
middleware.ts                — Auth redirect logic
.env.local                   — API keys (tidak di-commit)
SESSION_CONTEXT.md           — Context lengkap (local only, tidak di GitHub)
```

## Pricing Tiers
| Tier | Limit | Harga |
|------|-------|-------|
| Free | 3 chat/minggu | Gratis |
| Starter | 10 chat/5 jam | Rp99K (TBD) |
| Pro | 50 chat/hari | Rp299K (TBD) |

## Anti-Abuse System
- Registrasi wajib nomor WhatsApp
- 1 nomor WA = 1 akun (UNIQUE constraint di profiles.phone)
- Normalisasi ke +62 format
- Double-check di server (/api/save-phone)

---

## ⏳ PENDING TASKS (harus diselesaikan)

### 1. 🔴 Email konfirmasi tidak masuk
**Masalah:** Supabase built-in SMTP limit 4 email/jam (free tier)
**Solusi:** Setup custom SMTP di Supabase:
- URL: supabase.com/dashboard/project/[SUPABASE_PROJECT_REF - lihat di .env.local]/auth/smtp
- Recommended provider: **Resend.com** (free: 3000 email/bln)
- Atau: Brevo/Sendinblue, Mailgun, SMTP2GO
**Steps:**
1. Daftar Resend.com → dapatkan API key
2. Di Supabase: Auth → SMTP Settings → enable custom SMTP
3. Host: smtp.resend.com, Port: 465, User: resend, Pass: API key
4. From: noreply@awardee.id (atau subdomain)

### 2. 🔴 Pricing display salah di app/page.tsx
**Yang harus diubah:**
- Free: ganti "10 chat free" → "3 chat per minggu"
- Starter: tambah "10 chat per 5 jam"
- Pro: tambah "50 chat per hari"
**File:** `app/page.tsx` — cari bagian pricing/plans

### 3. 🔴 Limit logic salah di app/api/chat/route.ts
**Saat ini:** Semua tier pakai `daily_usage` per hari
**Yang harus diubah:**
- Free: count per ISO week (`YYYY-WW` format, bukan YYYY-MM-DD)
- Starter: count dalam 5 jam terakhir (sliding window query ke daily_usage atau tabel baru)
- Pro: tetap per hari (50/day) ✅

**Cara implementasi Free (per week):**
```typescript
// Ganti 'date' dengan week string
const weekStr = getISOWeek(new Date()) // format: "2026-W21"
// Query: .eq('date', weekStr)
```

**Cara implementasi Starter (per 5 jam):**
```typescript
// Perlu tabel usage_log(user_id, created_at) 
// Query: count WHERE user_id = X AND created_at > NOW() - 5 hours
// Atau: upsert ke daily_usage dengan window key "YYYY-MM-DD-HH" (5 jam block)
```

### 4. 🟡 Chat history belum disimpan ke database
**Masalah:** History hilang saat refresh (hanya React state)
**Solusi:**
```sql
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: user only sees their own messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);
```
- Di `/chat/page.tsx`: load messages on mount, append on send
- Di `/api/chat/route.ts`: save user message + assistant response

---

## Completed ✅
- [x] Next.js 14 app setup + deploy
- [x] Supabase auth (email + password)
- [x] Den Dhana SYSTEM_PROMPT lengkap
- [x] Knowledge base 34 YouTube videos (1.87M chars)
- [x] Aturan kerahasiaan sumber (tidak boleh sebut YouTube)
- [x] GALI DIRI trademark dalam persona
- [x] Multi-beasiswa: AAS, LPDP, GKS, Chevening
- [x] Custom domain dendhana.awardee.id (Hostinger CNAME → Vercel)
- [x] GitHub auto-deploy terhubung ke Vercel
- [x] Limit free tier: 3 chat/hari (logic, belum per minggu)
- [x] WhatsApp phone uniqueness anti-abuse
- [x] /api/check-phone + /api/save-phone endpoints
- [x] profiles.phone UNIQUE column di Supabase
