import Anthropic from '@anthropic-ai/sdk'
import { loadEnvKey } from '@/lib/env'

export const HAIKU_MODEL = 'claude-haiku-4-5-20251001'  // chat umum — cost control
export const SONNET_MODEL = 'claude-sonnet-4-6'          // fitur premium — CV, essay, GALI DIRI, simulasi

let _client: Anthropic | null = null
export function getAnthropic(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: loadEnvKey('ANTHROPIC_API_KEY') })
  return _client
}
