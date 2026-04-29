import os
import json
import logging
import google.generativeai as genai
from typing import List, Dict, Any, Optional

logger = logging.getLogger("SSSK-Gemini")

class GeminiService:
    def __init__(self):
        # API Key is expected to be in environment variables (GitHub Secrets)
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in environment variables. Gemini features will be disabled.")
            self.model = None
        else:
            genai.configure(api_key=self.api_key)
            # We use gemini-1.5-flash for speed and cost-efficiency (it's free for our volume)
            self.model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                generation_config={
                    "temperature": 0.1, # Low temperature for high precision and consistency
                    "top_p": 0.95,
                    "top_k": 64,
                    "max_output_tokens": 2048,
                    "response_mime_type": "application/json",
                }
            )
            logger.info("Gemini Service initialized successfully.")

    def _build_system_prompt(self, target_date: str) -> str:
        """
        Creates a strict system instruction for the LLM with geographical filtering.
        """
        return f"""
        You are a professional power grid analyst for the Starokostiantyniv community (Старокостянтинівська територіальна громада).
        Your task is to analyze news text and extract specific power outage updates for the date: {target_date}.

        PRIORITY LOGIC:
        1. GLOBAL PRIORITY (Queues): If the text mentions specific queue numbers (e.g., 'черга 1.1', 'підчерга 4.4'), the information is ALWAYS relevant regardless of the location.
        2. LOCAL PRIORITY (Geography): If no queue number is mentioned, but the text mentions any of the following locations, it is relevant:
           - City: Старокостянтинів
           - Districts and Settlements:
             * Баглаївський округ: Баглаї, Ємці, Загірне, Лажева
             * Березненський округ: Бутівці, Березне, Нападівка, Пихтії, Вербівочка, Лисинці, Першотравневе
             * Великомацевицький округ: Великі Мацевичі, Малі Мацевичі, Круча, Раштівка
             * Великочернятинський округ: Великий Чернятин, Малий Чернятин, Оріхівка
             * Вербородинський округ: Вербородинці, Гнатки
             * Веснянський округ: Веснянка, Ланок, Караїмівка
             * Волице-Керекешинський округ: Волиця-Керекешина, Червона Семенівка
             * Воронковецький округ: Воронківці
             * Григорівський округ: Григорівка
             * Губчанський округ: Зеленці, Губча, Партинці, Мальки
             * Іршиківський округ: Малишівка, Іршики, Хижники, Яремичі
             * Капустинський округ: Капустин
             * Красносільський округ: Красносілка, Немирівка
             * Огіївський округ: Громівка, Огіївці, Писарівка, Половинники
             * Пашковецький округ: Грибенинка, Пашківці, Попівці
             * Пеньківський округ: Андронівка, Бовкуни, Драчі, Залісся, Криниця, Пеньки
             * Радковецький округ: Демківці, Хутори, Жабче, Радківці
             * Решнівецький округ: Решнівка
             * Росолівецький округ: Росолівці
             * Самчиківський округ: Самчики, Степок
             * Сахновецький округ: Сахнівці, Киселі
             * Стецьківський округ: Дубина, Костянець, Кучівка, Прохорівка, Стецьки
        3. GENERAL PRIORITY: Phrases like 'всі підчерги', 'загальне відключення', 'в області' are relevant for all 12 queues.
        4. NOISE: Everything else (other cities, general news) must be ignored.

        RULES:
        - If it's a general outage for the whole community, apply it to all 12 queues (1.1 to 6.2).
        - For each change, identify:
          * The queue number (e.g., '1.1').
          * The action: 'ON' (power restored) or 'OFF' (power cut).
          * The time range (e.g., '14:00-16:00', 'from 15:00').
        
        OUTPUT FORMAT (Strict JSON):
        Return a JSON object with a list called 'updates'. Each update must have:
        {{
            "updates": [
                {{
                    "queue": "string", 
                    "action": "ON" | "OFF",
                    "time_range": "string",
                    "admin_log": "Detailed technical description. Mention if it was a specific village or a general outage. Include a quote.",
                    "user_announcement": "Friendly, short message for the end-user with emojis"
                }}
            ]
        }}

        If no relevant updates are found for the target date, return: {{"updates": []}}
        """

    def analyze_news(self, text: str, target_date: str) -> List[Dict[str, Any]]:
        """
        Analyzes news text and returns a list of structured updates.
        """
        if not self.model:
            logger.error("Gemini model not initialized (API key missing).")
            return []

        if not text or len(text.strip()) < 10:
            return []

        try:
            system_prompt = self._build_system_prompt(target_date)
            full_prompt = f"{system_prompt}\n\nNEWS TEXT TO ANALYZE:\n{text}"
            
            response = self.model.generate_content(full_prompt)
            
            # The response is already JSON because of response_mime_type="application/json"
            result = json.loads(response.text)
            updates = result.get("updates", [])
            
            logger.info(f"Gemini found {len(updates)} updates in the text.")
            return updates

        except Exception as e:
            logger.error(f"Gemini analysis error: {e}")
            return []
