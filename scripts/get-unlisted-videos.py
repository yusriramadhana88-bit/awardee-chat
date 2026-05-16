"""
Script to extract unlisted video IDs from Awardee.id YouTube channel
Uses Chrome cookies from Profile 17 (awardeeofficial@gmail.com)
"""

import os
import json
import shutil
import sqlite3
import base64
import tempfile
import subprocess
import sys

# Try to install required packages
def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "-q"])

try:
    import win32crypt
except ImportError:
    install("pywin32")
    import win32crypt

try:
    from Crypto.Cipher import AES
except ImportError:
    install("pycryptodome")
    from Crypto.Cipher import AES

import urllib.request
import urllib.parse

CHROME_USER_DATA = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data")
PROFILE = "Profile 17"  # awardeeofficial@gmail.com
CHANNEL_ID = "UCz2pZoK8INTryoTEig2NHcw"

def get_encryption_key():
    local_state_path = os.path.join(CHROME_USER_DATA, "Local State")
    with open(local_state_path, "r", encoding="utf-8") as f:
        local_state = json.load(f)
    encrypted_key = base64.b64decode(local_state["os_crypt"]["encrypted_key"])
    # Remove "DPAPI" prefix (first 5 bytes)
    encrypted_key = encrypted_key[5:]
    # Decrypt using Windows DPAPI
    key = win32crypt.CryptUnprotectData(encrypted_key, None, None, None, 0)[1]
    return key

def decrypt_cookie(key, encrypted_value):
    try:
        if encrypted_value[:3] == b'v10' or encrypted_value[:3] == b'v11':
            iv = encrypted_value[3:15]
            payload = encrypted_value[15:-16]
            tag = encrypted_value[-16:]
            cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
            return cipher.decrypt_and_verify(payload, tag).decode("utf-8")
        else:
            # Old-style DPAPI encryption
            return win32crypt.CryptUnprotectData(encrypted_value, None, None, None, 0)[1].decode("utf-8")
    except Exception as e:
        return None

def get_cookies_for_domain(domain_filter=".youtube.com"):
    key = get_encryption_key()
    cookies_path = os.path.join(CHROME_USER_DATA, PROFILE, "Network", "Cookies")

    # Copy to temp (Chrome may lock the file)
    temp_cookies = os.path.join(tempfile.gettempdir(), "awardee_cookies_tmp.db")
    try:
        shutil.copy2(cookies_path, temp_cookies)
    except Exception:
        # Try without locking
        with open(cookies_path, 'rb') as f:
            data = f.read()
        with open(temp_cookies, 'wb') as f:
            f.write(data)

    conn = sqlite3.connect(temp_cookies)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT host_key, name, encrypted_value, path, is_secure, expires_utc
        FROM cookies
        WHERE host_key LIKE ?
        ORDER BY host_key, name
    """, (f"%{domain_filter.lstrip('.')}%",))

    cookies = {}
    for row in cursor.fetchall():
        value = decrypt_cookie(key, row["encrypted_value"])
        if value:
            cookies[row["name"]] = value

    conn.close()
    os.unlink(temp_cookies)
    return cookies

def build_cookie_header(cookies):
    return "; ".join(f"{k}={v}" for k, v in cookies.items())

def fetch_studio_videos(cookies):
    """Use YouTube Studio's internal API to list all live broadcasts"""
    cookie_header = build_cookie_header(cookies)

    # Get SAPISIDHASH for authentication
    sapisid = cookies.get("SAPISID") or cookies.get("__Secure-3PAPISID", "")

    import time, hashlib
    timestamp = int(time.time())
    sapisid_hash = hashlib.sha1(f"{timestamp} {sapisid} https://studio.youtube.com".encode()).hexdigest()
    authorization = f"SAPISIDHASH {timestamp}_{sapisid_hash}"

    headers = {
        "Cookie": cookie_header,
        "Authorization": authorization,
        "X-Origin": "https://studio.youtube.com",
        "Origin": "https://studio.youtube.com",
        "Referer": f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/live",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "X-Goog-AuthUser": "0",
        "X-Youtube-Client-Name": "62",
        "X-Youtube-Client-Version": "1.20240520.01.00",
    }

    # YouTube Studio uses ytcfg for client context - let's use the browse API
    # First, let's try the simpler approach: fetch the Studio live page and parse ytInitialData
    url = f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/live"

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")
        return html
    except Exception as e:
        return f"ERROR: {e}"

