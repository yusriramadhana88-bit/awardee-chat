# Panduan Deploy Awardee.id Chat — Step by Step

## Gambaran Besar
Lo akan punya:
- **chat.awardee.id** → halaman chat AI
- **chat.awardee.id/dashboard** → dashboard member
- Subscription 3 tier: Gratis (10/hari), Starter Rp99K (50/hari), Pro Rp299K (unlimited)
- Pembayaran via Xendit (transfer, GoPay, OVO, DANA)

---

## HARI 1 — Setup & Test Lokal

### Langkah 1: Install Node.js
1. Buka **nodejs.org**
2. Download tombol hijau besar "LTS Recommended"
3. Install (klik Next terus)
4. **Restart komputer**
5. Buka PowerShell, ketik: `node --version` → harus muncul angka seperti `v20.x.x`

### Langkah 2: Buat akun Supabase (database gratis)
1. Buka **supabase.com** → Sign up (bisa pakai Google)
2. Klik "New Project"
3. Nama project: `awardee-chat`
4. Set password yang kuat (simpan!)
5. Pilih region: **Southeast Asia (Singapore)**
6. Tunggu ~2 menit sampai project siap
7. Masuk ke **Settings → API**
8. Copy dan simpan:
   - `Project URL` (bentuknya: https://xxxxx.supabase.co)
   - `anon public` key (string panjang dimulai dari eyJ...)
   - `service_role` key (secret, jangan disebar — dipakai server saja)

### Langkah 3: Setup database di Supabase
1. Di Supabase, klik **SQL Editor** (ikon di sidebar kiri)
2. Klik "New query"
3. Jalankan SQL berikut SECARA BERURUTAN (copy-paste isi file, klik RUN, tunggu "Success", baru lanjut ke file berikutnya):
   - `supabase/schema.sql` — tabel dasar (profil, usage, scholarship tracker)
   - `supabase/migrations/add_phone_to_profiles.sql` — kolom nomor WhatsApp (anti-abuse)
   - `supabase/migrations/002_awardeeos_v2.sql` — tabel AwardeeOS v2.0 (IELTS tracker, essay workshop, kalender, CV analyzer, checklist dokumen)
4. Setiap file harus muncul "Success" tanpa error sebelum lanjut ke file berikutnya

### Langkah 4: Buat akun Claude API
1. Buka **console.anthropic.com**
2. Daftar/login
3. Masuk ke **Settings → API Keys**
4. Klik "Create Key" → beri nama "awardee-chat"
5. Copy API key (mulai dengan `sk-ant-...`)
6. **Isi billing**: Settings → Billing → Add payment method
7. Minimal isi $5 (~Rp80K) untuk mulai

### Langkah 5: Setup file environment
1. Masuk ke folder: `C:\Users\yusri\awardee-chat`
2. Cari file `.env.local.example`
3. Copy file itu, rename copy-nya jadi `.env.local`
4. Buka `.env.local` dengan Notepad
5. Isi semua nilai:
```
ANTHROPIC_API_KEY=sk-ant-xxx... (dari langkah 4)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co (dari langkah 2)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (dari langkah 2)
```
6. Save file

### Langkah 6: Install dan jalankan
Buka PowerShell, jalankan satu per satu:
```
cd C:\Users\yusri\awardee-chat
npm install
npm run dev
```
Tunggu sampai muncul: `▲ Next.js 14.x.x` dan `Local: http://localhost:3000`

Buka browser → **http://localhost:3000** → harusnya landing page sudah tampil!
Test daftar akun → login → chat.

---

## HARI 2 — Deploy ke Internet

### Langkah 7: Buat akun GitHub
1. Buka **github.com** → Sign up
2. Verifikasi email

### Langkah 8: Upload project ke GitHub
Buka PowerShell di folder awardee-chat:
```
git init
git add .
git commit -m "awardee chat MVP"
git branch -M main
```
Di GitHub, buat repository baru:
1. Klik tanda `+` → New repository
2. Nama: `awardee-chat`
3. **Private** (jangan Public!)
4. Klik "Create repository"
5. Copy 2 perintah yang GitHub tampilkan (remote add + push), jalankan di PowerShell

### Langkah 9: Deploy ke Vercel
1. Buka **vercel.com** → Sign up with GitHub
2. Klik "Add New Project"
3. Pilih repo `awardee-chat`
4. Sebelum deploy, klik "Environment Variables" dan isi:
   - `ANTHROPIC_API_KEY` → paste API key lo
   - `NEXT_PUBLIC_SUPABASE_URL` → paste URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → paste anon key Supabase
5. Klik **Deploy**
6. Tunggu ~2 menit → lo dapat URL seperti `awardee-chat.vercel.app`
7. Test URL tersebut di browser

### Langkah 10: Pasang domain chat.awardee.id
Di Vercel:
1. Masuk project → **Settings → Domains**
2. Ketik `chat.awardee.id` → Add
3. Vercel akan minta lo buat CNAME record

Di Hostinger:
1. Login Hostinger → cPanel → **Zone Editor** atau **DNS Manager**
2. Tambah record baru:
   - Type: `CNAME`
   - Name: `chat`
   - Value: `cname.vercel-dns.com`
3. Save
4. Tunggu **15 menit s/d 24 jam** sampai aktif

---

## HARI 3 — Setup Pembayaran & YouTube

### Langkah 11: Setup Xendit untuk pembayaran
1. Daftar di **xendit.co** (butuh KTP + NPWP untuk verifikasi)
2. Setelah verified, masuk ke **Payment Links**
3. Buat 2 payment link:
   - "Starter Awardee.id - Rp99.000/bulan"
   - "Pro Awardee.id - Rp299.000/bulan"
4. Copy kedua link tersebut
5. Buka file `app/dashboard/page.tsx`
6. Cari bagian `XENDIT_LINKS` di baris paling atas
7. Ganti URL placeholder dengan link Xendit asli lo:
```javascript
const XENDIT_LINKS = {
  starter: 'https://checkout.xendit.co/od/LINK_STARTER_LO',
  pro: 'https://checkout.xendit.co/od/LINK_PRO_LO',
}
```
8. Save, lalu push ke GitHub → Vercel auto-deploy

### Cara upgrade member setelah bayar (manual untuk MVP)
1. Member bayar via Xendit
2. Member WhatsApp lo dengan bukti pembayaran
3. Lo masuk Supabase → **Table Editor → profiles**
4. Cari email member, klik row-nya
5. Ubah `subscription_tier` dari `free` ke `starter` atau `pro`
6. Ubah `subscription_expires_at` ke tanggal 1 bulan ke depan
7. Save

### Langkah 12: Extract YouTube transcripts
1. Buka **youtube.com/@awardeeid/videos**
2. Klik video pertama lo
3. Dari URL, copy kode setelah `v=` (contoh: `v=ABC123` → copy `ABC123`)
4. Buka file `scripts/extract-youtube.mjs`
5. Tambahkan video ID di bagian `VIDEO_IDS`:
```javascript
const VIDEO_IDS = [
  'ABC123', // Tips Essay AAS
  'DEF456', // Cara Lolos Interview
  // tambahkan semua video lo di sini
]
```
6. Jalankan di PowerShell:
```
npm run extract-youtube
```
7. Tunggu proses selesai → file `knowledge/base.txt` terisi
8. Push ke GitHub → Vercel redeploy → AI lo sekarang punya knowledge dari semua video lo!

---

## Estimasi Biaya Operasional Bulanan

| Item | Biaya |
|------|-------|
| Vercel hosting | Gratis |
| Supabase database | Gratis (up to 500MB) |
| Claude API Haiku (100 sesi/bulan) | ~Rp3.000 |
| Claude API Haiku (500 sesi/bulan) | ~Rp15.000 |
| Xendit per transaksi | 2,5% + Rp2.000 |
| **Total infrastruktur** | **~Rp20K–50K/bulan** |

Artinya kalau lo punya 10 member Starter (10 × Rp99K = Rp990K), biaya infra cuma ~Rp50K. **Margin 95%+.**

---

## Troubleshooting Umum

**"Error: ANTHROPIC_API_KEY not found"**
→ Cek file `.env.local` sudah ada dan terisi dengan benar. Pastikan tidak ada spasi extra.

**"Error connecting to Supabase"**
→ Cek URL dan anon key Supabase di `.env.local`. Copy ulang dari dashboard Supabase.

**Chat tidak bisa login / register**
→ Pastikan SQL schema sudah dijalankan di Supabase SQL Editor.

**Domain chat.awardee.id belum aktif**
→ DNS butuh waktu 15 menit s/d 24 jam. Gunakan URL Vercel sementara.

---

## Kontak Bantuan
Kalau ada kendala teknis, tanya ke Claude Code (gw yang build ini 😄)
