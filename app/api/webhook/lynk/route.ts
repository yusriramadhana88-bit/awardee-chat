import { NextRequest, NextResponse } from 'next/server'
import { verifyLynkSignature, processLynkPayment } from '@/lib/lynk-webhook'

// POST: lynk.id payment.received webhook. Must respond fast — lynk.id retries on non-2xx.
// See LYNK_WEBHOOK_SETUP.md for how to register this URL + get the merchant key.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signatureHeader = req.headers.get('x-lynk-signature')

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const md = payload?.data?.message_data
  const refId: string | undefined = md?.refId
  const messageId: string | undefined = payload?.data?.message_id
  const grandTotal = md?.totals?.grandTotal

  if (!refId || !messageId || grandTotal === undefined || !signatureHeader) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const isValid = verifyLynkSignature(refId, String(grandTotal), messageId, signatureHeader)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (payload?.event !== 'payment.received' || payload?.data?.message_action !== 'SUCCESS') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    await processLynkPayment(payload)
  } catch (err) {
    console.error('[lynk-webhook] Gagal memproses payload:', err)
    // Tetap balas 200 — error sudah tercatat, dan lynk.id retry tidak akan mengubah hasil
    // karena message_id unik (idempotency) sudah/akan dicoba lagi lewat log yang sama.
  }

  return NextResponse.json({ ok: true })
}
