/**
 * Script untuk extract semua transkrip dari YouTube channel Awardee.id
 * Cara jalankan: npm run extract-youtube
 *
 * Butuh: Node.js sudah terinstall + npm install sudah dijalankan
 */

import { YoutubeTranscript } from 'youtube-transcript'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const KNOWLEDGE_DIR = join(ROOT, 'knowledge')
const OUTPUT_FILE = join(KNOWLEDGE_DIR, 'base.txt')

// Semua video ID dari channel @awardeeid
// Cara dapat video ID: buka youtube.com/@awardeeid/videos, klik setiap video, copy kode di URL setelah "v="
// Contoh: https://www.youtube.com/watch?v=XXXXXXXXXXX -> ID = XXXXXXXXXXX
//
// INSTRUKSI UNTUK DHANA:
// 1. Buka youtube.com/@awardeeid/videos
// 2. Klik kanan setiap video -> "Copy link"
// 3. Paste ke list di bawah dalam format: 'VIDEO_ID', // Judul video
const VIDEO_IDS = [
  // === PUBLIC VIDEOS (YouTube channel @awardeeid) ===
  'm0EcnA8ZSl8', // Free Webinar AAS 2025 with kak Fitria dan kak DenDhana
  'B-Gqmw-yDAo', // Pertanyaan Interview Beasiswa yang Sering Ditanya
  'XiEloZn1kto', // LIVE!! DIAJARIN Interview Beasiswa Luar Negeri Bareng Dua Awardee AAS
  'J8HFVzAmpbs', // GRATIS! Simulasi Interview - Webinar LULUS Tes Interview AAS 2023
  '_J7W7bErhxc', // Tips Menulis Essay - Persiapan, Referensi essay
  'bL6QzsCyJAM', // Video Profile Awardee.id
  '3Y6sbhj-pPY', // AwardeeTalks: Rahasia Sukses Interview Beasiswa Luar Negeri
  'DDLhHe1E3jc', // Pengalaman Organisasi Dalam Mendapatkan Beasiswa AAS
  'Ho5TsP01rEg', // Sukses Wawancara Beasiswa Australia Awards
  'liTzyjyY7wE', // BONGKAR Interview Beasiswa AAS
  '0ZpjHpfizo4', // Exploring Opportunities: Chevening Scholarship
  'dfVVJ9OqN1o', // Beasiswa STUNED ke Belanda
  'ujKR1bYOYtY', // Kota Favorit Student Indonesia di Belanda
  'iI00ng7UdMg', // MAU Kuliah Gratis di BELANDA - Beasiswa STUNED
  '34ZO_B2b9KU', // Mau Kuliah di Inggris GRATIS - Beasiswa Chevening

  // === UNLISTED: Private Interview & Mentoring Sessions ===
  'TbE2-w7cbzA', // Private Interview_Bryan_4th Meet
  'McIEOcVCOUo', // Private Interview_Bryan_3rd Meet
  'JMx6cTAhTnw', // Private Interview_Bryan_2nd Meet
  'wZcgcn7AylU', // Private Interview_Bryan_1st Meet
  'pEAxdaYmio4', // Private Interview_Fitri_4th Meet_cont
  'jMS-kcYQnN8', // Private Interview_Fitri_4th Meet
  'V4ybsoFVR1A', // Private Interview_Fitri_3rd Meet
  '43p9zClxHVI', // Private Interview_Fitri_2nd Meet
  'GmChB7zKnYc', // Private Interview_Khusnul Fitri_1st Meet
  'qgTHLwqofrI', // Private Mentor Essay AAS 2025_Desita
  'flOg_P2wb3U', // Khusnul Fitri_3rd Meeting Private
  'DeXPLktQhdw', // Khusnul Fitri_2nd Meeting Private
  'yStU4LmceWE', // 1st Meeting Private Khusnul AAS S3
  'mQrdS6GSSlE', // PreMentorship with DenDhana
  'EQJCcq7xTSo', // 4th Meeting Interview Indah Soraya
  'SyPxkWPOMLs', // 3rd Meeting Interview AAS Soraya Indah
  'fX2107IogVs', // 2nd Meet Interview Mentoring Soraya Indah
  'gNnueOB74-4', // 1st Interview AAS Private Soraya Indah
  'IJXVtE67ZIo', // Mentoring Azza Session 4th
  'nXskxxJml_k', // Session #3_Interview_Azza
  'yAiNff0QqXc', // Session #2_Interview Intensive Azza
  '0lcVxK_eRJE', // Session #3 Interview Class AAS Awardee.id_Hanzel
]

async function extractTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'id' })
    return transcript.map(t => t.text).join(' ')
  } catch {
    try {
      // Coba bahasa Inggris kalau Indonesia ga ada
      const transcript = await YoutubeTranscript.fetchTranscript(videoId)
      return transcript.map(t => t.text).join(' ')
    } catch (err) {
      console.log(`  Tidak bisa extract video ${videoId}: ${err.message}`)
      return null
    }
  }
}

async function main() {
  console.log('🎬 Awardee.id YouTube Knowledge Extractor')
  console.log('==========================================\n')

  if (!existsSync(KNOWLEDGE_DIR)) {
    mkdirSync(KNOWLEDGE_DIR, { recursive: true })
  }

  if (VIDEO_IDS.length === 0) {
    console.log('⚠️  Belum ada video ID yang ditambahkan!')
    console.log('\nCara tambah video ID:')
    console.log('1. Buka youtube.com/@awardeeid/videos')
    console.log('2. Klik setiap video')
    console.log('3. Copy kode dari URL (contoh: youtube.com/watch?v=KODE_INI)')
    console.log('4. Tambahkan ke array VIDEO_IDS di scripts/extract-youtube.mjs')
    console.log('\nContoh:')
    console.log("  const VIDEO_IDS = [")
    console.log("    'abc123xyz', // Tips Essay AAS")
    console.log("    'def456uvw', // Cara Lolos Interview AAS")
    console.log("  ]")
    return
  }

  console.log(`📋 Memproses ${VIDEO_IDS.length} video...\n`)

  const results = []
  for (let i = 0; i < VIDEO_IDS.length; i++) {
    const videoId = VIDEO_IDS[i]
    console.log(`[${i + 1}/${VIDEO_IDS.length}] Mengextract video ${videoId}...`)
    const text = await extractTranscript(videoId)
    if (text) {
      results.push(`=== VIDEO: ${videoId} ===\n${text}\n`)
      console.log(`  ✓ Berhasil (${text.length} karakter)`)
    }
    // Delay antar request supaya tidak di-rate limit
    if (i < VIDEO_IDS.length - 1) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  if (results.length === 0) {
    console.log('\n❌ Tidak ada transkrip yang berhasil diextract.')
    return
  }

  const content = `# Knowledge Base Awardee.id
# Diextract dari: ${results.length} video YouTube @awardeeid
# Tanggal: ${new Date().toLocaleDateString('id-ID')}
# Total karakter: ${results.join('\n').length}

${results.join('\n\n')}`

  writeFileSync(OUTPUT_FILE, content, 'utf-8')

  console.log(`\n✅ Selesai! ${results.length}/${VIDEO_IDS.length} video berhasil diextract`)
  console.log(`📁 Tersimpan di: knowledge/base.txt`)
  console.log(`📊 Total: ${content.length.toLocaleString()} karakter`)
  console.log('\n🔄 Sekarang restart server (Ctrl+C lalu npm run dev) agar AI menggunakan knowledge baru.')
}

main().catch(console.error)
