import json
import os
import requests
from datetime import datetime

# 1. Налаштування підключення до Supabase (беруться з безпечних секретів GitHub)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

JSON_PATH = "data/unified_schedules.json"

def process_schedule():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠️ Помилка: Не знайдені ключі доступу SUPABASE_URL або SUPABASE_SERVICE_KEY.")
        return

    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"⚠️ Не вдалося прочитати файл JSON: {e}")
        return
        
    # Беремо останній (найсвіжіший) запис
    latest = data[-1]
    
    if not latest.get("processed") or "queues" not in latest:
        print("ℹ️ Немає нових оброблених графіків для синхронізації.")
        return
        
    target_date_str = latest.get("target_date") # Формат "11.04"
    if not target_date_str:
        return
        
    # Конвертуємо "11.04" у правильний формат бази даних "YYYY-MM-DD"
    current_year = datetime.now().year
    day, month = target_date_str.split('.')
    iso_date = f"{current_year}-{month}-{day}"

    events_to_insert = []
    
    # 2. Розшифровуємо одинички та нулики в конкретні години
    for queue, hours in latest["queues"].items():
        if len(hours) != 24:
            continue
            
        prev_state = '1' # Припускаємо, що до початку доби світло було
        for hour, state in enumerate(hours):
            if state != prev_state:
                # Відбулася зміна стану! Формуємо подію
                event_type = 'off' if state == '0' else 'on'
                event_time = f"{hour:02d}:00:00" # Наприклад "04:00:00"
                
                events_to_insert.append({
                    "schedule_date": iso_date,
                    "location_ref": queue,
                    "event_time": event_time,
                    "event_type": event_type
                })
            prev_state = state

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # 3. Відправляємо дані в Supabase (Синхронізація)
    if events_to_insert:
        # Спочатку видаляємо старі записи на цей день, щоб не було дублікатів
        requests.delete(f"{SUPABASE_URL}/rest/v1/schedules_sync?schedule_date=eq.{iso_date}", headers=headers)
        # Вставляємо нові події оптом
        res = requests.post(f"{SUPABASE_URL}/rest/v1/schedules_sync", headers=headers, json=events_to_insert)
        
        # 4. Даємо команду нашому SQL-Мозку перерахувати пуші!
        requests.post(f"{SUPABASE_URL}/rest/v1/rpc/build_push_queue", headers=headers)
        print(f"✅ Успіх! Графік на {iso_date} завантажено в БД. Згенеровано пушів для черг.")

if __name__ == "__main__":
    process_schedule()