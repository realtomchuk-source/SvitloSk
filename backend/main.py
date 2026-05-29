from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SvitloSk Admin API")

# Налаштування CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # У продакшн змінити на конкретний домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ініціалізація Supabase (будемо брати з .env)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase credentials not found in environment variables!")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error connecting to Supabase: {e}")

@app.get("/")
async def root():
    return {"status": "ok", "message": "SvitloSk Admin API is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if supabase else "error"
    }

@app.get("/api/v1/stats/summary")
async def get_stats_summary():
    """Реальна статистика по роботі системи"""
    try:
        # 1. Отримуємо останні 100 логів парсера
        logs_response = supabase.table("parser_logs").select("*").order("created_at", desc=True).limit(100).execute()
        logs = logs_response.data

        if not logs:
            return {"status": "no_data", "message": "No logs found"}

        # 2. Розраховуємо показники
        total_logs = len(logs)
        errors = [l for l in logs if l.get("level") == "error" or l.get("status") == "error"]
        error_rate = (len(errors) / total_logs) * 100 if total_logs > 0 else 0
        
        # Середня швидкість (якщо є таке поле в логах)
        latencies = [l.get("duration_ms", 0) for l in logs if l.get("duration_ms")]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0

        return {
            "status": "success",
            "metrics": {
                "total_logs_analyzed": total_logs,
                "error_count": len(errors),
                "error_rate": f"{error_rate:.1f}%",
                "avg_latency_ms": f"{avg_latency:.0f}ms",
                "system_health": "stable" if error_rate < 10 else "warning"
            }
        }
    except Exception as e:
        print(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
