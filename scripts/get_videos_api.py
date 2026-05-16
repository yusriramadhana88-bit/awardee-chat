"""Use browser_cookie3 to get Chrome cookies and fetch YouTube Studio page"""
import browser_cookie3, os, json, time, hashlib, re, urllib.request, urllib.error, base64

CHANNEL_ID = 'UCz2pZoK8INTryoTEig2NHcw'
CHROME_USER_DATA = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data')
PROFILE_PATH = os.path.join(CHROME_USER_DATA, 'Profile 17')

print("Reading Chrome Profile 17 cookies via browser_cookie3...")
try:
    # browser_cookie3 can handle locked Chrome databases on Windows
    jar = browser_cookie3.chrome(
        cookie_file=os.path.join(PROFILE_PATH, 'Network', 'Cookies'),
        domain_name='.youtube.com'
    )
    cookies = {c.name: c.value for c in jar}
    print(f"  Got {len(cookies)} YouTube cookies")
except Exception as e:
    print(f"  Profile 17 failed: {e}")
    # Try default Chrome
    print("  Trying default Chrome profile...")
    try:
        jar = browser_cookie3.chrome(domain_name='.youtube.com')
        cookies = {c.name: c.value for c in jar}
        print(f"  Got {len(cookies)} YouTube cookies from default profile")
    except Exception as e2:
        print(f"  All failed: {e2}")
        cookies = {}

if not cookies:
    print("No cookies found!")
    exit(1)

# Check for auth cookies
auth_keys = ['SID', 'SSID', 'HSID', 'SAPISID', '__Secure-3PSID', '__Secure-3PAPISID']
found_auth = {k: v for k, v in cookies.items() if k in auth_keys}
print(f"  Auth cookies: {list(found_auth.keys())}")

if not found_auth:
    print("No auth cookies! Trying to get cookies from all profiles...")
    # Try each profile
    for i in range(1, 20):
        for pname in [f'Profile {i}', 'Default']:
            profile_cookies_path = os.path.join(CHROME_USER_DATA, pname, 'Network', 'Cookies')
            if not os.path.exists(profile_cookies_path):
                continue
            try:
                jar = browser_cookie3.chrome(
                    cookie_file=profile_cookies_path,
                    domain_name='.youtube.com'
                )
                test_cookies = {c.name: c.value for c in jar}
                has_auth = any(k in test_cookies for k in auth_keys)
                if has_auth:
                    print(f"  Found auth cookies in {pname}!")
                    cookies = test_cookies
                    found_auth = {k: v for k, v in cookies.items() if k in auth_keys}
                    break
            except:
                pass

# Build SAPISID hash
sapisid = cookies.get('SAPISID') or cookies.get('__Secure-3PAPISID', '')
ts = int(time.time())
sapis_hash = hashlib.sha1(f"{ts} {sapisid} https://studio.youtube.com".encode()).hexdigest()
auth_header = f"SAPISIDHASH {ts}_{sapis_hash}"

cookie_str = '; '.join(f'{k}={v}' for k, v in cookies.items())

print(f"\nFetching YouTube Studio live videos page...")
headers = {
    'Cookie': cookie_str,
    'Authorization': auth_header,
    'X-Origin': 'https://studio.youtube.com',
    'Origin': 'https://studio.youtube.com',
    'Referer': f'https://studio.youtube.com/channel/{CHANNEL_ID}/videos/live',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

url = f'https://studio.youtube.com/channel/{CHANNEL_ID}/videos/live'
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        html = resp.read().decode('utf-8', errors='replace')
    print(f"  Fetched {len(html):,} bytes, has ytInitialData: {'ytInitialData' in html}")
except urllib.error.HTTPError as e:
    print(f"  HTTP {e.code}: {e.reason}")
    body = e.read().decode('utf-8', errors='replace')
    print(f"  Body: {body[:200]}")
    exit(1)
except Exception as e:
    print(f"  Error: {e}")
    exit(1)

# Check page content
if 'Oops' in html[:1000] or 'permission' in html[:2000].lower():
    print("  WARNING: Got permission error page - wrong account")
    print(f"  First 500 chars: {html[:500]}")
    exit(1)

# Extract video IDs
vid_ids = list(dict.fromkeys(re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', html)))
print(f"  Video IDs found: {len(vid_ids)}")

# Extract with titles using multiple patterns
title_map = {}

# Pattern 1: runs text
for m in re.finditer(r'"videoId":"([A-Za-z0-9_-]{11})"[^{]*?"text":"([^"]{5,80})"', html, re.DOTALL):
    if m.group(1) not in title_map:
        title_map[m.group(1)] = m.group(2)

# Pattern 2: simpleText
for m in re.finditer(r'"videoId":"([A-Za-z0-9_-]{11})"[^{]*?"simpleText":"([^"]{5,80})"', html, re.DOTALL):
    if m.group(1) not in title_map:
        title_map[m.group(1)] = m.group(2)

print("\n=== UNLISTED VIDEO IDs FOUND ===")
for vid in vid_ids:
    title = title_map.get(vid, '(no title)')
    print(f"  '{vid}',  // {title}")
