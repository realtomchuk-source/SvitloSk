import os
import sqlite3
import json
import logging
from datetime import datetime

# Add paths to find modules
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.abspath(os.path.join(current_dir, '..', 'src'))
sys.path.append(src_dir)

from config import UNIFIED_DB, DATA_DIR

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("SQLiteMigrator")

DB_PATH = os.path.join(DATA_DIR, "schedules.db")

def expand_bits(bits_24):
    """Converts 24-bit string to 48-bit by duplicating each bit."""
    if not bits_24 or len(bits_24) != 24:
        return "1" * 48
    return "".join([b*2 for b in bits_24])

def migrate():
    if not os.path.exists(UNIFIED_DB):
        logger.error(f"Source JSON file not found: {UNIFIED_DB}")
        return

    logger.info(f"Starting migration from {UNIFIED_DB} to {DB_PATH}")

    with open(UNIFIED_DB, "r", encoding="utf-8") as f:
        old_data = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Create table with the new professional schema
    cursor.execute("DROP TABLE IF EXISTS schedules") # Reset for clean migration
    cursor.execute('''
        CREATE TABLE schedules (
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

    ALL_GROUPS = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2", "5.1", "5.2", "6.1", "6.2"]
    migrated_count = 0

    for entry in old_data:
        # 2. Process Queues (24 -> 48 bits)
        old_queues = entry.get("queues", {})
        new_queues = {}
        for g in ALL_GROUPS:
            bits_24 = old_queues.get(g, "1" * 24)
            new_queues[g] = expand_bits(bits_24)
        
        # 3. Prepare Fields
        timestamp = entry.get("timestamp")
        target_date = entry.get("target_date")
        source = entry.get("source", "unknown")
        mode = entry.get("mode", "schedule")
        date = entry.get("date", "")
        date_full = entry.get("date_full", "")
        message = entry.get("message", "")
        processed = entry.get("processed", False)
        
        # New fields for the new era
        status = "AUTO_GENERATED"
        admin_log = ""
        user_announcement = ""

        # 4. Insert into SQLite
        cursor.execute('''
            INSERT INTO schedules (
                timestamp, target_date, source, mode, date, date_full, 
                message, queues_48, status, admin_log, user_announcement, processed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            timestamp, target_date, source, mode, date, date_full,
            message, json.dumps(new_queues), status, admin_log, user_announcement, int(processed)
        ))
        migrated_count += 1

    conn.commit()
    conn.close()
    logger.info(f"Successfully migrated {migrated_count} entries to SQLite.")
    logger.info(f"New database location: {DB_PATH}")

if __name__ == "__main__":
    migrate()
