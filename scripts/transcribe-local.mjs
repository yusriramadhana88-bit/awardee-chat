/**
 * Transkripsi video/audio lokal → tambah ke knowledge base chatbot
 *
 * Cara pakai:
 *   npm run transcribe -- "C:\path\to\video.mp4"
 *   npm run transcribe -- "C:\path\to\rekaman.m4a"
 *
 * Format yang didukung: mp4, mov, avi, mkv, mp3, m4a, wav, ogg, webm
 */

import { createReadStream, writeFileSync, readFileSync, existsSync, statSync, mkdirSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'
import { createRequire } from 'module'
import OpenAI from 'openai'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const KNOWLEDGE_FILE = join(ROOT, 'knowledge', 'base.txt')
const MAX_SIZE_MB = 24

// Baca API key langsung dari .env.local (bypass system env yang mungkin kosong)
function loadEnvKey(key) {
  try {
    const envPath = join(ROOT, '.env.local')
    if (existsSync(envPath)) {
      const lines = readFileSync(envPath, 'utf8').split('\n')
      for (const line of lines) {
        const trimmed = line.trim().replace(/\r$/, '')
        if (trimmed.startsWith(key + '=')) return trimmed.substring(key.length + 1).trim()
      }
    }
  } catch {}
  return process.env[key] ?? ''
}

async function extractAudio(inputPath) {
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
  const { default: ffmpeg } = await import('fluent-ffmpeg')
  ffmpeg.setFfmpegPath(ffmpegPath)

  const outputPath = join(tmpdir(), `awardee_audio_${Date.now()}.mp3`)
  console.log('  Mengekstrak audio dari video...')

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate('64k')
      .format('mp3')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath)
  })
}

async function transcribeChunk(openai, filePath, chunkLabel) {
  console.log(`  Mentranskrip ${chunkLabel}...`)
  const stream = createReadStream(filePath)
  stream.path = filePath.endsWith('.mp3') ? filePath : filePath + '.mp3'

  const response = await openai.audio.transcriptions.create({
    file: createReadStream(filePath),
    model: 'whisper-1',
    language: 'id',
    response_format: 'text',
  })
  return response
}

async function main() {
  const filePath = process.argv[2]

  if (!filePath) {
    console.log('\n❌ Masukkan path file video/audio.')
    console.log('\nContoh:')
    console.log('  npm run transcribe -- "C:\\Users\\yusri\\Videos\\rekaman-tips-aas.mp4"')
    console.log('  npm run transcribe -- "C:\\Users\\yusri\\Documents\\webinar.m4a"')
    process.exit(1)
  }

  if (!existsSync(filePath)) {
    console.log(`\n❌ File tidak ditemukan: ${filePath}`)
    process.exit(1)
  }

  const openaiKey = loadEnvKey('OPENAI_API_KEY')
  if (!openaiKey) {
    console.log('\n❌ OPENAI_API_KEY belum diisi di .env.local')
    console.log('\nCara dapat API key:')
    console.log('  1. Buka platform.openai.com')
    console.log('  2. Daftar/login')
    console.log('  3. Settings → API Keys → Create new secret key')
    console.log('  4. Tambahkan ke .env.local:')
    console.log('     OPENAI_API_KEY=sk-proj-...')
    process.exit(1)
  }

  const openai = new OpenAI({ apiKey: openaiKey })
  const fileName = basename(filePath)
  const ext = extname(filePath).toLowerCase()
  const isVideo = ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)

  console.log('\n🎙️  Awardee.id Video Transcriber')
  console.log('================================')
  console.log(`📁 File: ${fileName}`)

  const fileSizeMB = statSync(filePath).size / (1024 * 1024)
  console.log(`📦 Ukuran: ${fileSizeMB.toFixed(1)} MB`)

  let audioPath = filePath

  // Kalau video atau file terlalu besar → extract/compress audio dulu
  if (isVideo || fileSizeMB > MAX_SIZE_MB) {
    try {
      audioPath = await extractAudio(filePath)
      const newSize = statSync(audioPath).size / (1024 * 1024)
      console.log(`  Audio diekstrak: ${newSize.toFixed(1)} MB`)
    } catch (e) {
      console.log(`\n❌ Gagal mengekstrak audio: ${e.message}`)
      console.log('Pastikan file tidak corrupt dan format didukung.')
      process.exit(1)
    }
  }

  const finalSizeMB = statSync(audioPath).size / (1024 * 1024)

  let transcript = ''
  if (finalSizeMB <= MAX_SIZE_MB) {
    transcript = await transcribeChunk(openai, audioPath, 'audio')
  } else {
    console.log(`  File masih ${finalSizeMB.toFixed(1)}MB, perlu dipotong...`)
    // File terlalu besar — beri tahu user
    console.log('\n⚠️  File terlalu besar untuk API Whisper (maks 24MB).')
    console.log('Saran: potong video menjadi beberapa bagian (masing-masing < 30 menit)')
    console.log('atau kompres audio terlebih dahulu.')
    process.exit(1)
  }

  if (!transcript || transcript.trim().length === 0) {
    console.log('\n❌ Transkripsi kosong. Pastikan audio jelas dan ada suara.')
    process.exit(1)
  }

  // Simpan ke knowledge base
  mkdirSync(join(ROOT, 'knowledge'), { recursive: true })
  const existing = existsSync(KNOWLEDGE_FILE) ? readFileSync(KNOWLEDGE_FILE, 'utf8') : ''
  const entry = `\n\n=== VIDEO LOKAL: ${fileName} (${new Date().toLocaleDateString('id-ID')}) ===\n${transcript.trim()}\n`
  writeFileSync(KNOWLEDGE_FILE, existing + entry, 'utf8')

  console.log(`\n✅ Selesai!`)
  console.log(`📝 Transkripsi: ${transcript.length.toLocaleString()} karakter`)
  console.log(`📁 Tersimpan di: knowledge/base.txt`)
  console.log(`\n🔄 Restart server biar AI langsung pakai: Ctrl+C di jendela server → npm run dev`)
}

main().catch(e => {
  console.error('\n❌ Error:', e.message)
  process.exit(1)
})
