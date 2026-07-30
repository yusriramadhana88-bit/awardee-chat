# Setup Instagram Auto-Reply + Auto-DM ("ManyChat-style")

Fitur ini sudah dikodekan (webhook receiver, admin panel untuk atur rule). Yang belum bisa
dikerjakan otomatis: bagian yang butuh login Facebook/Meta Business kamu sendiri. Ikuti
langkah di bawah — semuanya dilakukan lewat browser kamu sendiri, bukan lewat Claude.

## Prasyarat

- Instagram @awardee.id harus **Professional/Business account** yang **terhubung ke Facebook Page**
  (sudah pasti terpenuhi karena Meta Ads sudah jalan di akun ini).

## Langkah 1 — Buat Meta App

1. Buka [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create App**.
2. Pilih tipe **Business**.
3. Nama app bebas, misal "Awardee.id Auto DM".
4. Setelah app dibuat, di dashboard app, tambahkan produk **Webhooks** dan **Messenger**
   (atau **Instagram** tergantung versi UI Meta saat kamu setup — cari produk yang menyebut
   "Instagram Graph API" / "Instagram messaging").

## Langkah 2 — Hubungkan Page & Instagram Account

1. Di app dashboard → Messenger/Instagram settings → **Generate Token** untuk Page yang
   terhubung ke @awardee.id.
2. Ambil token itu → ini nilai `INSTAGRAM_PAGE_ACCESS_TOKEN`.
3. Catat juga **Page ID** (`INSTAGRAM_PAGE_ID`) dan **Instagram Business Account ID**
   (`INSTAGRAM_BUSINESS_ACCOUNT_ID`) — biasanya tampil di halaman yang sama.

## Langkah 3 — Minta Permission

Di App Review → Permissions, request:
- `instagram_manage_comments`
- `pages_messaging`
- `instagram_basic`
- `pages_show_list`

Untuk testing awal, App masih di **Development Mode** — permission-permission ini otomatis
bisa dipakai untuk akun yang punya role di App itu (Admin/Developer/Tester), termasuk akun
Instagram kamu sendiri, TANPA perlu App Review dulu. **App Review baru wajib kalau nanti
fitur ini dipakai untuk akun Instagram *lain* di luar App roles** — untuk 1 akun bisnis milik
sendiri, kemungkinan besar development mode saja sudah cukup untuk mulai testing.

## Langkah 4 — Set Environment Variables

Tambahkan ke `.env.local` (lokal) dan Vercel Environment Variables (production):

```
INSTAGRAM_PAGE_ACCESS_TOKEN=<dari langkah 2>
INSTAGRAM_PAGE_ID=<dari langkah 2>
INSTAGRAM_BUSINESS_ACCOUNT_ID=<dari langkah 2>
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<bikin sendiri, string acak apa saja, misal dari `openssl rand -hex 16`>
INSTAGRAM_APP_SECRET=<dari App Dashboard -> App Settings -> Basic -> App Secret>
```

Setelah diisi di Vercel, **redeploy** supaya env var baru terbaca.

## Langkah 5 — Daftarkan Webhook URL di Meta App Dashboard

1. App Dashboard → Webhooks → **Add Callback URL**.
2. Callback URL: `https://chat.awardee.id/api/instagram/webhook`
3. Verify Token: isi persis sama dengan `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` yang kamu set di langkah 4.
4. Klik **Verify and Save** — Meta akan langsung memanggil URL itu untuk verifikasi; kalau
   gagal, cek lagi env var sudah ke-deploy dengan benar.
5. Setelah verified, subscribe ke field **`comments`** untuk object **Instagram**.

## Langkah 6 — Atur Rule di Admin Panel

Buka `https://chat.awardee.id/admin/auto-dm` (perlu akun admin). Isi:
- **Kata Kunci Trigger**: misal `MAU`
- **Balasan Publik**: teks yang muncul di bawah comment orang, contoh: "Udah aku DM ya, cek inbox kamu 📩"
- **Isi DM Privat**: pesan + link yang dikirim ke inbox mereka, contoh: "Halo! Ini link aplikasi gratis buat cek esai beasiswamu: chat.awardee.id"

## Batasan penting dari Meta (bukan dari kode kita)

- **Private Reply hanya bisa dikirim 1x per comment**, dan **maksimal dalam 7 hari** setelah
  comment itu dibuat. Kalau ada yang comment ulang di comment yang sama, DM tidak akan
  terkirim ulang.
- Setelah DM pertama terkirim, percakapan lanjutan (kalau mereka balas) baru masuk aturan
  jendela 24 jam standar Instagram messaging.
- Kalau nanti mau pakai fitur ini untuk akun Instagram lain (bukan @awardee.id sendiri) atau
  akses publik yang lebih luas, App Review resmi dari Meta wajib diajukan — ini proses
  terpisah (form + video demo) yang bisa makan waktu beberapa hari sampai minggu.

## Cara testing

1. Post/reel apa saja di @awardee.id, minta orang (atau kamu sendiri dari akun lain) comment
   kata kunci trigger-nya.
2. Cek `https://chat.awardee.id/admin/auto-dm` — bagian "10 Log Terakhir" akan menunjukkan
   apakah reply/DM berhasil terkirim atau error apa yang terjadi.
