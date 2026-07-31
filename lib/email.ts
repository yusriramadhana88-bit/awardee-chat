import { Resend } from 'resend'
import { loadEnvKey } from './env'
import { LeadMagnet, readLeadMagnetAttachment } from './lead-magnets'
import { TIER_LABEL } from './tier'

// Kirim email transaksional via Resend (resend.com — 3000 email/bulan gratis).
// WAJIB isi RESEND_API_KEY di .env.local (lihat .env.local.example) dan verifikasi domain
// pengirim di dashboard Resend sebelum ini bisa benar-benar mengirim di production.
// Kalau RESEND_API_KEY kosong, sendLeadMagnetEmail() diam-diam skip (tidak menggagalkan
// registrasi user) — hanya log warning di server.
const EMAIL_FROM = 'AWARDEE APP <hello@mail.awardee.id>'

function getResend(): Resend | null {
  const apiKey = loadEnvKey('RESEND_API_KEY')
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function sendLeadMagnetEmail(to: string, name: string, leadMagnet: LeadMagnet): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY belum diisi — lead magnet tidak dikirim ke', to)
    return
  }

  const downloadSection = leadMagnet.fileUrl
    ? `<a href="${leadMagnet.fileUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Download Sekarang</a>`
    : `<p style="color:#475569;">File-nya kami lampirkan langsung di email ini 📎</p>`

  const attachmentBuffer = leadMagnet.attachmentPath ? readLeadMagnetAttachment(leadMagnet) : null

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `🎁 ${leadMagnet.title} — buat kamu, ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f172a;">Selamat datang di AWARDEE APP, ${name}! 👋</h2>
          <p style="color:#475569;line-height:1.6;">
            Makasih sudah daftar. Sebagai bonus, ini <strong>${leadMagnet.title}</strong> — gratis, langsung buat kamu:
          </p>
          <p style="color:#475569;line-height:1.6;">${leadMagnet.description}</p>
          <div style="margin:24px 0;">${downloadSection}</div>
          <p style="color:#94a3b8;font-size:13px;">
            Lanjutkan di <a href="https://member.awardee.id/dashboard" style="color:#94a3b8;">member.awardee.id</a> untuk mulai Review Esai, Cek Dokumen, dan fitur lainnya.
          </p>
        </div>
      `,
      attachments: attachmentBuffer
        ? [{ filename: leadMagnet.attachmentFilename || 'lead-magnet.pdf', content: attachmentBuffer }]
        : undefined,
    })
  } catch (err) {
    console.error('[email] Gagal mengirim lead magnet ke', to, err)
  }
}

// Dipakai lib/lynk-webhook.ts — dua jenis notifikasi terkait webhook pembayaran lynk.id:
// konfirmasi ke user yang tier-nya berhasil ter-upgrade otomatis, atau alert ke admin kalau
// pembayaran masuk tapi tidak bisa dicocokkan ke akun manapun (butuh upgrade manual).
type TierUpgradeEmailParams =
  | { kind: 'user_upgraded'; to: string; tier: 'starter' | 'vip' | 'vvip'; expiresAt: string; name?: string }
  | { kind: 'admin_unmatched'; to: string; reason: string; log: Record<string, unknown> }

export async function sendTierUpgradeEmail(params: TierUpgradeEmailParams): Promise<void> {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY belum diisi — notifikasi tier-upgrade tidak dikirim ke', params.to)
    return
  }

  try {
    if (params.kind === 'user_upgraded') {
      const expiryLabel = new Date(params.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      await resend.emails.send({
        from: EMAIL_FROM,
        to: params.to,
        subject: `Akun kamu sudah aktif ${TIER_LABEL[params.tier]} 🎉`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#0f172a;">Makasih${params.name ? ', ' + params.name : ''}! 🎉</h2>
            <p style="color:#475569;line-height:1.6;">
              Pembayaranmu sudah kami terima dan akun AWARDEE APP kamu otomatis ter-upgrade ke <strong>${TIER_LABEL[params.tier]}</strong>, aktif sampai <strong>${expiryLabel}</strong>.
            </p>
            <div style="margin:24px 0;">
              <a href="https://member.awardee.id/dashboard" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;">Buka AWARDEE APP</a>
            </div>
          </div>
        `,
      })
    } else {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: params.to,
        subject: `⚠️ Pembayaran lynk.id belum bisa dicocokkan otomatis`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <h2 style="color:#b45309;">Perlu dicek manual</h2>
            <p style="color:#475569;line-height:1.6;">${params.reason}</p>
            <pre style="background:#f1f5f9;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;">${JSON.stringify(params.log, null, 2)}</pre>
          </div>
        `,
      })
    }
  } catch (err) {
    console.error('[email] Gagal mengirim notifikasi tier-upgrade ke', params.to, err)
  }
}
