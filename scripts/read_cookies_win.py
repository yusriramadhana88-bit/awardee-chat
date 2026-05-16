"""Read Chrome cookies with Windows low-level API to bypass file lock"""
import ctypes, ctypes.wintypes, os, json, base64, win32crypt, sqlite3, tempfile, time, hashlib, re
from Crypto.Cipher import AES

GENERIC_READ = 0x80000000
FILE_SHARE_READ = 0x1
FILE_SHARE_WRITE = 0x2
FILE_SHARE_DELETE = 0x4
OPEN_EXISTING = 3
FILE_FLAG_BACKUP_SEMANTICS = 0x02000000

def read_locked_file(path):
    """Read a file that's locked by another process using Windows CreateFile with share flags"""
    handle = ctypes.windll.kernel32.CreateFileW(
        path,
        GENERIC_READ,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        None,
        OPEN_EXISTING,
        0,
        None
    )
    if handle == ctypes.wintypes.HANDLE(-1).value:
        err = ctypes.GetLastError()
        raise IOError(f"CreateFileW failed with error {err}")

    # Get file size
    size = ctypes.windll.kernel32.GetFileSize(handle, None)

    # Read the file
    buf = ctypes.create_string_buffer(size)
    bytes_read = ctypes.wintypes.DWORD(0)
    ctypes.windll.kernel32.ReadFile(handle, buf, size, ctypes.byref(bytes_read), None)
    ctypes.windll.kernel32.CloseHandle(handle)

    return buf.raw[:bytes_read.value]

CHROME_USER_DATA = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data')
PROFILE = 'Profile 17'
CHANNEL_ID = 'UCz2pZoK8INTryoTEig2NHcw'

print("Reading encryption key...")
with open(os.path.join(CHROME_USER_DATA, 'Local State'), 'r', encoding='utf-8') as f:
    ls = json.load(f)
enc_key = base64.b64decode(ls['os_crypt']['encrypted_key'])[5:]
key = win32crypt.CryptUnprotectData(enc_key, None, None, None, 0)[1]
print("  Key OK")

cookies_path = os.path.join(CHROME_USER_DATA, PROFILE, 'Network', 'Cookies')
print(f"Reading locked Cookies file: {cookies_path}")

try:
    data = read_locked_file(cookies_path)
    print(f"  Read {len(data):,} bytes OK")

    # Write to temp file
    temp_path = os.path.join(tempfile.gettempdir(), 'yt_cookies_unlock.db')
    with open(temp_path, 'wb') as f:
        f.write(data)
    print(f"  Written to temp: {temp_path}")

    # Also copy WAL file if exists
    wal_path = cookies_path + '-wal'
    if os.path.exists(wal_path):
        wal_data = read_locked_file(wal_path)
        with open(temp_path + '-wal', 'wb') as f:
            f.write(wal_data)
        print(f"  WAL file: {len(wal_data)} bytes")

    journal_path = cookies_path + '-journal'
    if os.path.exists(journal_path):
        try:
            j_data = read_locked_file(journal_path)
            with open(temp_path + '-journal', 'wb') as f:
                f.write(j_data)
        except:
            pass

except Exception as e:
    print(f"  Failed: {e}")
    raise

# Open the temp copy with SQLite
print("\nConnecting to cookies database...")
conn = sqlite3.connect(temp_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]
    print(f"  Tables: {tables}")
except Exception as e:
    print(f"  DB error: {e}")
    conn.close()
    raise

cursor.execute("SELECT COUNT(*) FROM cookies")
count = cursor.fetchone()[0]
print(f"  Total cookies: {count}")

cursor.execute("SELECT host_key, name, encrypted_value FROM cookies WHERE host_key LIKE '%youtube.com%' OR host_key LIKE '%google.com%'")
rows = cursor.fetchall()
print(f"  YouTube/Google cookies: {len(rows)}")

def decrypt_value(key, enc_val):
    try:
        if enc_val[:3] in (b'v10', b'v11'):
            iv = enc_val[3:15]
            payload = enc_val[15:-16]
            tag = enc_val[-16:]
            cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
            return cipher.decrypt_and_verify(payload, tag).decode('utf-8')
        elif enc_val:
            return win32crypt.CryptUnprotectData(enc_val, None, None, None, 0)[1].decode('utf-8')
    except:
        return None

cookies = {}
for host, name, enc_val in rows:
    val = decrypt_value(key, enc_val)
    if val:
        cookies[name] = val

print(f"  Decrypted: {len(cookies)} cookies")
conn.close()

# Check for key auth cookies
auth_keys = ['SID', 'HSID', 'SSID', 'SAPISID', '__Secure-3PSID', '__Secure-3PAPISID', 'LOGIN_INFO', 'VISITOR_INFO1_LIVE']
found = [(k, cookies[k][:15]) for k in auth_keys if k in cookies]
print("\nAuth cookies found:")
for k, v in found:
    print(f"  {k}: {v}...")

if not found:
    print("  WARNING: No auth cookies found! Profile 17 might not be logged in to YouTube.")
    # Show all cookie names
    print("\nAll cookie names:", list(cookies.keys())[:30])
    raise SystemExit(1)

# Build auth headers
sapisid = cookies.get('SAPISID') or cookies.get('__Secure-3PAPISID', '')
ts = int(time.time())
sapis_hash = hashlib.sha1(f"{ts} {sapisid} https://studio.youtube.com".encode()).hexdigest()
auth = f"SAPISIDHASH {ts}_{sapis_hash}"
cookie_str = '; '.join(f'{k}={v}' for k, v in cookies.items())

import urllib.request

print(f"\nFetching YouTube Studio channel page...")
headers = {
    'Cookie': cookie_str,
    'Authorization': auth,
    'X-Origin': 'https://studio.youtube.com',
    'Origin': 'https://studio.youtube.com',
    'Referer': f'https://studio.youtube.com/channel/{CHANNEL_ID}/videos/live',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

url = f'https://studio.youtube.com/channel/{CHANNEL_ID}/videos/live'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode('utf-8', errors='replace')
    print(f"  Fetched {len(html):,} bytes")
    print(f"  Has ytInitialData: {'ytInitialData' in html}")
    print(f"  Has initialData: {'initialData' in html}")
    print(f"  Title area: {html[html.find('<title>'):html.find('<title>')+100] if '<title>' in html else 'no title'}")
except Exception as e:
    print(f"  Fetch failed: {e}")
    raise

# Try to extract video IDs
vid_ids = list(dict.fromkeys(re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', html)))
print(f"\n  Found {len(vid_ids)} video IDs in page")

# Extract with titles
title_map = {}
for m in re.finditer(r'"videoId":"([A-Za-z0-9_-]{11})".*?(?:"simpleText"|"text"):"([^"]{5,80})"', html):
    if m.group(1) not in title_map:
        title_map[m.group(1)] = m.group(2)

print("\n=== VIDEO IDs for extract-youtube.mjs ===")
for vid in vid_ids:
    title = title_map.get(vid, '(no title)')
    print(f"  '{vid}',  // {title}")
