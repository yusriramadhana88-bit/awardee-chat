#!/usr/bin/env python3
"""
Mentari UNPAM Automation Bot
Otomatis mengerjakan: Pretest -> Forum Diskusi (2x) -> Posttest -> Kuesioner

Cara pakai:
  python mentari_bot.py "Hukum Pajak" 9
  python mentari_bot.py "Hukum Kepailitan" 9
  python mentari_bot.py  (akan minta input)
"""

import asyncio
import sys
import re
import os
import time
from difflib import SequenceMatcher
from playwright.async_api import async_playwright, Page, TimeoutError as PlaywrightTimeout

# ===================== KONFIGURASI =====================
USERNAME  = "231010200816"
PASSWORD  = "070588"
BASE_URL  = "https://mentari.unpam.ac.id"
HEADLESS  = False   # True = tanpa browser (background), False = tampilkan browser
SLOW_MO   = 600     # Delay antar aksi (ms), naikkan jika koneksi lambat

# Anthropic API key (opsional, untuk jawab quiz & forum pakai AI)
# Isi ANTHROPIC_API_KEY di environment variable, atau biarkan kosong
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
# =======================================================


# ---- Setup AI (opsional) ----
HAS_AI = False
ai_client = None
if ANTHROPIC_API_KEY:
    try:
        import anthropic
        ai_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        HAS_AI = True
        print("[AI] Claude AI aktif — jawaban quiz & forum menggunakan AI")
    except ImportError:
        print("[AI] anthropic SDK tidak terinstall. Jalankan: pip install anthropic")
else:
    print("[AI] ANTHROPIC_API_KEY tidak diset — jawaban quiz: pilihan pertama, forum: template")


# ============================================================
#  HELPER FUNCTIONS
# ============================================================

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


async def safe_click(page: Page, selector: str, timeout: int = 5000):
    """Klik elemen, abaikan jika tidak ditemukan."""
    try:
        loc = page.locator(selector).first
        await loc.wait_for(state="visible", timeout=timeout)
        await loc.click()
        return True
    except Exception:
        return False


async def fill_editor(page: Page, text: str):
    """Isi teks ke editor Moodle (TinyMCE iframe, Atto contenteditable, atau textarea)."""
    # 1. Coba TinyMCE iframe
    try:
        frames = page.frames
        for frame in frames:
            if "editor" in (frame.name or "").lower() or frame.url == "about:blank":
                body = frame.locator("body")
                if await body.count() > 0:
                    await body.click()
                    await body.fill(text)
                    return
    except Exception:
        pass

    # 2. Coba contenteditable div (Atto)
    try:
        ce = page.locator('div.editor_atto_content[contenteditable="true"]').first
        if await ce.count() > 0:
            await ce.click()
            await ce.fill(text)
            return
    except Exception:
        pass

    # 3. Fallback: textarea
    try:
        ta = page.locator("textarea").first
        if await ta.count() > 0:
            await ta.fill(text)
            return
    except Exception:
        pass

    # 4. Last resort: keyboard
    await page.keyboard.type(text, delay=30)


# ============================================================
#  AI FUNCTIONS
# ============================================================

def ai_answer_quiz(question: str, options: list[str]) -> int:
    """Gunakan Claude untuk memilih jawaban terbaik. Return index (0-based)."""
    if not HAS_AI or not options:
        return 0

    numbered = "\n".join(f"{i+1}. {opt}" for i, opt in enumerate(options))
    prompt = (
        f"Kamu adalah ahli hukum Indonesia. Pilih jawaban PALING TEPAT untuk soal berikut.\n\n"
        f"Soal: {question}\n\nPilihan:\n{numbered}\n\n"
        f"Jawab HANYA dengan angka (1, 2, 3, atau 4). Tidak ada teks lain."
    )
    try:
        msg = ai_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=5,
            messages=[{"role": "user", "content": prompt}]
        )
        idx = int(re.search(r"\d", msg.content[0].text).group()) - 1
        return max(0, min(idx, len(options) - 1))
    except Exception:
        return 0


