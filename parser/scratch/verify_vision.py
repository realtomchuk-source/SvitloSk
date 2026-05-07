import os
import sys

# Setup paths
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.abspath(os.path.join(current_dir, '..', 'src'))
sys.path.append(src_dir)

import logging
logging.basicConfig(level=logging.INFO)

from parse_schedule import process_image_and_text
from config import RAW_SITE_DIR

def run_test():
    test_img = os.path.join(RAW_SITE_DIR, "20260410_100923.png")
    if not os.path.exists(test_img):
        print(f"Error: Test image {test_img} not found")
        return

    print(f"--- Running Vision Test on {test_img} ---")
    with open(test_img, "rb") as f:
        img_bytes = f.read()
    
    # Run the core logic (Chain 1)
    # We pass html_content=None to skip Gemini in this local dry run
    success = process_image_and_text(
        img_bytes=img_bytes,
        source_used="local_test",
        raw_path=test_img,
        state={},
        html_content=None 
    )
    
    print(f"\nResult: {'SUCCESS' if success else 'FAILED'}")
    
    # Check if database was created
    db_path = os.path.join(current_dir, '..', 'data', 'schedules.db')
    if os.path.exists(db_path):
        print(f"Database created at: {db_path}")
        import sqlite3
        conn = sqlite3.connect(db_path)
        count = conn.execute("SELECT count(*) FROM schedules").fetchone()[0]
        print(f"Rows in database: {count}")
        
        last_row = conn.execute("SELECT target_date, queues_48 FROM schedules ORDER BY id DESC LIMIT 1").fetchone()
        print(f"Last Entry Date: {last_row[0]}")
        # Check if it's 48 bits (JSON string of dict with 48-char values)
        import json
        queues = json.loads(last_row[1])
        first_q = list(queues.values())[0]
        print(f"Bits for first queue: {len(first_q)} (Expected: 48)")
        conn.close()
    else:
        print("Database NOT found!")

if __name__ == "__main__":
    run_test()
