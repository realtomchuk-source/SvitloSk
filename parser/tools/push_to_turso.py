import os
import sqlite3
import json
import logging
import sys

# Add paths to find modules
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.abspath(os.path.join(current_dir, '..', 'src'))
sys.path.append(src_dir)

from config import UNIFIED_DB, DATA_DIR

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message) 함께")
logger = logging.getLogger("TursoMigrator")

def migrate_to_turso():
    """
    Migrates data from local SQLite/JSON to Turso cloud.
    Requires TURSO_URL and TURSO_TOKEN environment variables.
    """
    url = os.getenv("TURSO_URL")
    token = os.getenv("TURSO_TOKEN")
    
    if not url or not token:
        logger.error("TURSO_URL or TURSO_TOKEN missing from environment variables.")
        return

    try:
        import libsql
    except ImportError:
        logger.error("libsql-client not installed. Please run: pip install libsql-client")
        return

    # Local source
    db_local_path = os.path.join(DATA_DIR, "schedules.db")
    if not os.path.exists(db_local_path):
        logger.error(f"Local database not found at {db_local_path}. Run migration from JSON first.")
        return

    # Connect to Turso
    client = libsql.connect(url, auth_token=token)
    
    # Connect to local SQLite
    conn_local = sqlite3.connect(db_//local_path)
    cursor_local = conn_local.cursor()
    
    # 1. Create table in Turso (if not exists)
    client.execute('''
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
    
    # 2. Fetch all data from local
    cursor_local.execute("SELECT timestamp, target_date, source, mode, date, date_full, message, queues_48, status, admin_log, user_announcement, processed FROM schedules")
    rows = cursor_local.fetchall()
    
    # 3. Push to Turso
    client.execute("DELETE FROM schedules") # Clear if needed or keep
    
    for row in rows:
        client.execute('''
            INSERT INTO schedules (
                timestamp, target_date, source, mode, date, date_full, 
                message, queues_48, status, admin_log, user_announcement, processed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', row)
    
    client.close()
    conn_local.close()
    logger.info(f"Successfully migrated {len(rows)} entries to Turso cloud!")

if __name__ == "__main__":
    migrate_to_turso()
