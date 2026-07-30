// Server-only: Instagram "ManyChat-style" auto-reply + auto-DM.
// Flow: comment matches a trigger keyword -> public reply on the comment (instagram_manage_comments)
//   + private DM via Instagram's Private Replies API (pages_messaging), which is specifically designed
//   to let a business message someone who just commented, bypassing the normal 24h window rule.
// Docs verified 2026-07-30: developers.facebook.com/docs/messenger-platform/instagram/features/private-replies
//   and developers.facebook.com/docs/instagram-platform/instagram-graph-api/comment-moderation
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from './env'

const GRAPH_API_VERSION = 'v25.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export type AutoDmRule = {
  id: string
  trigger_keyword: string
  reply_message: string
  dm_message: string
  active: boolean
}

export type IgCommentWebhookValue = {
  id: string
  text?: string
  from?: { id: string; username?: string }
  media?: { id: string }
  parent_id?: string
}

function getPageAccessToken(): string {
  return loadEnvKey('INSTAGRAM_PAGE_ACCESS_TOKEN')
}

function getPageId(): string {
  return loadEnvKey('INSTAGRAM_PAGE_ID')
}

export function getAdminSupabaseForAutoDm() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

// Reply publicly under the comment — POST /{ig-comment-id}/replies
export async function replyToComment(commentId: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const token = getPageAccessToken()
  const res = await fetch(`${GRAPH_BASE}/${commentId}/replies?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: `replies ${res.status}: ${body}` }
  }
  return { ok: true }
}

// Private reply DM to the commenter — POST /{page-id}/messages with recipient.comment_id.
// This is Meta's dedicated "Private Replies" mechanism, not a regular DM send — it works even
// though the commenter has never messaged the Page before, but only within 7 days of the comment
// and only once per comment.
export async function sendPrivateReply(commentId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const token = getPageAccessToken()
  const pageId = getPageId()
  const res = await fetch(`${GRAPH_BASE}/${pageId}/messages?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text },
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    return { ok: false, error: `messages ${res.status}: ${body}` }
  }
  return { ok: true }
}

export async function findMatchingRule(rules: AutoDmRule[], commentText: string): Promise<AutoDmRule | null> {
  const lower = commentText.toLowerCase()
  for (const rule of rules) {
    if (!rule.active) continue
    if (lower.includes(rule.trigger_keyword.toLowerCase())) return rule
  }
  return null
}

// Handle one 'comments' webhook value: match rule, reply + DM, log outcome (idempotent on ig_comment_id).
export async function processCommentEvent(value: IgCommentWebhookValue): Promise<void> {
  // Skip replies-to-replies (only react to top-level comments on the post itself) and comments
  // with no text (e.g. sticker-only comments).
  if (value.parent_id || !value.text || !value.id) return

  const ownIgUserId = loadEnvKey('INSTAGRAM_BUSINESS_ACCOUNT_ID')
  if (ownIgUserId && value.from?.id === ownIgUserId) return // never react to our own reply

  const admin = getAdminSupabaseForAutoDm()

  const { data: existing } = await admin.from('auto_dm_log').select('id').eq('ig_comment_id', value.id).maybeSingle()
  if (existing) return // already processed (webhook retry)

  const { data: rules } = await admin.from('auto_dm_rules').select('*').eq('active', true)
  const rule = await findMatchingRule((rules ?? []) as AutoDmRule[], value.text)
  if (!rule) return

  const replyResult = await replyToComment(value.id, rule.reply_message)
  const dmResult = await sendPrivateReply(value.id, rule.dm_message)

  await admin.from('auto_dm_log').insert({
    ig_comment_id: value.id,
    rule_id: rule.id,
    commenter_username: value.from?.username ?? null,
    reply_ok: replyResult.ok,
    dm_ok: dmResult.ok,
    error: [replyResult.error, dmResult.error].filter(Boolean).join(' | ') || null,
  })
}