def ai_forum_answers(mata_kuliah: str, pertemuan: int, topic: str) -> list[str]:
    """Buat 2 jawaban forum diskusi dengan Claude."""
    if not HAS_AI:
        return _template_forum(mata_kuliah, pertemuan, topic)

    try:
        msg1 = ai_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            messages=[{
                "role": "user",
                "content": (
                    f"Kamu mahasiswa hukum semester akhir. Tulis jawaban diskusi untuk forum kuliah "
                    f"'{mata_kuliah}' Pertemuan {pertemuan}.\n"
                    f"Topik/pertanyaan: {topic}\n\n"
                    f"Tulis 3 paragraf dalam Bahasa Indonesia yang baik dan akademis. "
                    f"Sertakan dasar hukum atau pasal yang relevan jika memungkinkan."
                )
            }]
        )
        answer1 = msg1.content[0].text.strip()

        msg2 = ai_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": (
                    f"Berikan jawaban lanjutan/pengembangan dari diskusi '{mata_kuliah}' "
                    f"Pertemuan {pertemuan} tentang: {topic}\n\n"
                    f"Jawaban pertama sudah membahas: {answer1[:300]}...\n\n"
                    f"Tambahkan perspektif baru, contoh kasus, atau analisis lebih dalam "
                    f"dalam 2-3 paragraf. Bahasa Indonesia formal."
                )
            }]
        )
        answer2 = msg2.content[0].text.strip()
        return [answer1, answer2]

    except Exception as e:
        print(f"   [AI] Error saat generate forum: {e}, pakai template")
        return _template_forum(mata_kuliah, pertemuan, topic)


def _template_forum(mk: str, pt: int, topic: str) -> list[str]:
    return [
        (
            f"Dalam mata kuliah {mk} Pertemuan {pt}, topik '{topic}' merupakan hal yang sangat "
            f"fundamental dalam sistem hukum Indonesia. Berdasarkan pemahaman saya, materi ini "
            f"berkaitan erat dengan regulasi yang berlaku dan praktik hukum di lapangan. "
            f"Pemahaman yang komprehensif sangat diperlukan agar kita dapat menerapkannya "
            f"secara tepat dan sesuai dengan asas-asas hukum yang berlaku.\n\n"
            f"Lebih lanjut, kajian terhadap {topic} juga perlu mempertimbangkan aspek "
            f"penegakan hukum dan perlindungan hak-hak pihak yang terlibat. "
            f"Hal ini menjadi penting mengingat dinamika perkembangan hukum di Indonesia "
            f"yang terus berkembang seiring perubahan sosial dan ekonomi masyarakat."
        ),
        (
            f"Menambahkan diskusi sebelumnya terkait {topic} dalam {mk}, saya ingin "
            f"menekankan pentingnya aspek praktis dan implementasi dari materi Pertemuan {pt} ini. "
            f"Dalam praktik hukum, sering ditemui berbagai tantangan yang memerlukan "
            f"pemahaman mendalam tentang prosedur dan ketentuan yang berlaku.\n\n"
            f"Oleh karena itu, sebagai calon praktisi hukum, kita perlu memahami tidak hanya "
            f"norma-norma hukum secara teoritis, tetapi juga bagaimana menerapkannya dalam "
            f"kasus-kasus nyata. Dengan demikian, diskusi seperti ini sangat bermanfaat untuk "
            f"memperluas wawasan dan memperdalam pemahaman kita tentang {mk}."
        )
    ]


# ============================================================
#  AUTOMATION STEPS
# ============================================================

async def login(page: Page):
    print("\n[1/6] Login ke Mentari UNPAM...")
    await page.goto(BASE_URL, wait_until="networkidle", timeout=30000)

    await page.fill('input[name="username"]', USERNAME)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"], input[type="submit"]')
    await page.wait_for_load_state("networkidle", timeout=30000)

    if "login" in page.url.lower() and "logout" not in page.url.lower():
        # Coba cek apakah sudah masuk dengan melihat elemen dashboard
        dashboard = await page.query_selector('.usermenu, #user-menu, .navbar-nav')
        if not dashboard:
            raise RuntimeError("Login GAGAL! Periksa username/password.")

    print("   ✓ Login berhasil")


