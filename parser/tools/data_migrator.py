import os
import sqlite3
import json
import logging
from config import UNIFIED_DB

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("DataMigrator")

DB_PATH = "SvitloSk/parser/data/schedules.db"

def expand_bits(bits_24):
    """Converts 24-bit string to 48-bit by duplicating each bit."""
    if not bits_24 or len(bits_24) != 24:
        return "1" * 48 # Fallback
    return "".join([b*2 for b in bits_24])

def migrate_json_to_sqlite():
    """Migrates data from unified_schedules.json to a SQLite database."""
    if not os.path.exists(UNIFIED_DB):
        logger.error(f"Source file {UNIFIED_DB} not found.")
        return

    with open(UNIFIED_DB, "r", encoding="utf-8") as f:
        data = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            target_date TEXT,
            source TEXT,
            mode TEXT,
            date TEXT,
            date_full TEXT,
            message TEXT,
            queues_48 TEXT, -- JSON string of 12 queues with 48 bits each
            status TEXT DEFAULT 'AUTO_GENERATED',
            admin_log TEXT,
            user_announcement TEXT,
            processed BOOLEAN
        )
    ''')

    migrated_count = 0
    for entry in data:
        # Expand queues to 48 bits
        queues_raw = entry.get("queues", {})
        queues_48 = {q: expand_bits(bits) for q, bits in queues_raw.items()}
        
        # Ensure all 12 queues are present
        ALL_GROUPS = ["1.1", "1.2", "2.1", "2.2", "3.1", "3.2", "4.1", "4.2", "5.1", "5.2", "6.1", "6.2"]
        final_queues = {g: queues_48.get(g, "1"*48) for g in ALL_GROUPS}

        cursor.execute('''
            INSERT INTO schedules (timestamp, target_date, source, mode, date, date_full, message, queues_48, processed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            entry.get("timestamp"),
            entry.get("target_date"),
            entry.get("source"),
            entry.get("mode"),
            entry.get("date"),
            entry.get("date_full"),
            entry.get("message"),
            json.dumps(final_//queues),
            entry.get("processed", False)
        ))
        migrated_count += 1

    conn.commit()
    conn.close()
    logger.info(f"Successfully migrated {migrated_count} entries to {DB_PATH}")

if __name__ == "__main__":
    migrate_json_to_sqlite()
