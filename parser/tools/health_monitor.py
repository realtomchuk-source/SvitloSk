import os
import re
import logging
from config import LOGS_DIR

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("HealthMonitor")

def analyze_logs(days=7):
    """Analyzes parser logs for critical errors and failures."""
    if not os.path.exists(LOGS_DIR):
        logger.error(f"Logs directory {LOGS_DIR} not found.")
        return

    log_files = [f for f in os.listdir(LOGS_DIR) if f.endswith(".log")]
    if not log_files:
        logger.info("No log files found to analyze.")
        return

    error_counts = {}
    critical_events = []

    for log_file in log_files:
        path = os.path.join(LOGS_DIR, log_file)
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if "ERROR" in line or "CRITICAL" in line or "FATAL" in line:
                    # Extract the error message part
                    msg = line.split(" - ")[-1].strip()
                    error_counts[msg] = error_counts.get(msg, 0) + 1
                    critical_events.append(line.strip())

    logger.info("\n" + "="*30)
    logger.info(f"HEALTH REPORT (Last {days} days)")
    logger.info("="*30)

    if not error_counts:
        logger.info("✅ No critical errors found. System is healthy.")
    else:
        logger.info(f"Found {len(error_counts)} unique types of errors:")
        for msg, count in sorted(error_counts.items(), key=lambda x: x[1], reverse=True):
            logger.warning(f"[{count} times] {msg}")

    if critical_events:
        logger.info("\nLast 5 critical events:")
        for event in critical_events[-5:]:
            logger.info(f"  {event}")

if __name__ == "__main__":
    analyze_logs()
