"""Ekstrak teks dari PDF panduan resmi AAS ke knowledge/aas-handbook.txt.
Sumber: 'AAS Guidelines/' (policy handbook 2026 + preview form Intake 2027 Master Reguler).
"""
import pypdf
import sys
import os

SRC_DIR = r"C:\Users\yusri\OneDrive - Badan Pemeriksa Keuangan RI\Claude\Awardee.id\AAS Guidelines"
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge", "aas-handbook-raw.txt")

files = [
    "aus-awards-scholarships-policy-handbook 2026.pdf",
    "Preview Form Australia Awards Intake 2027 for Master Reguler 6.2.26.pdf",
]

with open(OUT_PATH, "w", encoding="utf-8") as out:
    for fname in files:
        path = os.path.join(SRC_DIR, fname)
        reader = pypdf.PdfReader(path)
        out.write(f"\n\n===== SOURCE: {fname} ({len(reader.pages)} pages) =====\n\n")
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            out.write(f"\n--- page {i+1} ---\n")
            out.write(text)
        print(f"Extracted {fname}: {len(reader.pages)} pages", file=sys.stderr)

print(f"Done -> {OUT_PATH}", file=sys.stderr)
