import os
import sys
import unittest
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from modules.gpv_text_parser import parse_gpv_html_schedules


class TestGpvTextParser(unittest.TestCase):
    def setUp(self):
        self.ref_dt = datetime(2026, 11, 24, 21, 0)

    def test_additional_outages_merge_with_previous(self):
        html = """
        <div class="post">
            <p>За розпорядженням НЕК «Укренерго» оновлено графік погодинних відключень (ГПВ) на 24 листопада (оновлено з 20:00). Додаткові години відсутності електроенергії:</p>
            <p>Підчерга 4.1 – 20:00-22:00</p>
            <hr />
            <p>Графік погодинних відключень на 24 листопада</p>
            <p>Підчерга 1.1 – 04:00-07:00</p>
            <p>Підчерга 1.2 – 01:00-04:00</p>
            <p>Підчерга 2.1 – 08:00-12:00</p>
            <p>Підчерга 2.2 – 00:00-01:00</p>
            <p>Підчерга 3.1 – 06:00-10:00</p>
            <p>Підчерга 3.2 – 06:00-10:00</p>
            <p>Підчерга 4.1 – 06:00-10:00; 14:00-19:00</p>
            <p>Підчерга 4.2 – 22:00-24:00</p>
            <p>Підчерга 5.1 – 08:00-12:00</p>
            <p>Підчерга 5.2 – 01:00-04:00</p>
            <p>Підчерга 6.1 – 04:00-06:00</p>
            <p>Підчерга 6.2 – 00:00-01:00</p>
        </div>
        """
        res = parse_gpv_html_schedules(html, self.ref_dt)
        g48 = res["24.11"]["queues_48"]["4.1"]
        # 06:00-10:00 (idx 12..19) must remain '0'
        self.assertEqual(g48[12:20], "0" * 8)
        # 14:00-19:00 (idx 28..37) must remain '0'
        self.assertEqual(g48[28:38], "0" * 10)
        # 20:00-22:00 (idx 40..43) must be added as '0'
        self.assertEqual(g48[40:44], "0" * 4)

    def test_partial_update_preserves_before_effective_time(self):
        html = """
        <div class="post">
            <p>Оновлено графік для підчерги 4.1 на 24 листопада з 20:00:</p>
            <p>Підчерга 4.1 – 22:00-24:00</p>
            <hr />
            <p>Графік погодинних відключень на 24 листопада</p>
            <p>Підчерга 4.1 – 06:00-10:00; 20:00-22:00</p>
        </div>
        """
        res = parse_gpv_html_schedules(html, self.ref_dt)
        g48 = res["24.11"]["queues_48"]["4.1"]
        # 06:00-10:00 (before 20:00) preserved
        self.assertEqual(g48[12:20], "0" * 8)
        # 20:00-22:00 (after 20:00) replaced by new schedule -> '1'
        self.assertEqual(g48[40:44], "1" * 4)
        # 22:00-24:00 (after 20:00) -> '0'
        self.assertEqual(g48[44:48], "0" * 4)

    def test_uses_existing_by_date_when_initial_block_missing(self):
        existing = {
            "24.11": {
                "queues": {"4.1": "111111000011111111111111"},
                "queues_48": {"4.1": "111111111111000000001111111111111111111111111111"},
            }
        }
        html = """
        <div class="post">
            <p>Додаткові години відсутності електроенергії на 24 листопада:</p>
            <p>Підчерга 4.1 – 20:00-22:00</p>
        </div>
        """
        res = parse_gpv_html_schedules(html, self.ref_dt, existing_by_date=existing)
        g48 = res["24.11"]["queues_48"]["4.1"]
        self.assertEqual(g48[12:20], "0" * 8)
        self.assertEqual(g48[40:44], "0" * 4)


if __name__ == "__main__":
    unittest.main()
