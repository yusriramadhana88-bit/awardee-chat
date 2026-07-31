# Setup Webhook lynk.id (auto-upgrade tier saat pembayaran masuk)

Fitur ini sudah dikodekan (endpoint webhook, pencocokan user, upgrade tier otomatis, email
konfirmasi). Yang belum bisa dikerjakan otomatis: bagian yang butuh login ke dashboard lynk.id
Bapak sendiri. Ikuti langkah di bawah — semuanya lewat browser Bapak sendiri.

## Cara kerja singkat

1. Customer bayar di lynk.id (produk Starter/VIP/VVIP).
2. lynk.id kirim webhook `payment.received` ke server kita, real-time.
3. Server cocokkan nomor HP (atau email kalau HP tidak ketemu) pembeli ke akun AWARDEE APP.
4. Kalau ketemu: tier langsung ter-upgrade otomatis (durasi ditambah dari sisa waktu aktif,
   bukan reset — jadi kalau masih ada sisa hari aktif, tidak hilang), lalu customer dapat
   email konfirmasi otomatis.
5. Kalau nomor HP/email tidak cocok ke akun manapun: TIDAK ada upgrade otomatis — Bapak dapat
   email alert untuk cek dan upgrade manual seperti biasa.

Nama produk di lynk.id harus mengandung kata "Starter", "VIP", atau "VVIP" (case-insensitive)
supaya sistem tahu mau upgrade ke tier apa — cek nama produk Bapak di lynk.id sudah sesuai.

## Langkah 1 — Daftarkan webhook URL di lynk.id

1. Login ke [lynk.id](https://lynk.id) sebagai penjual.
2. Buka bagian pengaturan API/Webhook di dashboard.
3. Masukkan Callback URL: `https://chat.awardee.id/api/webhook/lynk`
4. Pilih event **payment.received**, simpan.
5. Setelah tersimpan, dashboard akan menampilkan **Merchant Key** — ini yang dipakai untuk
   verifikasi signature webhook (`X-Lynk-Signature`).

## Langkah 2 — Isi Merchant Key ke `.env.local`

Merchant Key itu credential, jadi ikuti cara yang sama seperti waktu isi App Secret Instagram
kemarin — jangan ditempel ke chat Claude:

1. Buka `.env.local` (folder `awardee-chat`) di Notepad.
2. Cari baris `LYNK_MERCHANT_KEY=PASTE_MERCHANT_KEY_HERE`.
3. Select `PASTE_MERCHANT_KEY_HERE`, timpa dengan Merchant Key asli dari lynk.id (paste).
4. Save.

## Langkah 3 — Isi juga ke Vercel (production)

1. Buka Vercel → project `awardee-chat` → Settings → Environment Variables.
2. Tambah `LYNK_MERCHANT_KEY` dengan value yang sama, Production + Preview.
3. Redeploy (Deployments → "..." pada deployment terbaru → Redeploy).

## Langkah 4 — Jalankan migration database

Setelah `.env.local` terisi, jalankan (dari folder `awardee-chat`):

```bash
node scripts/run-migration.mjs 020_lynk_webhook.sql
```

## Cara testing

lynk.id tidak selalu punya mode "test webhook" di UI — cara paling aman adalah beli produk
termurah sendiri (mis. lewat akun test) dan lihat apakah tier ter-upgrade otomatis dalam
beberapa detik, atau cek tabel `lynk_webhook_log` di Supabase untuk lihat hasil pencocokan
tiap webhook yang masuk (`status`: `upgraded` / `unmatched_product` / `unmatched_user` /
`update_failed`).
