import os
import sys
import json
import logging
from datetime import datetime, timedelta

# Ensure we can import from the same directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from modules.utils import load_json, save_json, get_now
from config import UNIFIED_DB, DATA_DIR, TODAY_JSON_FILE, TOMORROW_JSON_FILE, DEADLINE_HOUR, DEADLINE_MINUTE

logger = logging.getLogger("SSSK-GenerateToday")

STATUS_FILE = os.path.join(DATA_DIR, "parser_status.json")

# Full list of queues as requested by user
FULL_QUEUES_LIST = [
    "1.1", "1.2", "2.1", "2.2", "3.1", "3.2", 
    "4.1", "4.2", "5.1", "5.2", "6.1", "6.2"
]

def get_fallback_queues():
    """Returns a full grid (1.1-6.2) with all 1s (No outages)."""
    return {q: "1" * 24 for q in FULL_QUEUES_LIST}

def ensure_full_queues(queues):
    """Ensures that the queues dictionary contains all standard queues (1.1-6.2)."""
    if not queues:
        return get_fallback_queues()
    
    result = {}
    for q_name in FULL_QUEUES_LIST:
        if q_name in queues:
            result[q_name] = queues[q_name]
        else:
            # If a queue is missing from the real schedule, we assume it has light on (1)
            result[q_name] = "1" * 24
    return result

def archive_day(today_data):
    """Saves the today schedule into the static archive folder in YYYY-MM-DD.json format."""
    try:
        # Convert date "30.05" to "2026-05-30"
        date_str = today_data.get("date") # e.g. "30.05"
        if not date_str or "." not in date_str:
            return
            
        day_part, month_part = date_str.split('.')
        day = int(day_part)
        month = int(month_part)
        
        # Use timezone-aware now in Europe/Kyiv to calculate current year and month
        now_kyiv = get_now()
        current_year = now_kyiv.year
        current_month = now_kyiv.month
        
        # Year transition safety logic:
        # If the schedule is for December (12) but we are already in January (1), it belongs to the previous year.
        if month == 12 and current_month == 1:
            schedule_year = current_year - 1
        # If the schedule is for January (1) but we are in December (12), it belongs to the next year.
        elif month == 1 and current_month == 12:
            schedule_year = current_year + 1
        else:
            schedule_year = current_year
            
        iso_date = f"{schedule_year}-{month:02d}-{day:02d}"
        
        # Build archived queues (48 chars) and stats
        archived_queues = {}
        stats = {}
        queues = today_data.get("queues", {})
        
        for q_name, bitstring in queues.items():
            # Convert 24-char to 48-char
            archived_queues[q_name] = "".join(c * 2 for c in bitstring)
            # Calculate stats
            hours_on = bitstring.count('1')
            hours_off = bitstring.count('0')
            stats[q_name] = {
                "hoursOn": hours_on,
                "hoursOff": hours_off
            }
            
        archived_day_data = {
            "date": iso_date,
            "queues": archived_queues,
            "meta": {
                "savedAt": now_kyiv.isoformat(),
                "source": "parser",
                "stats": stats
            }
        }
        
        # Create web/public/data/archive directory if it doesn't exist
        archive_dir = os.path.join(os.path.dirname(TODAY_JSON_FILE), "archive")
        os.makedirs(archive_dir, exist_ok=True)
        
        # Save archived day
        archive_file_path = os.path.join(archive_dir, f"{iso_date}.json")
        with open(archive_file_path, 'w', encoding='utf-8') as f:
            json.dump(archived_day_data, f, ensure_ascii=False, indent=2)
            
        logger.info(f"✅ Objective schedule archived to {archive_file_path}")
        
    except Exception as e:
        logger.error(f"Failed to archive today's schedule: {e}")

