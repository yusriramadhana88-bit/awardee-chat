import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export function loadEnvKey(key: string): string {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    if (existsSync(envPath)) {
      const lines = readFileSync(envPath, 'utf8').split('\n')
      for (const line of lines) {
        const trimmed = line.trim().replace(/\r$/, '')
        if (trimmed.startsWith(key + '=')) {
          return trimmed.substring(key.length + 1).trim()
        }
      }
    }
  } catch {}
  return process.env[key] ?? ''
}
