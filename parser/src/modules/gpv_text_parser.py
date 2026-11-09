import gzip
import hashlib
import json
import logging
import os
import re
import time
import urllib.request
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from config import OBL_URL

logger = logging.getLogger("SSSK-GpvTextParser")

ALL_QUEUES = [
    "1.1", "1.2",
    "2.1", "2.2",
    "3.1", "3.2",
    "4.1", "4.2",
    "5.1", "5.2",
    "6.1", "6.2",
]

DEFAULT_ON_24 = "1" * 24
DEFAULT_ON_48 = "1" * 48

UA_MONTHS = {
    "січня": 1,
    "лютого": 2,
    "березня": 3,
    "квітня": 4,
    "травня": 5,
    "червня": 6,
    "липня": 7,
    "серпня": 8,
    "вересня": 9,
    "жовтня": 10,
    "листопада": 11,
    "грудня": 12,
}


def compute_queues_hash(queues: dict, is_canceled: bool = False) -> str:
    payload = json.dumps({"canceled": is_canceled, "queues": queues}, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def intervals_to_grid48(intervals_list: list) -> str:
    """
    Перетворює список кортежів (h1, m1, h2, m2) у 48-символьний рядок з '1' та '0'.
    Крок = 30 хвилин: '1' - світло є, '0' - відключення.
    """
    slots = ["1"] * 48
    for h1, m1, h2, m2 in intervals_list:
        start_idx = h1 * 2 + (1 if m1 >= 30 else 0)
        if h2 == 24 or (h2 == 0 and m2 == 0 and (h1 > 0 or m1 > 0)):
            end_idx = 48
        else:
            end_idx = h2 * 2 + (1 if m2 >= 30 else 0)

        start_idx = max(0, min(48, start_idx))
        end_idx = max(0, min(48, end_idx))

        for idx in range(start_idx, end_idx):
            slots[idx] = "0"

    return "".join(slots)


def intervals_to_grid24(intervals_list: list) -> str:
    """
    Перетворює список кортежів (h1, m1, h2, m2) у 24-символьний рядок з '1' та '0'.
    Крок = 1 година: '1' - світло є, '0' - відключення.
    """
    slots = ["1"] * 24
    for h1, m1, h2, m2 in intervals_list:
        start_idx = h1 + (1 if m1 > 30 else 0)
        if h2 == 24 or (h2 == 0 and m2 == 0 and (h1 > 0 or m1 > 0)):
            end_idx = 24
        else:
            end_idx = h2 + (1 if m2 > 0 else 0)

        start_idx = max(0, min(24, start_idx))
        end_idx = max(0, min(24, end_idx))

        for idx in range(start_idx, end_idx):
            slots[idx] = "0"

    return "".join(slots)


def resolve_target_date(day: int, month: int, explicit_year: int | None, ref_dt: datetime) -> tuple[str, str, str]:
    """
    Повертає кортеж (iso_date 'YYYY-MM-DD', short_date 'DD.MM', full_date 'DD.MM.YYYY').
    """
    if explicit_year:
        year = explicit_year
    else:
        year = ref_dt.year
        if ref_dt.month == 12 and month == 1:
            year += 1
        elif ref_dt.month == 1 and month == 12:
            year -= 1
    iso_date = f"{year:04d}-{month:02d}-{day:02d}"
    short_date = f"{day:02d}.{month:02d}"
    full_date = f"{day:02d}.{month:02d}.{year:04d}"
    return iso_date, short_date, full_date


def extract_date_from_text(text: str, ref_dt: datetime) -> tuple[str, str, str] | None:
    """Шукає дату українською мовою ('на 9 листопада', '9 листопада 2026') або DD.MM.YYYY."""
    months_pattern = "|".join(UA_MONTHS.keys())
    m = re.search(
        rf"(?<!\d)(\d{{1,2}})\s+({months_pattern})(?:\s+(\d{{4}}))?",
        text,
        flags=re.IGNORECASE,
    )
    if m:
        day = int(m.group(1))
        month_name = m.group(2).lower()
        month = UA_MONTHS[month_name]
        year = int(m.group(3)) if m.group(3) else None
        try:
            return resolve_target_date(day, month, year, ref_dt)
        except ValueError:
            pass

    m_num = re.search(r"(?<!\d)(\d{2})\.(\d{2})(?:\.(\d{4}))?(?!\d)", text)
    if m_num:
        day = int(m_num.group(1))
        month = int(m_num.group(2))
        year = int(m_num.group(3)) if m_num.group(3) else None
        if 1 <= day <= 31 and 1 <= month <= 12:
            try:
                return resolve_target_date(day, month, year, ref_dt)
            except ValueError:
                pass
    return None


def parse_single_block(raw_block_text: str, ref_dt: datetime) -> dict | None:
    """
    Парсить один інформаційний блок між <hr /> на сторінці погодинних відключень.
    Повертає словник з датами, заголовком, типом блоку та розкладом по підчергах (24 і 48 біт),
    або None, якщо блок є довідковим/статичним.
    """
    lines = [re.sub(r"\s+", " ", line).strip() for line in raw_block_text.splitlines()]
    lines = [line for line in lines if line]
    if not lines:
        return None

    full_text = "\n".join(lines)

    # Відсікаємо статичні блоки з таблицями РЕМів та довідкою
    if "Файли співставлення адрес" in full_text or "Перевірити чергу" in full_text:
        if "Підчерга" not in full_text and "підчерга" not in full_text:
            return None

    date_info = extract_date_from_text(full_text, ref_dt)
    if not date_info:
        return None
    iso_date, short_date, full_date = date_info

    # Виділяємо шапку повідомлення (рядки до першої згадки 'Підчерга' або 'Години відсутності')
    header_lines = []
    for line in lines:
        if re.match(r"^(?:Підчерга|Черга)\s*[1-6]\.[12]", line, flags=re.IGNORECASE):
            break
        if re.match(r"^Години відсутності електроенергії\s*:?$", line, flags=re.IGNORECASE):
            continue
        header_lines.append(line)

    header_text = " ".join(header_lines).strip()
    if not header_text:
        header_text = lines[0]

    lower_header = header_text.lower()
    is_canceled = any(
        kw in lower_header
        for kw in ["скасовано", "не застосовуватимуться", "не будуть застосовані", "відключень не планується"]
    )
    is_update = any(
        kw in lower_header
        for kw in ["оновлено", "оновлення", "змінено", "зміни", "скориговано", "додатково", "увага"]
    )

    # Шукаємо рядки підчерг: Підчерга 1.1 – 03:00-06:00; 12:00-16:00.
    parsed_queues_24 = {}
    parsed_queues_48 = {}
    queue_pattern = re.compile(
        r"(?:Підчерга|Черга)\s*([1-6][\.,][12])\s*[–—\-:]+\s*([^\n]+)",
        flags=re.IGNORECASE,
    )
    interval_pattern = re.compile(r"(\d{1,2})[:.](\d{2})\s*[–—\-]+\s*(\d{1,2})[:.](\d{2})")

    for match in queue_pattern.finditer(full_text):
        q_id = match.group(1).replace(",", ".")
        if q_id not in ALL_QUEUES:
            continue
        rest = match.group(2).strip()
        intervals = []
        for im in interval_pattern.finditer(rest):
            h1, m1, h2, m2 = int(im.group(1)), int(im.group(2)), int(im.group(3)), int(im.group(4))
            intervals.append((h1, m1, h2, m2))
        parsed_queues_24[q_id] = intervals_to_grid24(intervals)
        parsed_queues_48[q_id] = intervals_to_grid48(intervals)

    if not parsed_queues_24 and not is_canceled:
        return None

    return {
        "iso_date": iso_date,
        "date": short_date,
        "date_full": full_date,
        "header_text": header_text,
        "is_update": is_update,
        "is_canceled": is_canceled,
        "queues_24": parsed_queues_24,
        "queues_48": parsed_queues_48,
    }


def parse_gpv_html_schedules(html_content: str, ref_dt: datetime) -> dict[str, dict]:
    """
    Розбирає HTML сторінки ГПВ або новини, групує блоки за датою в хронологічному порядку
    (від найстарішого до найновішого) і повертає фінальний зведений стан для кожної знайденої дати.
    Ключ словника — коротка дата 'DD.MM' (наприклад, '09.11').
    """
    if not html_content:
        return {}

    soup = BeautifulSoup(html_content, "html.parser")
    post_div = (
        soup.select_one("div.content-main div.post")
        or soup.find("div", class_="post")
        or soup.find(id="content")
        or soup
    )

    # Працюємо з копією дерева, щоб не мутувати оригінал при можливих повторних викликах
    post_copy = BeautifulSoup(str(post_div), "html.parser")

    for hr in post_copy.find_all("hr"):
        hr.replace_with("\n===GPV_BLOCK_SPLIT===\n")
    for br in post_copy.find_all("br"):
        br.replace_with("\n")
    for tag in post_copy.find_all(["p", "div", "li", "h1", "h2", "h3", "h4"]):
        tag.append("\n")

    raw_text = post_copy.get_text()
    raw_chunks = raw_text.split("===GPV_BLOCK_SPLIT===")

    blocks_by_date: dict[str, list[dict]] = {}
    for chunk in raw_chunks:
        parsed = parse_single_block(chunk, ref_dt)
        if parsed:
            d = parsed["date"]
            blocks_by_date.setdefault(d, []).append(parsed)

    results: dict[str, dict] = {}
    for short_date, blocks in blocks_by_date.items():
        # На сторінці верхній блок — найсвіжіший. Розвертаємо, щоб накладати від першого до останнього
        chronological = list(reversed(blocks))

        running_24 = {q: DEFAULT_ON_24 for q in ALL_QUEUES}
        running_48 = {q: DEFAULT_ON_48 for q in ALL_QUEUES}
        final_status = "initial"
        final_header = chronological[-1]["header_text"]
        is_canceled = False

        for idx, block in enumerate(chronological):
            if block["is_canceled"]:
                running_24 = {q: DEFAULT_ON_24 for q in ALL_QUEUES}
                running_48 = {q: DEFAULT_ON_48 for q in ALL_QUEUES}
                final_status = "canceled"
                is_canceled = True
            else:
                is_canceled = False
                if len(block["queues_24"]) == len(ALL_QUEUES):
                    running_24 = {q: block["queues_24"][q] for q in ALL_QUEUES}
                    running_48 = {q: block["queues_48"][q] for q in ALL_QUEUES}
                else:
                    for q, g24 in block["queues_24"].items():
                        running_24[q] = g24
                    for q, g48 in block["queues_48"].items():
                        running_48[q] = g48

                if idx > 0 or block["is_update"]:
                    final_status = "updated"
                else:
                    final_status = "initial"
            final_header = block["header_text"]

        q_hash = compute_queues_hash(running_48, is_canceled)
        mode = "all_clear" if is_canceled else "schedule"

        results[short_date] = {
            "iso_date": chronological[-1]["iso_date"],
            "date": short_date,
            "date_full": chronological[-1]["date_full"],
            "mode": mode,
            "status": final_status,
            "message": final_header,
            "queues": running_24,
            "queues_48": running_48,
            "queues_hash": q_hash,
            "revisions_count": len(chronological),
        }

    return results


def fetch_gpv_html(url: str = OBL_URL) -> str | None:
    """Швидке завантаження HTML сторінки ГПВ без браузера (з підтримкою gzip та обходом кешу)."""
    url_with_buster = f"{url}?t={int(time.time())}" if "?" not in url else url
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip",
        "Connection": "close",
    }
    try:
        req = urllib.request.Request(url_with_buster, headers=headers)
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw_bytes = resp.read()
            if resp.info().get("Content-Encoding") == "gzip" or raw_bytes[:2] == b"\x1f\x8b":
                raw_bytes = gzip.decompress(raw_bytes)
            return raw_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        logger.error(f"Failed to fetch GPV HTML from {url}: {e}")
        return None
