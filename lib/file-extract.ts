// Server-only: ekstraksi teks dari file upload umum (bukan spesifik LPDP) — dipakai CV Analyzer.
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

export async function extractDocxText(buf: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: buf })
  return result.value.trim()
}

export async function extractPdfText(buf: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buf })
  try {
    const result = await parser.getText()
    return result.text.trim()
  } finally {
    await parser.destroy()
  }
}