async def find_course_url(page: Page, mata_kuliah: str) -> str:
    """Cari URL mata kuliah dari halaman dashboard."""
    print(f"\n[2/6] Mencari mata kuliah '{mata_kuliah}'...")
    await page.goto(f"{BASE_URL}/u-home", wait_until="networkidle", timeout=30000)

    # Kumpulkan semua link yang mengandung /u-courses/
    links = await page.query_selector_all("a[href*='/u-courses/']")
    best_url, best_score = None, 0.0

    for link in links:
        text = (await link.inner_text()).strip()
        href = await link.get_attribute("href") or ""
        score = similarity(mata_kuliah, text)
        if score > best_score:
            best_score = score
            best_url = href if href.startswith("http") else BASE_URL + href

    if not best_url:
        # Fallback: cari di seluruh halaman
        all_links = await page.query_selector_all("a")
        for link in all_links:
            text = (await link.inner_text()).strip()
            href = await link.get_attribute("href") or ""
            if "/u-courses/" in href or "/course/view" in href:
                score = similarity(mata_kuliah, text)
                if score > best_score:
                    best_score = score
                    best_url = href if href.startswith("http") else BASE_URL + href

    if not best_url:
        raise RuntimeError(
            f"Mata kuliah '{mata_kuliah}' tidak ditemukan di dashboard. "
            "Pastikan nama sudah benar."
        )

    print(f"   ✓ Ditemukan (kecocokan: {best_score:.0%}) → {best_url}")
    return best_url


async def navigate_to_pertemuan(page: Page, course_url: str, pertemuan: int):
    """Buka halaman course lalu klik menu Pertemuan N."""
    print(f"\n[3/6] Membuka Pertemuan {pertemuan}...")
    await page.goto(course_url, wait_until="networkidle", timeout=30000)

    # Pola teks yang mungkin muncul di menu kiri
    patterns = [
        f"Pertemuan {pertemuan}",
        f"PT {pertemuan}",
        f"PT. {pertemuan}",
        f"Pertemuan ke-{pertemuan}",
        f"Pertemuan Ke {pertemuan}",
        f"Week {pertemuan}",
        f"Topik {pertemuan}",
    ]

    clicked = False
    for pattern in patterns:
        try:
            loc = page.locator(f"text={pattern}").first
            if await loc.count() > 0 and await loc.is_visible():
                await loc.click()
                await page.wait_for_load_state("networkidle")
                clicked = True
                print(f"   ✓ Klik '{pattern}'")
                break
        except Exception:
            continue

    if not clicked:
        print(f"   ⚠ Menu pertemuan tidak ditemukan secara eksplisit, lanjutkan dari halaman course")

    await asyncio.sleep(1)


