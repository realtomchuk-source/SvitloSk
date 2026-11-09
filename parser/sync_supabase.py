import json
import os
import requests
from datetime import datetime, timedelta
import pytz

# 1. Налаштування підключення до Supabase (беруться з безпечних секретів GitHub)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

JSON_PATH = "data/unified_schedules.json"


def _sync_single_entry(entry, now_kyiv, today_str, headers):
    target_date_str = entry.get("target_date")  # Формат "11.04"
    if not target_date_str or "." not in target_date_str:
        return

    current_year = now_kyiv.year
    day, month = target_date_str.split(".")
    if int(month) == 12 and now_kyiv.month == 1:
        year = current_year - 1
    elif int(month) == 1 and now_kyiv.month == 12:
        year = current_year + 1
    else:
        year = current_year

    iso_date = f"{year}-{month}-{day}"
    is_tomorrow_schedule = (target_date_str != today_str)

    events_to_insert = []

    # 2. Розшифровуємо одинички та нулики в конкретні години
    for queue, hours in entry.get("queues", {}).items():
        if len(hours) != 24:
            continue

        prev_state = "1"  # Припускаємо, що до початку доби світло було
        for hour, state in enumerate(hours):
            if state != prev_state:
                event_type = "off" if state == "0" else "on"
                event_time = f"{hour:02d}:00:00"

                events_to_insert.append({
                    "schedule_date": iso_date,
                    "location_ref": queue,
                    "event_time": event_time,
                    "event_type": event_type,
                })
            prev_state = state

    # 3. Відправляємо дані в Supabase (Синхронізація)
    requests.delete(f"{SUPABASE_URL}/rest/v1/schedules_sync?schedule_date=eq.{iso_date}", headers=headers)
    if events_to_insert:
        requests.post(f"{SUPABASE_URL}/rest/v1/schedules_sync", headers=headers, json=events_to_insert)

        # 4. Пуші — тільки для графіка на сьогодні (завтрашні пуші тимчасово відкладені)
        if not is_tomorrow_schedule:
            requests.post(f"{SUPABASE_URL}/rest/v1/rpc/build_push_queue", headers=headers)
            print(f"✅ Успіх! Графік на {iso_date} завантажено в БД. Push-сповіщення згенеровано.")
        else:
            print(f"✅ Графік на {iso_date} завантажено в БД. ⏸️ Push для завтрашнього графіка — ВІДКЛАДЕНО.")
    else:
        print(f"ℹ️ На {iso_date} відключень немає (очищено старі події в schedules_sync).")

    # 5. Відправляємо дані в Центр Верифікації (parser_results)
    verification_entry = {
        "target_date": target_date_str,
        "raw_data": entry["queues"],
        "status": "auto_approved",
        "received_at": now_kyiv.isoformat(),
        "source_media_url": entry.get("source_url") or entry.get("img_url"),
    }

    try:
        check_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/parser_results?target_date=eq.{target_date_str}&status=in.(pending,auto_approved)&order=received_at.desc&limit=1",
            headers=headers,
        )
        if check_res.status_code == 200:
            existing_rows = check_res.json()
            if not existing_rows:
                requests.post(f"{SUPABASE_URL}/rest/v1/parser_results", headers=headers, json=verification_entry)
                print(f"📡 Дані на {target_date_str} відправлено в Центр Верифікації.")
            elif existing_rows[0].get("raw_data") != entry["queues"]:
                row_id = existing_rows[0].get("id")
                requests.patch(
                    f"{SUPABASE_URL}/rest/v1/parser_results?id=eq.{row_id}",
                    headers=headers,
                    json={
                        "raw_data": entry["queues"],
                        "received_at": now_kyiv.isoformat(),
                        "source_media_url": entry.get("source_url") or entry.get("img_url"),
                    },
                )
                print(f"🔄 Оновлено існуючий запис на {target_date_str} в Центрі Верифікації.")
            else:
                print(f"📡 Запис на {target_date_str} вже актуальний в черзі верифікації.")
    except Exception as e:
        print(f"⚠️ Помилка відправки в Центр Верифікації: {e}")

    # 6. Відправляємо автоматичне оголошення в систему як чернетку (draft)
    user_announcement = entry.get("user_announcement", "")
    if user_announcement and user_announcement.strip():
        announcement_entry = {
            "title": "🤖 Gemini Авто-Графік",
            "text": user_announcement,
            "time_label": "Автоматично",
            "active_date": iso_date,
            "status": "draft",
            "is_active": False,
            "sort_order": 1,
        }

        try:
            check_ann = requests.get(
                f"{SUPABASE_URL}/rest/v1/system_announcements?active_date=eq.{iso_date}&title=eq.🤖%20Gemini%20Авто-Графік",
                headers=headers,
            )
            if check_ann.status_code == 200 and not check_ann.json():
                requests.post(f"{SUPABASE_URL}/rest/v1/system_announcements", headers=headers, json=announcement_entry)
                print(f"📡 Авто-оголошення для {iso_date} завантажено як Чернетку в адмінку.")
            else:
                print(f"📡 Авто-оголошення на {iso_date} вже існує.")
        except Exception as e:
            print(f"⚠️ Помилка відправки авто-оголошення в Supabase: {e}")


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

    if not data:
        print("ℹ️ База графіків порожня.")
        return

    kyiv_tz = pytz.timezone("Europe/Kyiv")
    now_kyiv = datetime.now(kyiv_tz)
    today_str = now_kyiv.strftime("%d.%m")
    tomorrow_str = (now_kyiv + timedelta(days=1)).strftime("%d.%m")

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    # Знаходимо найсвіжіші оброблені записи на сьогодні та на завтра (або останній запис у базі)
    entries_to_sync = []
    for target_d in (today_str, tomorrow_str):
        found = next(
            (e for e in reversed(data) if e.get("processed") and e.get("target_date") == target_d and "queues" in e),
            None,
        )
        if found:
            entries_to_sync.append(found)

    if not entries_to_sync:
        latest = data[-1]
        if latest.get("processed") and "queues" in latest:
            entries_to_sync.append(latest)

    if not entries_to_sync:
        print("ℹ️ Немає нових оброблених графіків для синхронізації.")
        return

    for entry in entries_to_sync:
        _sync_single_entry(entry, now_kyiv, today_str, headers)

if __name__ == "__main__":
    process_schedule()