def generate_files():
    db = load_json(UNIFIED_DB, default=[])
    
    # Use timezone-aware 'now' from utils (Europe/Kyiv)
    now = get_now()
    today_str = now.strftime("%d.%m")
    tomorrow_str = (now + timedelta(days=1)).strftime("%d.%m")
    
    # 1. G1: TODAY
    best_today = None
    for entry in reversed(db):
        if entry.get("processed") and entry.get("target_date") == today_str:
            best_today = entry
            break
            
    if best_today:
        today_data = {
            "date": today_str,
            "updated_at": now.isoformat(),
            "mode": best_today.get("mode", "schedule"),
            "message": best_today.get("message", f"Графік на {today_str}"),
            "queues": ensure_full_queues(best_today.get("queues")),
            "meta": {
                "generated_at": now.strftime("%d.%m.%Y %H:%M"),
                "state": "parser_found",
                "target_date": today_str
            }
        }
    else:
        logger.warning(f"No original schedule for {today_str}. Generating Today fallback.")
        today_data = {
            "date": today_str,
            "updated_at": now.isoformat(),
            "mode": "schedule",
            "message": "Графік обмежень не оприлюнено. Попередньо: відключень не прогнозується.",
            "queues": get_fallback_queues(),
            "meta": {
                "generated_at": now.strftime("%d.%m.%Y %H:%M"),
                "state": "no_outages_fallback",
                "target_date": today_str
            }
        }
    
    save_json(TODAY_JSON_FILE, today_data)
    logger.info(f"G1 (Today) saved to {TODAY_JSON_FILE}")
    archive_day(today_data)

    # 2. G2: TOMORROW
    best_tomorrow = None
    for entry in reversed(db):
        if entry.get("processed") and entry.get("target_date") == tomorrow_str:
            best_tomorrow = entry
            break
            
    if best_tomorrow:
        tomorrow_data = {
            "date": tomorrow_str,
            "updated_at": now.isoformat(),
            "mode": best_tomorrow.get("mode", "schedule"),
            "message": best_tomorrow.get("message", f"Графік на {tomorrow_str}"),
            "queues": ensure_full_queues(best_tomorrow.get("queues")),
            "meta": {
                "generated_at": now.strftime("%d.%m.%Y %H:%M"),
                "state": "parser_found",
                "target_date": tomorrow_str
            }
        }
    else:
        # Check if it's "Late evening" (23:50+)
        is_late_evening = (now.hour == DEADLINE_HOUR and now.minute >= DEADLINE_MINUTE) or (now.hour > DEADLINE_HOUR)
        
        if is_late_evening:
            logger.info("Late evening and no tomorrow schedule found. Generating Tomorrow fallback.")
            tomorrow_data = {
                "date": tomorrow_str,
                "updated_at": now.isoformat(),
                "mode": "schedule",
                "message": "Графік на завтра не оприлюднено. Попередньо: відключень не прогнозується.",
                "queues": get_fallback_queues(),
                "meta": {
                    "generated_at": now.strftime("%d.%m.%Y %H:%M"),
                    "state": "no_outages_fallback",
                    "target_date": tomorrow_str
                }
            }
        else:
            # Still waiting for announcements
            tomorrow_data = {
                "date": tomorrow_str,
                "updated_at": now.isoformat(),
                "status": "pending",
                "meta": {
                    "generated_at": now.strftime("%d.%m.%Y %H:%M"),
                    "state": "pending",
                    "target_date": tomorrow_str
                }
            }
            
    save_json(TOMORROW_JSON_FILE, tomorrow_data)
    logger.info(f"G2 (Tomorrow) saved to {TOMORROW_JSON_FILE}")
    
    write_status("ok", today_data, tomorrow_data)
    return True

def write_status(status, today, tomorrow):
    now = get_now()
    status_data = {
        "last_sync": now.isoformat(),
        "today": {
            "date": today.get("date"),
            "state": today.get("meta", {}).get("state"),
            "updated": today.get("meta", {}).get("generated_at")
        },
        "tomorrow": {
            "date": tomorrow.get("date"),
            "state": tomorrow.get("meta", {}).get("state"),
            "updated": tomorrow.get("meta", {}).get("generated_at")
        }
    }
    save_json(STATUS_FILE, status_data)

def generate_today_json():
    """Legacy entry point used by parse_schedule.py"""
    return generate_files()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
    success = generate_files()
    sys.exit(0 if success else 1)
