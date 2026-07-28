# Awardee.id Telegram Bot

Bot resmi (transparan sebagai bot, tidak menyamar jadi manusia) yang:
1. Mengirim lead magnet PDF ke orang yang opt-in lewat landing page `/lp/aas-interview`.
2. Bisa broadcast update lanjutan — **hanya** ke orang yang sudah pernah menekan Start
   sendiri di bot ini (Telegram tidak mengizinkan bot mengirim pesan pertama ke siapa pun).

## Cara kerja alurnya

1. User isi nama di `https://awardee.id/lp/aas-interview` → tersimpan sebagai row baru di
   tabel `leads` (Supabase), status `pending`.
2. Landing page menampilkan tombol deep link: `https://t.me/<bot_username>?start=<leadId>`.
3. User klik tombol itu sendiri → Telegram terbuka → user tekan **Start** sendiri.
4. Bot menerima `/start <leadId>`, mencocokkan ke tabel `leads`, mengisi `telegram_chat_id`,
   lalu mengirim PDF.
5. Untuk follow-up di kemudian hari, jalankan `npm run broadcast -- pesan.txt --send` — ini
   hanya mengirim ke chat_id yang sudah ada di tabel (yaitu yang sudah opt-in & start sendiri).

## Setup

### 1. Buat bot di BotFather
1. Chat `@BotFather` di Telegram.
2. `/newbot` → ikuti instruksi (nama tampilan + username, harus diakhiri `bot`, misal `AwardeeIdBot`).
3. BotFather kasih token seperti `123456789:ABCDefGhIJKlmNoPQRsTUVwxyZ`.
4. (Opsional tapi disarankan) `/setdescription` dan `/setabouttext` di BotFather — isi dengan jelas
   bahwa ini bot otomatis resmi Awardee.id, biar user paham dari awal ini bukan akun pribadi.

### 2. Isi environment variables
```
cp .env.example .env
```
Isi `TELEGRAM_BOT_TOKEN` dari BotFather, dan `NEXT_PUBLIC_SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY` — **sama persis** dengan yang ada di `awardee-chat/.env.local`,
karena bot ini baca/tulis tabel `leads` yang sama dengan landing page Next.js.

### 3. Jalankan migration Supabase
Pastikan `supabase/migrations/004_leads_aas_interview.sql` (di root project `awardee-chat/`)
sudah dijalankan di Supabase SQL Editor sebelum bot pertama kali dijalankan.

### 4. Set username bot di landing page
Isi `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` di `awardee-chat/.env.local` dengan username bot
(tanpa `@`) dari langkah 1, lalu redeploy landing page.

### 5. Install & jalankan
```
npm install
npm start
```
Ini menjalankan bot dengan long polling — jalan selama proses Node-nya hidup. Untuk produksi,
proses ini perlu di-host supaya jalan terus 24/7 (lihat opsi hosting di bawah).

## Hosting untuk produksi

Long polling perlu proses Node yang hidup terus-menerus — tidak bisa di Vercel (serverless,
mati setelah request selesai). Opsi yang cocok untuk skala kecil:
- **Railway** atau **Render** (free/hobby tier, deploy dari folder ini, set env vars, `npm start`)
- VPS kecil (mis. yang sudah dipakai untuk servis lain) + `pm2 start bot.mjs`

## Broadcast follow-up

```
node broadcast.mjs pesan.txt                          # dry run — preview + jumlah penerima, TIDAK mengirim
node broadcast.mjs pesan.txt --send                    # kirim beneran ke semua opt-in
node broadcast.mjs pesan.txt --send --source=aas-interview   # kirim hanya ke opt-in campaign tertentu
```

Selalu jalankan dry run dulu (tanpa `--send`) untuk cek preview pesan dan jumlah penerima sebelum
benar-benar mengirim.
