import os
import hashlib
import logging
import time
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
from config import OBL_URL, RAW_SITE_DIR

logger = logging.getLogger("SSSK-SiteParser")

def get_hash(data_bytes_or_str):
    if isinstance(data_bytes_or_str, str):
        data_bytes_or_str = data_bytes_or_str.encode('utf-8')
    return hashlib.md5(data_bytes_or_str).hexdigest()

def check_site_light():
    """Швидка перевірка сторінки через requests (без браузера)."""
    import requests
    import time
    from config import OBL_URL, HEADERS
    try:
        # Add timestamp to bypass cache
        url_with_cache_buster = f"{OBL_URL}?t={int(time.time())}"
        resp = requests.get(url_with_cache_buster, headers=HEADERS, timeout=20)
        if resp.status_code == 200:
            return get_hash(resp.text)
    except Exception as e:
        logger.error(f"Light check error: {e}")
    return None

def fetch_page_dynamic(url):
    """Fetches the page content using Playwright."""
    logger.info(f"Fetching {url} with Playwright...")
    try:
        import time
        # Add timestamp to bypass cache
        url_with_cache_buster = f"{url}?t={int(time.time())}"
        
        with sync_playwright() as p:
            # Using browser with common desktop resolution
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={'width': 1280, 'height': 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            Stealth().apply_stealth_sync(page)
            
            page.goto(url_with_cache_buster, wait_until="networkidle", timeout=60000)
            time.sleep(3) # Wait for images to settle
            
            html = page.content()
            browser.close()
            return html
    except Exception as e:
        logger.error(f"Playwright fetch error: {e}")
        return None

def extract_image_url(html):
    """Broad search for schedule image."""
    soup = BeautifulSoup(html, 'html.parser')
    
    # Priority: Any image in /Content/Uploads/ with common extensions
    for img in soup.find_all('img'):
        src = img.get('src', '')
        # Usually it's the only one in Uploads except for the logo (which is typically named logo.png)
        if '/content/uploads/' in src.lower() and ('logo' not in src.lower()):
            if src.lower().endswith(('.png', '.jpg', '.jpeg')):
                return src
                
    return None

def check_for_changes(state):
    """
    Multi-stage trigger to detect if the schedule has changed.
    Returns (should_run_heavy_scan, trigger_reason, current_html_hash, current_img_url)
    """
    logger.info("Running multi-stage trigger check...")
    
    # --- Stage 1: Light-check (HTML Hash) ---
    # We use requests instead of Playwright for speed
    current_html_hash = check_site_light()
    if not current_html_hash:
        logger.error("Stage 1: Could not reach site.")
        return False, "SITE_UNREACHABLE", None, None
    
    if current_html_hash == state.get("last_html_hash"):
        # Even if HTML is same, the image might be updated on the server 
        # but the URL remains the same. However, for 99% of cases, 
        # if HTML is identical, nothing changed.
        # We still allow a 'forced' run every few hours for safety.
        logger.info("Stage 1: HTML hash matches. No change detected.")
        return False, "HTML_MATCH", current_html_hash, None

    logger.info("Stage 1: HTML changed. Moving to Stage 2 (DOM-trigger).")

    # --- Stage 2: DOM-trigger (Image URL) ---
    # Now we need the actual HTML to find the image URL. 
    # Since we already have the HTML from check_site_light (implicitly), 
    # let's fetch it properly.
    try:
        import requests
        from config import OBL_URL, HEADERS
        resp = requests.get(OBL_URL, headers=HEADERS, timeout=20)
        soup = BeautifulSoup(resp.text, 'html.parser')
        img_url = extract_image_url(resp.text)
        
        if not img_url:
            # Check for "no outages" text if image is missing
            text = soup.get_text().lower()
            if "не прогнозує відключень" in text or "графік не застосовується" in text:
                logger.info("Stage 2: Site says 'No Outages'. Triggering empty update.")
                return True, "NO_OUTAGES_TEXT", current_html_hash, None
            
            logger.warning("Stage 2: Image URL not found and no 'No Outage' text.")
            return False, "NO_IMAGE_FOUND", current_html_hash, None

        # Normalize URL
        from urllib.parse import urljoin
        img_url = urljoin(OBL_URL, img_url)
        
        last_img_url = state.get("last_site_hash") # We use this field as image URL storage for the trigger
        if img_url == last_img_url:
            logger.info("Stage 2: Image URL is identical. No change.")
            return False, "IMG_URL_MATCH", current_html_hash, img_url
            
        logger.info(f"Stage 2: New image URL detected: {img_url}")
        return True, "NEW_IMG_URL", current_html_hash, img_url

    except Exception as e:
        logger.error(f"Stage 2 error: {e}")
        return False, "TRIGGER_ERROR", current_html_hash, None

def run_site_parser(state):
    """
    Heavy scan: fetches full page via Playwright to ensure we have the latest 
    dynamic content and downloads the image for processing.
    """
    logger.info("Executing heavy scan...")
    
    # 1. Fetch the page with Playwright (dynamic rendering)
    html = fetch_page_dynamic(OBL_URL)
    if not html:
        logger.error("Failed to fetch page via Playwright.")
        return None

    # 2. Extract specific image URL
    soup = BeautifulSoup(html, 'html.parser')
    img_url = extract_image_url(html)
    
    # 3. Extract news text for announcements (preserve structure)
    news_text = soup.get_text(separator='\n')
    news_text = '\n'.join([line.strip() for line in news_text.splitlines() if line.strip()])
    
    # 4. Check for "no outages" text
    is_empty = False
    if not img_url:
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text().lower()
        if "не прогнозує відключень" in text or "графік не застосовується" in text:
            logger.info("Official site says: NO OUTAGES predicted.")
            is_empty = True
        else:
            logger.warning("Schedule image not found and no 'No Outage' text detected.")
            return None

    if is_empty:
        # Generate an empty "power-on" result
        return {
            "changed": True,
            "is_empty": True,
            "raw_path": "site_empty",
            "hash": "empty",
            "caption": "No outages predicted today"
        }

    if not img_url.startswith("http"):
        from urllib.parse import urljoin
        img_url = urljoin(OBL_URL, img_url)

    logger.info(f"Target image URL: {img_url}")

    try:
        import requests
        import time
        from config import HEADERS
        # Add timestamp to bypass cache
        url_with_cache_buster = f"{img_url}?t={int(time.time())}"
        img_bytes = requests.get(url_with_cache_buster, timeout=30, headers=HEADERS).content
    except Exception as e:
        logger.error(f"Image download error: {e}")
        return None

    new_hash = get_hash(img_bytes)
    html_hash = get_hash(html)
    
    last_hash = state.get("last_site_hash")
    last_html_hash = state.get("last_html_hash")

    from modules.utils import get_now
    timestamp = get_now().strftime("%Y%m%d_%H%M%S")
    raw_path = os.path.join(RAW_SITE_DIR, f"{timestamp}.png")
    os.makedirs(RAW_SITE_DIR, exist_ok=True)
    with open(raw_path, "wb") as f:
        f.write(img_bytes)

    changed = (new_hash != last_hash) or (html_hash != last_html_hash)
    
    return {
        "changed": changed,
        "raw_path": raw_path,
        "hash": new_hash,
        "html_hash": html_hash,
        "img_bytes": img_bytes,
        "img_url": img_url,
        "html": html,
        "news_text": news_text,
        "caption": "Schedule updated (image or text)" if changed else "No changes"
    }
