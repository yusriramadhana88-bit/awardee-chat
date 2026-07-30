import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { loadEnvKey } from '@/lib/env'
import { processCommentEvent, type IgCommentWebhookValue } from '@/lib/instagram-auto-dm'

// GET: Meta's webhook verification handshake — called once when you save the Webhooks config
// in the Meta App Dashboard. Must echo back hub.challenge if hub.verify_token matches ours.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const expected = loadEnvKey('INSTAGRAM_WEBHOOK_VERIFY_TOKEN')
  if (mode === 'subscribe' && token && expected && token === expected) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = loadEnvKey('INSTAGRAM_APP_SECRET')
  if (!appSecret || !signatureHeader) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const sigBuf = Buffer.from(signatureHeader)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

// POST: actual event notifications. Must respond 200 fast — Meta retries on non-2xx/timeout.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256')

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const payload = JSON.parse(rawBody)
    const entries = Array.isArray(payload.entry) ? payload.entry : []

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : []
      for (const change of changes) {
        if (change.field !== 'comments') continue
        await processCommentEvent(change.value as IgCommentWebhookValue)
      }
    }
  } catch (error) {
    console.error('Instagram webhook processing error:', error)
    // Still 200 — Meta will retry on non-200, and a malformed one-off payload retrying won't help.
  }

  return NextResponse.json({ ok: true })
}
