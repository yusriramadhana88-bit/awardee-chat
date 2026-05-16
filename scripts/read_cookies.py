import sqlite3, os, json, base64, win32crypt, urllib.request, re, time, hashlib
from Crypto.Cipher import AES

CHROME_USER_DATA = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data')
PROFILE = 'Profile 17'
CHANNEL_ID = 'UCz2pZoK8INTryoTEig2NHcw'

print("Reading Chrome encryption key...")
with open(os.path.join(CHROME_USER_DATA, 'Local State'), 'r', encoding='utf-8') as f:
    ls = json.load(f)
enc_key = base64.b64decode(ls['os_crypt']['encrypted_key'])[5:]
key = win32crypt.CryptUnprotectData(enc_key, None, None, None, 0)[1]
print("  Key obtained OK")

# Connect directly using SQLite URI with immutable flag (no write lock needed)
cookies_path = os.path.join(CHROME_USER_DATA, PROFILE, 'Network', 'Cookies')
uri = 'file:' + cookies_path.replace('\\', '/') + '?mode=ro&immutable=1'
print(f"Connecting to: {cookies_path}")

try:
    conn = sqlite3.connect(uri, uri=True)
except Exception as e:
    print(f"URI mode failed: {e}, trying direct connection...")
    conn = sqlite3.connect(cookies_path, check_same_thread=False)

cursor = conn.cursor()
cursor.execute("SELECT host_key, name, encrypted_value FROM cookies WHERE host_key LIKE '%youtube.com%'")
rows = cursor.fetchall()
print(f"Found {len(rows)} YouTube cookies")

def decrypt_value(key, enc_val):
    try:
        if enc_val[:3] in (b'v10', b'v11'):
            iv = enc_val[3:15]
            payload = enc_val[15:-16]
            tag = enc_val[-16:]
            cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
            return cipher.decrypt_and_verify(payload, tag).decode('utf-8')
        else:
            return win32crypt.CryptUnprotectData(enc_val, None, None, None, 0)[1].decode('utf-8')
    except:
        return None

cookies = {}
for host, name, enc_val in rows:
    val = decrypt_value(key, enc_val)
    if val:
        cookies[name] = val

print(f"Decrypted {len(cookies)} cookies")
key_names = ['SID', 'HSID', 'SSID', 'SAPISID', '__Secure-3PSID', '__Secure-3PAPISID', 'LOGIN_INFO']
for k in key_names:
    if k in cookies:
        print(f"  {k}: {cookies[k][:20]}...")

# Build SAPISIDHASH
sapisid = cookies.get('SAPISID') or cookies.get('__Secure-3PAPISID', '')
timestamp = int(time.time())
sapis_hash = hashlib.sha1(f"{timestamp} {sapisid} https://studio.youtube.com".encode()).hexdigest()
authorization = f"SAPISIDHASH {timestamp}_{sapis_hash}"

cookie_str = '; '.join(f'{k}={v}' for k, v in cookies.items())

print("\nFetching YouTube Studio live videos page...")
headers = {
    'Cookie': cookie_str,
    'Authorization': authorization,
    'X-Origin': 'https://studio.youtube.com',
    'Origin': 'https://studio.youtube.com',
    'Referer': f'https://studio.youtube.com/channel/{CHANNEL_ID}/videos/live',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

url = f'https://studio.youtube.com/channel/{CHANNEL_ID}/videos/live'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=30) as resp:
    html = resp.read().decode('utf-8', errors='replace')

print(f"Page fetched: {len(html):,} bytes")

# Extract video IDs with titles
pattern = r'"videoId":"([A-Za-z0-9_-]{11})"'
all_ids = list(dict.fromkeys(re.findall(pattern, html)))
print(f"Video IDs found: {len(all_ids)}")

# Try to get titles alongside IDs
title_pattern = r'"videoId":"([A-Za-z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"'
titled = re.findall(title_pattern, html)
titled_dict = {vid: title for vid, title in titled}

# Also check simpleText pattern
simple_pattern = r'"videoId":"([A-Za-z0-9_-]{11})".*?"title":\{"simpleText":"([^"]+)"'
for vid, title in re.findall(simple_pattern, html):
    if vid not in titled_dict:
        titled_dict[vid] = title

print("\n=== ALL VIDEO IDs ===")
for vid_id in all_ids:
    title = titled_dict.get(vid_id, '(no title)')
    print(f"  '{vid_id}',  // {title}")

conn.close()