def extract_video_ids_from_html(html):
    """Extract video IDs from YouTube Studio page HTML"""
    import re

    video_data = []

    # Look for videoId patterns in the JSON data embedded in the page
    # Pattern: "videoId":"VIDEO_ID"
    pattern = r'"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"'
    ids = re.findall(pattern, html)

    # Also look for title patterns near video IDs
    # Find all blocks with videoId + title
    block_pattern = r'"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"[^}]*?"title"\s*:\s*\{[^}]*?"simpleText"\s*:\s*"([^"]+)"'
    blocks = re.findall(block_pattern, html, re.DOTALL)

    seen = set()
    for video_id, title in blocks:
        if video_id not in seen:
            seen.add(video_id)
            video_data.append({"id": video_id, "title": title})

    # Add any remaining IDs not captured in blocks
    for vid_id in ids:
        if vid_id not in seen:
            seen.add(vid_id)
            video_data.append({"id": vid_id, "title": "(title not captured)"})

    return video_data

def main():
    print("Awardee.id YouTube Video ID Extractor")
    print("=========================================")
    print(f"Profile: {PROFILE} (awardeeofficial@gmail.com)")
    print()

    print("Step 1: Reading Chrome cookies...")
    try:
        cookies = get_cookies_for_domain(".youtube.com")
        if not cookies:
            print("❌ No cookies found! Make sure Chrome is using Profile 17.")
            return
        print(f"  OK Found {len(cookies)} YouTube cookies")

        # Show key cookies present
        key_cookies = ["SID", "SSID", "HSID", "SAPISID", "__Secure-3PSID"]
        found_keys = [k for k in key_cookies if k in cookies]
        print(f"  Auth cookies found: {', '.join(found_keys)}")
    except Exception as e:
        print(f"❌ Error reading cookies: {e}")
        import traceback
        traceback.print_exc()
        return

    print()
    print("Step 2: Fetching YouTube Studio live videos page...")
    html = fetch_studio_videos(cookies)

    if html.startswith("ERROR:"):
        print(f"❌ Failed to fetch page: {html}")
        return

    print(f"  ✓ Page fetched ({len(html):,} bytes)")

    # Check if we got the right page
    if "ytInitialData" not in html and "initialData" not in html:
        print("  ⚠️  Page may not have loaded correctly (no initialData found)")
        # Save HTML for inspection
        with open("studio_page_debug.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("  Saved debug HTML to studio_page_debug.html")

    print()
    print("Step 3: Extracting video IDs...")
    videos = extract_video_ids_from_html(html)

    if not videos:
        print("❌ No video IDs found in page")
        print("Saving raw HTML for inspection...")
        with open("studio_page_debug.html", "w", encoding="utf-8") as f:
            f.write(html[:50000])
        return

    print(f"✅ Found {len(videos)} video IDs:")
    print()

    # Filter and show only the unlisted private interview videos
    unlisted_videos = [v for v in videos if "Private Interview" in v.get("title", "") or "(title not captured)" in v.get("title", "")]
    all_videos = videos

    print("All extracted videos:")
    print("-" * 60)
    for i, v in enumerate(all_videos, 1):
        print(f"{i:3}. {v['id']} | {v['title'][:50]}")

    print()
    print("=" * 60)
    print("Video IDs for extract-youtube.mjs:")
    print("-" * 60)
    for v in all_videos:
        print(f"  '{v['id']}', // {v['title'][:50]}")

if __name__ == "__main__":
    main()
