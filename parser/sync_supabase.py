import json
import os
import requests
from datetime import datetime
import pytz

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
    kyiv_tz = pytz.timezone('Europe/Kyiv')
    now_kyiv = datetime.now(kyiv_tz)
    current_year = now_kyiv.year
    today_str = now_kyiv.strftime("%d.%m")
    day, month = target_date_str.split('.')
    iso_date = f"{current_year}-{month}-{day}"
    
    # Визначаємо чи це графік на завтра
    is_tomorrow_schedule = (target_date_str != today_str)

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
        
        # 4. Пуші — тільки для графіка на сьогодні (завтрашні пуші тимчасово відкладені)
        if not is_tomorrow_schedule:
            requests.post(f"{SUPABASE_URL}/rest/v1/rpc/build_push_queue", headers=headers)
            print(f"✅ Успіх! Графік на {iso_date} завантажено в БД. Push-сповіщення згенеровано.")
        else:
            print(f"✅ Графік на {iso_date} завантажено в БД. ⏸️ Push для завтрашнього графіка — ВІДКЛАДЕНО.")

    # 5. Відправляємо дані в Центр Верифікації (parser_results)
    verification_entry = {
        "target_date": target_date_str,
        "raw_data": latest["queues"],
        "status": "auto_approved",
        "received_at": now_kyiv.isoformat(),
        "source_media_url": latest.get("source_url") or latest.get("img_url")
    }
    
    try:
        # Перевіряємо, чи немає вже запису на цю дату, щоб не плодити дублікати в черзі
        check_res = requests.get(f"{SUPABASE_URL}/rest/v1/parser_results?target_date=eq.{target_date_str}&status=in.(pending,auto_approved)", headers=headers)
        if check_res.status_code == 200 and not check_res.json():
            requests.post(f"{SUPABASE_URL}/rest/v1/parser_results", headers=headers, json=verification_entry)
            print(f"📡 Дані на {target_date_str} відправлено в Центр Верифікації.")
        else:
            print(f"📡 Запис на {target_date_str} вже існує в черзі верифікації.")
    except Exception as e:
        print(f"⚠️ Помилка відправки в Центр Верифікації: {e}")

    # 6. Відправляємо автоматичне оголошення Gemini в систему як чернетку (draft)
    user_announcement = latest.get("user_announcement", "")
    if user_announcement and user_announcement.strip():
        announcement_entry = {
            "title": "🤖 Gemini Авто-Графік",
            "text": user_announcement,
            "time_label": "Автоматично",
            "active_date": iso_date,
            "status": "draft",
            "is_active": False,
            "sort_order": 1
        }
        
        try:
            # Перевіряємо, чи немає вже такого оголошення від Gemini на цю дату в базі
            check_ann = requests.get(f"{SUPABASE_URL}/rest/v1/system_announcements?active_date=eq.{iso_date}&title=eq.🤖%20Gemini%20Авто-Графік", headers=headers)
            if check_ann.status_code == 200 and not check_ann.json():
                requests.post(f"{SUPABASE_URL}/rest/v1/system_announcements", headers=headers, json=announcement_entry)
                print(f"📡 Авто-оголошення від Gemini для {iso_date} завантажено як Чернетку в адмінку.")
            else:
                print(f"📡 Авто-оголошення від Gemini на {iso_date} вже існує.")
        except Exception as e:
            print(f"⚠️ Помилка відправки авто-оголошення в Supabase: {e}")

if __name__ == "__main__":
    process_schedule()