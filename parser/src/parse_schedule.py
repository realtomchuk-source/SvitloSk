import os
import sys
import re
import json
import logging
import sqlite3
from datetime import datetime, timedelta

# Ensure paths for modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.abspath(os.path.join(current_dir, '..')))

from modules.utils import load_json, save_json, get_now, should_run, cleanup_old_files, is_tomorrow_processed, TZ
from modules.site_parser import run_site_parser, check_for_changes
from modules.ocr_helper import extract_text_from_image
from modules.table_parser import parse_schedule_from_text, validate_queues
from modules.gemini_service import GeminiService
from config import STATE_FILE, UNIFIED_DB, RAW_SITE_DIR, LOGS_DIR, EVENING_START_HOUR, DATA_DIR

logger = logging.getLogger("SSSK-Main")

def get_db_connection():
    """
    Connects to Turso Cloud if environment variables are present, 
    otherwise falls back to local SQLite for testing.
    """
    url = os.getenv("TURSO_URL")
    token = os.getenv("TURSO_TOKEN")
    
    if url and token:
        try:
            import libsql
            return libsql.connect(url, auth_token=token)
        except Exception as e:
            logger.error(f"Failed to connect to Turso: {e}. Falling back to local.")
    
    # Fallback to local SQLite
    conn = sqlite3.connect(os.path.join(DATA_DIR, "schedules.db"))
    conn.execute('''
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            target_date TEXT,
            source TEXT,
            mode TEXT,
            date TEXT,
            date_full TEXT,
            message TEXT,
            queues_48 TEXT,
            status TEXT,
            admin_log TEXT,
            user_announcement TEXT,
            processed BOOLEAN
        )
    ''')
    return conn

def expand_bits(bits_24):
    """Converts 24-bit string to 48-bit by duplicating each bit."""
    if not bits_24 or len(bits_24) != 24:
        return "1" * 48
    return "".join([b*2 for b in bits_24])

def time_to_index(time_str):
    """Converts 'HH:MM' or 'HH' to 48-bit index (0-47)."""
    try:
        if ":" in time_str:
            h, m = map(int, time_str.split(":"))
        else:
            h, m = int(time_str), 0
        
        index = h * 2 + (1 if m >= 30 else 0)
        return max(0, min(47, index))
    except:
        return None

def apply_gemini_updates(queues_48, updates):
    """
    Applies Gemini's textual overrides to the 48-bit queue grid.
    """
    updated_queues = queues_48.copy()
    has_changes = False

    for up in updates:
        q = up.get("queue")
        action = up.get("action") # 'ON' or 'OFF'
        time_range = up.get("time_range", "")
        
        if q not in updated_queues: continue
        
        val = "1" if action == "ON" else "0"
        
        # Simple range parsing: "14:00-16:00"
        if "-" in time_range:
            start_str, end_str = time_range.split("-")
            start_idx = time_to_index(start_str.strip())
            end_idx = time_to_index(end_str.strip())
            
            if start_idx is not None and end_idx is not None:
                q_list = list(updated_queues[q])
                for i in range(start_idx, end_idx):
                    q_list[i] = val
                updated_queues[q] = "".join(q_list)
                has_changes = True
        elif "from" in time_range.lower() or "\u0437" in time_range.lower():
            match = re.search(r"(\d{1,2}:\d{2})", time_range)
            if match:
                start_idx = time_to_index(match.group(1))
                if start_idx is not None:
                    q_list = list(updated_queues[q])
                    for i in range(start_idx, 48):
                        q_list[i] = val
                    updated_queues[q] = "".join(q_list)
                    has_changes = True
        elif "until" in time_range.lower() or "\u0434\u043e" in time_range.lower():
            match = re.search(r"(\d{1,2}:\d{2})", time_range)
            if match:
                end_idx = time_to_index(match.group(1))
                if end_idx is not None:
                    q_list = list(updated_queues[q])
                    for i in range(0, end_idx):
                        q_list[i] = val
                    updated_queues[q] = "".join(q_list)
                    has_changes = True

    return updated_queues, has_changes

