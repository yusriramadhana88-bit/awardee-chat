// Server-only: loader .txt dari folder knowledge/, dengan cache in-process. Dipakai lib/prompts.ts
// (Den Dhana) dan lib/lpdp-ai.ts (LPDP Center) — dipisah ke modul sendiri supaya keduanya bisa import tanpa circular dependency.
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const knowledgeCache = new Map<string, string>()

export function loadKnowledge(filename: string, maxChars: number): string {
  const cacheKey = `${filename}:${maxChars}`
  const cached = knowledgeCache.get(cacheKey)
  if (cached !== undefined) return cached
  let content = ''
  try {
    const knowledgePath = join(process.cwd(), 'knowledge', filename)
    if (existsSync(knowledgePath)) {
      content = readFileSync(knowledgePath, 'utf-8').slice(0, maxChars)
    }
  } catch {}
  knowledgeCache.set(cacheKey, content)
  return content
}