async def complete_quiz(page: Page, quiz_type: str = "pretest") -> bool:
    """Kerjakan quiz Moodle (pretest atau posttest)."""
    step_num = "4" if quiz_type == "pretest" else "6"
    print(f"\n[{step_num}/6] Mengerjakan {quiz_type.upper()}...")

    # Klik link/button Quiz
    quiz_clicked = (
        await safe_click(page, "text=Quiz") or
        await safe_click(page, "text=QUIZ") or
        await safe_click(page, "[href*='quiz']")
    )
    if quiz_clicked:
        await page.wait_for_load_state("networkidle")

    # Klik "Kerjakan Quiz"
    kerjakan = (
        await safe_click(page, "text=Kerjakan Quiz") or
        await safe_click(page, "text=Attempt quiz") or
        await safe_click(page, "text=Re-attempt quiz")
    )
    if kerjakan:
        await page.wait_for_load_state("networkidle")

    # Klik "Mulai Quiz"
    await safe_click(page, "text=Mulai Quiz") or await safe_click(page, "text=Start attempt")
    await page.wait_for_load_state("networkidle")

    answered = 0
    page_num = 0
    max_pages = 50  # batas keamanan

    while page_num < max_pages:
        page_num += 1
        await asyncio.sleep(0.5)

        # --- Ambil semua soal di halaman ini ---
        # Moodle wraps each question in .que
        questions = await page.query_selector_all(".que")

        if not questions:
            # Mungkin sudah di halaman summary / selesai
            break

        for q_el in questions:
            # Teks soal
            qtext_el = await q_el.query_selector(".qtext, .formulation .qtext, .content .qtext")
            qtext = (await qtext_el.inner_text()).strip() if qtext_el else ""

            # Pilihan jawaban
            radios = await q_el.query_selector_all("input[type='radio']")
            if not radios:
                continue  # bukan soal pilihan ganda

            labels = []
            for r in radios:
                rid = await r.get_attribute("id") or ""
                lbl = await page.query_selector(f"label[for='{rid}']")
                labels.append((await lbl.inner_text()).strip() if lbl else "")

            # Pilih jawaban
            idx = ai_answer_quiz(qtext, labels)
            try:
                await radios[idx].click()
                answered += 1
            except Exception:
                pass

        # --- Navigasi: Next atau Submit ---
        # Coba Next dulu
        went_next = (
            await safe_click(page, "input[name='next']") or
            await safe_click(page, "text=Selanjutnya") or
            await safe_click(page, "text=Next page")
        )
        if went_next:
            await page.wait_for_load_state("networkidle")
            continue

        # Tidak ada Next → coba Submit / Finish attempt
        submitted = (
            await safe_click(page, "text=Finish attempt") or
            await safe_click(page, "text=Submit all and finish") or
            await safe_click(page, "input[type='submit']")
        )
        if submitted:
            await page.wait_for_load_state("networkidle")
            # Konfirmasi dialog jika muncul
            await safe_click(page, "text=Submit all and finish")
            await safe_click(page, "button:text('Submit all and finish')")
            await page.wait_for_load_state("networkidle")
            break
        else:
            break

    print(f"   ✓ {quiz_type.upper()} selesai ({answered} soal dijawab)")
    return True


async def complete_forum(page: Page, mata_kuliah: str, pertemuan: int):
    """Isi forum diskusi minimal 2 kali."""
    print("\n[5/6] Mengisi Forum Diskusi...")

    # Klik menu 'Forum Diskusi' di sidebar/kiri
    forum_nav = (
        await safe_click(page, "text=Forum Diskusi") or
        await safe_click(page, "text=Forum diskusi") or
        await safe_click(page, "text=Discussion") or
        await safe_click(page, "[href*='forum']")
    )
    if forum_nav:
        await page.wait_for_load_state("networkidle")

    # Klik tombol Forum (jika ada)
    await safe_click(page, "button:text('Forum')") or await safe_click(page, "a:text('Forum')")
    await page.wait_for_load_state("networkidle")

    # Ambil topik pertama yang tersedia
    topic_el = await page.query_selector(
        "a.topic-title, td.topic a, .discussion-name a, "
        ".forumheaderlist td.topic a, table.forumheaderlist a"
    )
    topic_text = (await topic_el.inner_text()).strip() if topic_el else f"Pertemuan {pertemuan}"
    if topic_el:
        await topic_el.click()
        await page.wait_for_load_state("networkidle")

    print(f"   Topik: {topic_text[:80]}")

    # Generate 2 jawaban
    answers = ai_forum_answers(mata_kuliah, pertemuan, topic_text)

    for i, answer in enumerate(answers[:2], 1):
        print(f"   Posting jawaban {i}/2...")

        # Klik Reply
        replied = (
            await safe_click(page, "text=Reply") or
            await safe_click(page, "text=Balas") or
            await safe_click(page, "a[id*='reply']")
        )
        if not replied:
            print(f"   ⚠ Tombol Reply tidak ditemukan untuk jawaban {i}")
            continue

        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1)

        # Isi jawaban di editor
        await fill_editor(page, answer)
        await asyncio.sleep(0.5)

        # Submit
        submitted = (
            await safe_click(page, "text=Post to forum") or
            await safe_click(page, "text=Kirim ke forum") or
            await safe_click(page, "input[type='submit'][value*='Post']") or
            await safe_click(page, "button[type='submit']")
        )
        if submitted:
            await page.wait_for_load_state("networkidle")
            print(f"   ✓ Jawaban {i} terposting")
        else:
            print(f"   ⚠ Gagal submit jawaban {i}")

        await asyncio.sleep(2)

    print("   ✓ Forum diskusi selesai")