def save_to_sqlite(entry):
    """Saves a processed schedule entry into the database (Local or Turso)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO schedules (
            timestamp, target_date, source, mode, date, date_full, 
            message, queues_48, status, admin_log, user_announcement, processed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        entry.get("timestamp"),
        entry.get("target_date"),
        entry.get("source"),
        entry.get("mode"),
        entry.get("date"),
        entry.get("date_full"),
        entry.get("message"),
        json.dumps(entry.get("queues")),
        entry.get("status"),
        entry.get("admin_log"),
        entry.get("user_announcement"),
        int(entry.get("processed", False))
    ))
    conn.commit()
    conn.close()

def process_image_and_text(img_bytes, source_used, raw_path, state, html_content=None, news_text=None):
    """
    The NEW core logic: Vision (24bit) -> Expand (48bit) -> Gemini (Overrides) -> SQLite.
    """
    logger.info(f"Processing image from {source_used}...")
    
    raw_text = extract_text_from_image(img_bytes)
    structured = parse_schedule_from_text(raw_text, img_bytes)
    
    if not structured:
        logger.error(f"FAILED to parse structure from {source_used}")
        return False

    # Fallback date extraction if OCR failed to read date from image
    if not structured.get("date"):
        from modules.table_parser import extract_date
        fallback_short, fallback_full = None, None
        
        if news_text:
            fallback_short, fallback_full = extract_date(news_text)
        if not fallback_short and html_content:
            from bs4 import BeautifulSoup
            plain_html_text = BeautifulSoup(html_content, "html.parser").get_text(separator="\n")
            fallback_short, fallback_full = extract_date(plain_html_text)
        if not fallback_short and state and state.get("last_img_url"):
            # Try filename pattern: file20261017164437203.png -> 2026-10-17 -> 17.10
            m_url = re.search(r"file(202\d)(\d{2})(\d{2})\d+", state.get("last_img_url", ""))
            if m_url:
                yyyy, mm, dd = m_url.group(1), m_url.group(2), m_url.group(3)
                fallback_short = f"{dd}.{mm}"
                fallback_full = f"{dd}.{mm}.{yyyy}"

        if fallback_short:
            logger.info(f"Recovered schedule date via fallback: {fallback_short} ({fallback_full})")
            structured["date"] = fallback_short
            structured["date_full"] = fallback_full or f"{fallback_short}.2026"
            structured["message"] = f"Графік погодинних відключень на {structured['date_full']}"

    # 2. Expansion Stage (24 -> 48 bits)
    queues_24 = structured.get("queues", {})
    queues_48 = {q: expand_bits(bits) for q, bits in queues_24.items()}
    
    # 3. Intelligence Stage (Gemini Overrides)
    status = "AUTO_GENERATED"
    admin_log = ""
    user_announcement = ""
    
    if html_content:
        logger.info("Applying Gemini intelligence to text...")
        gemini = GeminiService()
        updates = gemini.analyze_news(html_content, structured.get("date"))
        
        if updates:
            queues_48, changed = apply_gemini_updates(queues_48, updates)
            if changed:
                status = "TEXT_OVERRIDE"
                admin_log = "\n".join([u.get("admin_log", "") for u in updates])
                user_announcement = "\n".join([u.get("user_announcement", "") for u in updates])

    # 4. Final Assembly
    entry = {
        "timestamp": get_now().isoformat(),
        "target_date": structured.get("date"),
        "source": source_used,
        "raw_path": raw_path,
        "mode": structured.get("mode"),
        "date": structured.get("date"),
        "date_full": structured.get("date_full"),
        "message": structured.get("message"),
        "queues": queues_48,
        "status": status,
        "admin_log": admin_log,
        "user_announcement": user_announcement,
        "processed": True
    }

    save_to_sqlite(entry)
    
    # Write to unified_schedules.json (PWA pipeline compatibility)
    try:
        db = load_json(UNIFIED_DB, default=[])
        new_json_entry = {
            "timestamp": get_now().isoformat(),
            "target_date": structured.get("date"),
            "source": source_used,
            "type": "schedule",
            "processed": True,
            "raw_path": raw_path,
            "source_url": state.get("last_img_url") if state else None,
            "queues": structured.get("queues", {}),
            "queues_raw": structured.get("queues", {}).copy(),
            "announcements": [],
            "mode": structured.get("mode"),
            "date": structured.get("date"),
            "date_full": structured.get("date_full"),
            "message": structured.get("message")
        }
        db.append(new_json_entry)
        save_json(UNIFIED_DB, db)
        logger.info(f"SUCCESS: Exported schedule for {structured.get('date')} to unified_schedules.json")
    except Exception as e:
        logger.error(f"Failed to export to unified_schedules.json: {e}")

    logger.info(f"SUCCESS: Processed {source_used} schedule. Status: {status}")
    return True

def process_text_schedules(text_schedules, source_used, raw_path, state):
    """
    Processes textual GPV schedules (new HOE format without images) into SQLite and unified_schedules.json.
    """
    if not text_schedules:
        return False

    db = load_json(UNIFIED_DB, default=[])
    now_iso = get_now().isoformat()
    updated_any = False

    for short_date, item in sorted(text_schedules.items()):
        queues_24 = item.get("queues", {})
        queues_48 = item.get("queues_48", {})
        queues_hash = item.get("queues_hash", "")
        mode = item.get("mode", "schedule")
        message = item.get("message", f"Графік погодинних відключень на {short_date}")
        date_full = item.get("date_full", f"{short_date}.{get_now().year}")
        status_label = "TEXT_UPDATED" if item.get("status") == "updated" else (
            "TEXT_CANCELED" if item.get("status") == "canceled" else "TEXT_INITIAL"
        )

        # Check if latest entry for this target_date in unified_schedules.json already has the exact same queues & message
        existing_latest = next((e for e in reversed(db) if e.get("target_date") == short_date and e.get("processed")), None)
        if existing_latest:
            if existing_latest.get("queues") == queues_24 and existing_latest.get("message") == message:
                logger.info(f"Text schedule for {short_date} is already up-to-date in unified_schedules.json.")
                continue

        # 1. Save to SQLite / Turso (48-bit grid)
        entry_sqlite = {
            "timestamp": now_iso,
            "target_date": short_date,
            "source": source_used,
            "raw_path": raw_path,
            "mode": mode,
            "date": short_date,
            "date_full": date_full,
            "message": message,
            "queues": queues_48,
            "status": status_label,
            "admin_log": f"Parsed from GPV text blocks (revisions={item.get('revisions_count', 1)}, hash={queues_hash})",
            "user_announcement": message if item.get("status") in ("updated", "canceled") else "",
            "processed": True
        }
        try:
            save_to_sqlite(entry_sqlite)
        except Exception as e:
            logger.error(f"Failed to save text schedule for {short_date} to SQLite: {e}")

        # 2. Append to unified_schedules.json (24-bit grid for PWA compatibility)
        new_json_entry = {
            "timestamp": now_iso,
            "target_date": short_date,
            "source": source_used,
            "type": "schedule",
            "processed": True,
            "raw_path": raw_path,
            "source_url": state.get("last_img_url") if state else None,
            "queues": queues_24,
            "queues_raw": queues_24.copy(),
            "queues_48": queues_48,
            "queues_hash": queues_hash,
            "announcements": [],
            "mode": mode,
            "status": item.get("status", "initial"),
            "date": short_date,
            "date_full": date_full,
            "message": message,
            "user_announcement": message if item.get("status") in ("updated", "canceled") else ""
        }
        db.append(new_json_entry)
        updated_any = True
        logger.info(f"SUCCESS: Exported textual GPV schedule for {short_date} (status={item.get('status')}) to unified_schedules.json")

    if updated_any:
        save_json(UNIFIED_DB, db)

    return updated_any

def main():
    logger.info("Starting SSSK Parser (Gemini + Turso/SQLite Edition)")

    state = load_json(STATE_FILE, default={
        "last_run": None,
        "last_site_hash": None,
        "last_html_hash": None,
        "last_img_url": None
    })

    now = get_now()
    curr_hour = now.hour
    curr_minute = now.minute

    # 1. Aggressive mode check
    tomorrow_ready = is_tomorrow_processed()
    is_aggressive = EVENING_START_HOUR <= curr_hour <= 23 and not tomorrow_ready

    # 2. Multi-stage Trigger
    should_scan, reason, html_hash, img_url = check_for_changes(state)
    
    # Check for --force flag in command line
    is_forced = "--force" in sys.argv
    if is_forced:
        logger.info("FORCED run detected via command line flag.")
    
    # Forced run every 2 hours
    last_run_str = state.get("last_run")
    last_run = datetime.fromisoformat(last_run_str) if last_run_str else now - timedelta(hours=5)
    if last_run.tzinfo is None:
        last_run = TZ.localize(last_run)
    force_heavy = (now - last_run).total_seconds() / 3600 >= 2

    if should_scan or force_heavy or is_aggressive or is_forced:
        logger.info(f"Executing heavy scan. Reason: {reason if should_scan else ('forced' if is_forced else 'interval/aggressive')}")
        
        site_res = run_site_parser(state)
        if site_res:
            state["last_site_hash"] = site_res.get("hash")
            state["last_html_hash"] = site_res.get("html_hash")
            state["last_img_url"] = site_res.get("img_url", "")
            
            if site_res.get("is_text_schedule"):
                process_text_schedules(
                    site_res.get("text_schedules"),
                    "site_text",
                    site_res.get("raw_path", "site_text"),
                    state
                )
            elif site_res.get("is_empty"):
                today_short = now.strftime("%d.%m")
                today_full = now.strftime("%d.%m.%Y")
                empty_24 = {q: "1" * 24 for q in ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2", "5.1", "5.2", "6.1", "6.2"]}
                empty_48 = {q: "1" * 48 for q in empty_24}
                process_text_schedules({
                    today_short: {
                        "date": today_short,
                        "date_full": today_full,
                        "mode": "all_clear",
                        "status": "canceled",
                        "message": f"Погодинні відключення на {today_short} не застосовуватимуться.",
                        "queues": empty_24,
                        "queues_48": empty_48,
                        "queues_hash": "all_clear",
                        "revisions_count": 1
                    }
                }, "site", site_res.get("raw_path", "site_empty"), state)
            elif site_res.get("changed") and site_res.get("img_bytes"):
                process_image_and_text(
                    site_res["img_bytes"], 
                    "site", 
                    site_res["raw_path"], 
                    state, 
                    site_res.get("html"),
                    site_res.get("news_text")
                )
    else:
        logger.info("No changes detected. Skipping heavy scan.")

    # 3. Cleanup and State update
    cleanup_old_files(RAW_SITE_DIR, days=7)
    cleanup_old_files(LOGS_DIR, days=30)

    state["last_run"] = now.isoformat()
    save_json(STATE_FILE, state)
    logger.info("Cycle completed successfully.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.critical(f"FATAL: Unhandled exception: {e}", exc_info=True)
        sys.exit(1)