async def complete_kuesioner(page: Page):
    """Isi kuesioner — pilih jawaban A (pilihan pertama) untuk semua pertanyaan."""
    print("\n[6/6] Mengisi Kuesioner...")

    # Navigasi ke kuesioner
    found = (
        await safe_click(page, "text=Kuesioner") or
        await safe_click(page, "text=Questionnaire") or
        await safe_click(page, "text=Survey") or
        await safe_click(page, "[href*='feedback']") or
        await safe_click(page, "[href*='questionnaire']")
    )
    if found:
        await page.wait_for_load_state("networkidle")

    # Klik "Jawab Pertanyaan" / "Answer the questions" jika ada
    await safe_click(page, "text=Jawab Pertanyaan") or await safe_click(page, "text=Answer the questions")
    await page.wait_for_load_state("networkidle")

    max_pages = 20
    for _ in range(max_pages):
        # Pilih radio pertama per grup nama
        radios = await page.query_selector_all("input[type='radio']")
        seen_names: set = set()
        clicked_count = 0
        for radio in radios:
            name = await radio.get_attribute("name") or ""
            if name and name not in seen_names:
                seen_names.add(name)
                try:
                    await radio.click()
                    clicked_count += 1
                except Exception:
                    pass

        # Pilih option/select pertama jika ada
        selects = await page.query_selector_all("select")
        for sel in selects:
            options = await sel.query_selector_all("option")
            if len(options) > 1:
                val = await options[1].get_attribute("value")
                await sel.select_option(value=val)

        # Tombol Submit / Next
        submitted = (
            await safe_click(page, "input[type='submit'][value*='Submit']") or
            await safe_click(page, "text=Submit kuesioner") or
            await safe_click(page, "text=Submit questionnaire") or
            await safe_click(page, "text=Kirim") or
            await safe_click(page, "button[type='submit']")
        )
        if submitted:
            await page.wait_for_load_state("networkidle")
            print(f"   ✓ Kuesioner disubmit ({clicked_count} pertanyaan dipilih)")
            break

        # Next page
        went_next = (
            await safe_click(page, "text=Next page") or
            await safe_click(page, "text=Selanjutnya") or
            await safe_click(page, "input[value='Next']")
        )
        if went_next:
            await page.wait_for_load_state("networkidle")
        else:
            break

    print("   ✓ Kuesioner selesai")


# ============================================================
#  MAIN
# ============================================================

async def run(mata_kuliah: str, pertemuan: int):
    separator = "=" * 55
    print(f"\n{separator}")
    print(f"  MENTARI UNPAM BOT")
    print(f"  Mata Kuliah : {mata_kuliah}")
    print(f"  Pertemuan   : {pertemuan}")
    print(f"{separator}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS, slow_mo=SLOW_MO)
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = await ctx.new_page()

        try:
            await login(page)
            course_url = await find_course_url(page, mata_kuliah)
            await navigate_to_pertemuan(page, course_url, pertemuan)
            await complete_quiz(page, "pretest")
            await complete_forum(page, mata_kuliah, pertemuan)
            await complete_quiz(page, "posttest")
            await complete_kuesioner(page)

            print(f"\n{separator}")
            print(f"  ✅  SELESAI! Semua aktivitas PT {pertemuan} selesai.")
            print(f"{separator}\n")

        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()

        finally:
            input("\nTekan ENTER untuk tutup browser...")
            await browser.close()


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        mk = " ".join(sys.argv[1:-1])
        try:
            pt = int(sys.argv[-1])
        except ValueError:
            print("Usage: python mentari_bot.py 'Hukum Pajak' 9")
            sys.exit(1)
    else:
        print("Mentari UNPAM Bot")
        print("-" * 30)
        mk = input("Nama Mata Kuliah : ").strip()
        pt = int(input("Nomor Pertemuan  : ").strip())

    asyncio.run(run(mk, pt))
