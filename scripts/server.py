#!/usr/bin/env python3
"""
server.py — Jarlyq Pipeline Server (FastAPI)

Управление парсерами, staging area, AI-провайдеры — всё через HTTP/WebSocket.
Запуск: python server.py  (по умолчанию порт 8082)

Эндпоинты:
  GET  /                          → статус сервера
  GET  /pipeline/sources          → список доступных источников
  POST /pipeline/run              → запустить парсер
  GET  /pipeline/jobs             → список задач
  GET  /pipeline/jobs/{id}        → статус задачи
  WS   /pipeline/jobs/{id}/logs   → стрим логов в реальном времени
  POST /pipeline/jobs/{id}/cancel → остановить задачу

  GET  /staging/records           → записи на проверку
  GET  /staging/records/{id}      → одна запись
  PUT  /staging/records/{id}      → обновить запись
  POST /staging/records/{id}/enrich     → AI-обогащение одной записи
  POST /staging/approve           → отправить записи в Go API (БД)
  DELETE /staging/records/{id}    → удалить из очереди

  GET  /ai/providers              → настроенные провайдеры
  POST /ai/providers/test         → проверить ключ
  POST /ai/enrich                 → обогатить произвольную запись

  POST /parse-url                 → распарсить URL компании → профиль

  GET  /config/env                → ключи pipeline-секции .env
  PUT  /config/env                → обновить ключи
  GET  /config/channels           → Telegram-каналы
  PUT  /config/channels           → обновить каналы
"""

import asyncio
import json
import os
import re
import sqlite3
import subprocess
import sys
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────

SCRIPTS_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPTS_DIR))
from config import cfg

DB_PATH = SCRIPTS_DIR / "data" / "staging.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

COLLECT_DIR = SCRIPTS_DIR / "collect"

SOURCES = {
    "hh_companies":  {"script": "collect/hh.py",          "label": "HH.ru — компании",         "entity": "companies", "args": ["--mode", "companies"]},
    "hh_vacancies":  {"script": "collect/hh.py",          "label": "HH.ru — вакансии",          "entity": "vacancies", "args": ["--mode", "vacancies"]},
    "habr":          {"script": "collect/habr.py",        "label": "Habr Career — компании",    "entity": "companies", "args": []},
    "djinni":        {"script": "collect/djinni.py",      "label": "Djinni — junior вакансии",  "entity": "vacancies", "args": []},
    "github":        {"script": "collect/github.py",      "label": "GitHub Organizations",      "entity": "companies", "args": []},
    "astana_hub":    {"script": "collect/astana_hub.py",  "label": "TechOrda / Alem School",    "entity": "schools",   "args": []},
    "telegram":      {"script": "collect/telegram.py",    "label": "Telegram-каналы вакансий",  "entity": "vacancies", "args": []},
}

COUNTRIES = {
    "KZ": "Казахстан", "UZ": "Узбекистан", "KG": "Кыргызстан",
    "RU": "Россия",    "BY": "Беларусь",   "AZ": "Азербайджан",
    "AM": "Армения",   "GE": "Грузия",     "TR": "Турция",
}

# Ключи .env которые разрешено редактировать через UI (не трогаем JWT, DB пароли)
EDITABLE_ENV_KEYS = {
    "GROQ_API_KEY", "GITHUB_TOKEN",
    "TG_API_ID", "TG_API_HASH", "TG_PHONE",
    "JARLYQ_API_URL", "JARLYQ_ADMIN_TOKEN",
    "ADMIN_EMAIL", "ADMIN_PASSWORD",
    "AI_PROVIDER", "OLLAMA_URL", "OLLAMA_MODEL",
    "GEMINI_API_KEY", "ANTHROPIC_API_KEY",
}

# ── Database ──────────────────────────────────────────────────────────────────

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            source TEXT NOT NULL,
            countries TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            started_at TEXT,
            finished_at TEXT,
            records_found INTEGER DEFAULT 0,
            error TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS job_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            ts TEXT NOT NULL,
            line TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS staging (
            id TEXT PRIMARY KEY,
            job_id TEXT,
            entity TEXT NOT NULL,
            source TEXT NOT NULL,
            external_id TEXT,
            data TEXT NOT NULL,
            ai_data TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            reviewed_at TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_staging_status ON staging(status)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_staging_entity ON staging(entity)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_job_logs_job ON job_logs(job_id)")
    conn.commit()
    conn.close()


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Job runner ────────────────────────────────────────────────────────────────

# job_id → {"process": Popen, "logs": [str], "subscribers": [asyncio.Queue]}
_jobs: dict[str, dict] = {}


async def run_job(job_id: str, source: str, countries: list[str], dry_run: bool):
    src = SOURCES[source]
    script = SCRIPTS_DIR / src["script"]
    entity = src["entity"]

    args = [sys.executable, str(script)] + src["args"]
    if countries and "--countries" not in src["args"]:
        args += ["--countries"] + countries
    elif countries:
        args += countries
    if dry_run:
        args.append("--dry-run")

    # Запись в БД
    with db() as conn:
        conn.execute(
            "UPDATE jobs SET status='running', started_at=? WHERE id=?",
            (datetime.utcnow().isoformat(), job_id)
        )
        conn.commit()

    _jobs[job_id] = {"logs": [], "subscribers": [], "process": None}

    def add_log(line: str):
        ts = datetime.utcnow().isoformat()
        _jobs[job_id]["logs"].append({"ts": ts, "line": line})
        with db() as conn:
            conn.execute("INSERT INTO job_logs(job_id, ts, line) VALUES(?,?,?)", (job_id, ts, line))
            conn.commit()
        # Отправляем всем WebSocket подписчикам
        for q in _jobs[job_id]["subscribers"]:
            asyncio.get_event_loop().call_soon_threadsafe(q.put_nowait, {"ts": ts, "line": line})

    add_log(f"▶ Запуск: {' '.join(str(a) for a in args)}")

    try:
        env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}
        proc = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=SCRIPTS_DIR,
            env=env,
        )
        _jobs[job_id]["process"] = proc

        async for raw in proc.stdout:
            line = raw.decode("utf-8", errors="replace").rstrip()
            add_log(line)

        await proc.wait()
        status = "done" if proc.returncode == 0 else "error"
        error = None if proc.returncode == 0 else f"exit code {proc.returncode}"
    except Exception as e:
        status = "error"
        error = str(e)
        add_log(f"✗ Ошибка: {e}")

    add_log(f"■ Завершено: {status}")

    # Загружаем свежие JSONL в staging
    if status == "done" and not dry_run:
        records_found = await load_raw_to_staging(job_id, entity)
    else:
        records_found = 0

    with db() as conn:
        conn.execute(
            "UPDATE jobs SET status=?, finished_at=?, records_found=?, error=? WHERE id=?",
            (status, datetime.utcnow().isoformat(), records_found, error, job_id)
        )
        conn.commit()

    # Сигнализируем конец всем подписчикам
    for q in _jobs[job_id]["subscribers"]:
        q.put_nowait(None)


async def load_raw_to_staging(job_id: str, entity: str) -> int:
    """Загружает последние JSONL файлы из data/raw в staging."""
    today = datetime.utcnow().strftime("%Y%m%d")
    patterns = {
        "companies": [f"hh_companies_*_{today}.jsonl", f"habr_companies_*_{today}.jsonl",
                      f"djinni_companies_{today}.jsonl", f"github_orgs_*_{today}.jsonl",
                      f"astana_hub_companies_{today}.jsonl"],
        "schools":   [f"astana_hub_schools_{today}.jsonl"],
        "vacancies": [f"hh_vacancies_*_{today}.jsonl", f"telegram_vacancies_{today}.jsonl",
                      f"djinni_vacancies_{today}.jsonl"],
    }

    total = 0
    for pattern in patterns.get(entity, []):
        for fpath in cfg.data_raw.glob(pattern):
            with open(fpath, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        record = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    # Дедупликация по external_id
                    ext_id = record.get("external_id", "")
                    with db() as conn:
                        if ext_id:
                            exists = conn.execute(
                                "SELECT id FROM staging WHERE external_id=?", (ext_id,)
                            ).fetchone()
                            if exists:
                                continue
                        conn.execute(
                            """INSERT INTO staging(id, job_id, entity, source, external_id, data, status, created_at)
                               VALUES(?,?,?,?,?,?,?,?)""",
                            (str(uuid.uuid4()), job_id, entity,
                             record.get("source", "unknown"), ext_id,
                             json.dumps(record, ensure_ascii=False),
                             "pending", datetime.utcnow().isoformat())
                        )
                        conn.commit()
                    total += 1

    return total


# ── AI providers ──────────────────────────────────────────────────────────────

ENRICH_PROMPT = """Обогати профиль компании/школы. Верни ТОЛЬКО JSON с полями:
industry, work_formats, has_internship, description_ru, stack, size_category.

Профиль:
{data}

industry: IT|Fintech|Edtech|Gaming|Telecom|Cybersecurity|E-commerce|Consulting|Outsourcing|AI/ML|Blockchain|Healthtech|Logistics|Other
work_formats: список из [remote, hybrid, office]
size_category: startup|small|medium|large|enterprise
description_ru: 2-3 предложения на русском
stack: список технологий если можно определить
ТОЛЬКО JSON."""

GROQ_MODELS = ["llama-3.3-70b-versatile", "llama3-70b-8192"]


async def ai_enrich(record: dict) -> dict | None:
    provider = os.getenv("AI_PROVIDER", "groq").lower()
    data_short = {k: v for k, v in record.items()
                  if k in ("name", "description", "industry", "stack", "country",
                           "employee_count", "website", "has_internship", "work_formats")}
    prompt = ENRICH_PROMPT.format(data=json.dumps(data_short, ensure_ascii=False, indent=2))

    if provider == "groq" and cfg.groq_api_key:
        return await _groq_complete(prompt)
    elif provider == "gemini" and os.getenv("GEMINI_API_KEY"):
        return await _gemini_complete(prompt)
    elif provider == "ollama":
        return await _ollama_complete(prompt)
    elif cfg.groq_api_key:
        return await _groq_complete(prompt)
    return None


async def _groq_complete(prompt: str) -> dict | None:
    for model in GROQ_MODELS:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {cfg.groq_api_key}"},
                    json={"model": model, "messages": [{"role": "user", "content": prompt}],
                          "temperature": 0.2, "max_tokens": 512},
                )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"].strip()
                return _extract_json(content)
        except Exception:
            continue
    return None


async def _gemini_complete(prompt: str) -> dict | None:
    api_key = os.getenv("GEMINI_API_KEY", "")
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": api_key},
                json={"contents": [{"parts": [{"text": prompt}]}],
                      "generationConfig": {"temperature": 0.2, "maxOutputTokens": 512}},
            )
        if resp.status_code == 200:
            text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            return _extract_json(text)
    except Exception:
        pass
    return None


async def _ollama_complete(prompt: str) -> dict | None:
    url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "qwen3:8b")
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{url}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
            )
        if resp.status_code == 200:
            return _extract_json(resp.json().get("response", ""))
    except Exception:
        pass
    return None


def _extract_json(text: str) -> dict | None:
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1].lstrip("json").strip() if len(parts) > 1 else text
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None


# ── URL parser ────────────────────────────────────────────────────────────────

URL_PARSE_PROMPT = """Ты парсер корпоративных сайтов.
Извлеки информацию о компании из текста страницы и верни ТОЛЬКО JSON:
{{
  "name": "название компании",
  "description": "краткое описание (2-3 предложения)",
  "description_ru": "описание на русском",
  "industry": "сфера деятельности",
  "stack": ["технологии из раздела вакансий если есть"],
  "has_internship": true/false,
  "work_formats": ["remote|hybrid|office"],
  "employee_count": "размер компании если указан",
  "website": "{url}",
  "country": "страна"
}}

Текст страницы (до 4000 символов):
{text}

ТОЛЬКО JSON."""


async def parse_url(url: str) -> dict:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=20) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(400, f"Сайт вернул {resp.status_code}")
    except httpx.RequestError as e:
        raise HTTPException(400, f"Не удалось подключиться: {e}")

    # Чистим HTML
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    text = re.sub(r'\s{2,}', ' ', soup.get_text(" ", strip=True))[:4000]

    prompt = URL_PARSE_PROMPT.format(url=url, text=text)
    result = None
    if cfg.groq_api_key:
        result = await _groq_complete(prompt)
    if not result and os.getenv("GEMINI_API_KEY"):
        result = await _gemini_complete(prompt)
    if not result and os.getenv("OLLAMA_URL"):
        result = await _ollama_complete(prompt)

    if not result:
        raise HTTPException(422, "AI не смог распарсить страницу. Проверь GROQ_API_KEY в .env")

    result["source_url"] = url
    result["source"] = "manual_url"
    result["external_id"] = f"url:{re.sub(r'[^a-z0-9]', '-', url.lower())[:60]}"
    result["parsed_at"] = datetime.utcnow().isoformat()
    result["needs_review"] = True
    return result


# ── ENV editor ────────────────────────────────────────────────────────────────

ENV_FILE = SCRIPTS_DIR.parent / ".env"


def read_env() -> dict[str, str]:
    result = {}
    if not ENV_FILE.exists():
        return result
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        if key in EDITABLE_ENV_KEYS:
            result[key] = val.strip()
    return result


def write_env_keys(updates: dict[str, str]):
    """Обновляет только разрешённые ключи в .env, не трогает остальные."""
    content = ENV_FILE.read_text(encoding="utf-8") if ENV_FILE.exists() else ""
    lines = content.splitlines()
    updated_keys = set()

    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key = stripped.partition("=")[0].strip()
            if key in updates and key in EDITABLE_ENV_KEYS:
                new_lines.append(f"{key}={updates[key]}")
                updated_keys.add(key)
                continue
        new_lines.append(line)

    # Добавляем новые ключи которых не было в файле
    for key, val in updates.items():
        if key not in updated_keys and key in EDITABLE_ENV_KEYS:
            new_lines.append(f"{key}={val}")

    ENV_FILE.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


# ── FastAPI app ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Jarlyq Pipeline Server", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8082"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────

class RunRequest(BaseModel):
    source: str
    countries: list[str] = ["KZ"]
    dry_run: bool = False


class UpdateRecordRequest(BaseModel):
    data: dict


class ApproveRequest(BaseModel):
    ids: list[str]


class EnvUpdateRequest(BaseModel):
    keys: dict[str, str]


class ChannelsUpdateRequest(BaseModel):
    channels: list[dict]
    settings: dict = {}


class AIEnrichRequest(BaseModel):
    record: dict
    provider: str = "auto"


class ParseURLRequest(BaseModel):
    url: str


class TestProviderRequest(BaseModel):
    provider: str


# ── Routes: status ────────────────────────────────────────────────────────────

@app.get("/")
async def status():
    with db() as conn:
        total_staging = conn.execute("SELECT COUNT(*) FROM staging WHERE status='pending'").fetchone()[0]
        total_jobs    = conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
    return {
        "status": "ok",
        "version": "1.0",
        "staging_pending": total_staging,
        "total_jobs": total_jobs,
        "ai_provider": os.getenv("AI_PROVIDER", "groq"),
        "groq_configured": bool(cfg.groq_api_key),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        "ollama_configured": bool(os.getenv("OLLAMA_URL")),
        "github_configured": bool(cfg.github_token),
        "telegram_configured": bool(cfg.tg_api_id and cfg.tg_api_hash),
    }


# ── Routes: pipeline ──────────────────────────────────────────────────────────

@app.get("/pipeline/sources")
async def list_sources():
    return [
        {"id": sid, "label": s["label"], "entity": s["entity"]}
        for sid, s in SOURCES.items()
    ]


@app.get("/pipeline/countries")
async def list_countries():
    return [{"code": code, "name": name} for code, name in COUNTRIES.items()]


@app.post("/pipeline/run")
async def start_job(req: RunRequest):
    if req.source not in SOURCES:
        raise HTTPException(400, f"Неизвестный источник: {req.source}")

    job_id = str(uuid.uuid4())
    with db() as conn:
        conn.execute(
            "INSERT INTO jobs(id, source, countries, status) VALUES(?,?,?,?)",
            (job_id, req.source, ",".join(req.countries), "pending")
        )
        conn.commit()

    asyncio.create_task(run_job(job_id, req.source, req.countries, req.dry_run))
    return {"job_id": job_id, "status": "started"}


@app.get("/pipeline/jobs")
async def list_jobs(limit: int = 50):
    with db() as conn:
        rows = conn.execute(
            "SELECT * FROM jobs ORDER BY rowid DESC LIMIT ?", (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/pipeline/jobs/{job_id}")
async def get_job(job_id: str):
    with db() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Задача не найдена")
    return dict(row)


@app.post("/pipeline/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    job = _jobs.get(job_id)
    if job and job.get("process"):
        job["process"].terminate()
        with db() as conn:
            conn.execute("UPDATE jobs SET status='cancelled', finished_at=? WHERE id=?",
                         (datetime.utcnow().isoformat(), job_id))
            conn.commit()
        return {"status": "cancelled"}
    raise HTTPException(404, "Задача не найдена или уже завершена")


@app.websocket("/pipeline/jobs/{job_id}/logs")
async def job_logs_ws(websocket: WebSocket, job_id: str):
    await websocket.accept()

    # Сначала отдаём уже накопленные логи из БД
    with db() as conn:
        old_logs = conn.execute(
            "SELECT ts, line FROM job_logs WHERE job_id=? ORDER BY id", (job_id,)
        ).fetchall()

    for row in old_logs:
        await websocket.send_json({"ts": row["ts"], "line": row["line"]})

    # Если задача ещё работает — подписываемся на новые логи
    job = _jobs.get(job_id)
    if not job:
        await websocket.close()
        return

    q: asyncio.Queue = asyncio.Queue()
    job["subscribers"].append(q)

    try:
        while True:
            msg = await asyncio.wait_for(q.get(), timeout=60)
            if msg is None:  # сигнал конца
                break
            await websocket.send_json(msg)
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    finally:
        if q in job["subscribers"]:
            job["subscribers"].remove(q)
        await websocket.close()


# ── Routes: staging ───────────────────────────────────────────────────────────

@app.get("/staging/records")
async def list_staging(
    entity: str = None,
    source: str = None,
    status: str = "pending",
    needs_review: bool = None,
    limit: int = 50,
    offset: int = 0,
):
    conditions = ["s.status = ?"]
    params: list[Any] = [status]

    if entity:
        conditions.append("s.entity = ?"); params.append(entity)
    if source:
        conditions.append("s.source = ?"); params.append(source)
    if needs_review is not None:
        flag = "1" if needs_review else "0"
        conditions.append(f"json_extract(s.data, '$.needs_review') = {flag}")

    where = " AND ".join(conditions)
    with db() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM staging s WHERE {where}", params).fetchone()[0]
        rows  = conn.execute(
            f"SELECT * FROM staging s WHERE {where} ORDER BY s.rowid DESC LIMIT ? OFFSET ?",
            params + [limit, offset]
        ).fetchall()

    records = []
    for r in rows:
        rec = dict(r)
        rec["data"]    = json.loads(rec["data"])
        rec["ai_data"] = json.loads(rec["ai_data"]) if rec["ai_data"] else None
        records.append(rec)

    return {"total": total, "records": records}


@app.get("/staging/records/{record_id}")
async def get_staging_record(record_id: str):
    with db() as conn:
        row = conn.execute("SELECT * FROM staging WHERE id=?", (record_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Запись не найдена")
    rec = dict(row)
    rec["data"]    = json.loads(rec["data"])
    rec["ai_data"] = json.loads(rec["ai_data"]) if rec["ai_data"] else None
    return rec


@app.put("/staging/records/{record_id}")
async def update_staging_record(record_id: str, req: UpdateRecordRequest):
    with db() as conn:
        row = conn.execute("SELECT id FROM staging WHERE id=?", (record_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Запись не найдена")
        conn.execute(
            "UPDATE staging SET data=?, reviewed_at=? WHERE id=?",
            (json.dumps(req.data, ensure_ascii=False), datetime.utcnow().isoformat(), record_id)
        )
        conn.commit()
    return {"status": "ok"}


@app.post("/staging/records/{record_id}/enrich")
async def enrich_staging_record(record_id: str):
    with db() as conn:
        row = conn.execute("SELECT * FROM staging WHERE id=?", (record_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Запись не найдена")

    record = json.loads(row["data"])
    ai_result = await ai_enrich(record)
    if not ai_result:
        raise HTTPException(422, "AI не вернул результат. Проверь ключи в .env")

    with db() as conn:
        conn.execute(
            "UPDATE staging SET ai_data=? WHERE id=?",
            (json.dumps(ai_result, ensure_ascii=False), record_id)
        )
        conn.commit()

    return {"status": "ok", "ai_data": ai_result}


@app.post("/staging/approve")
async def approve_records(req: ApproveRequest):
    if not req.ids:
        raise HTTPException(400, "Список ids пустой")

    results = {"approved": [], "errors": []}
    jarlyq_url = cfg.jarlyq_api_url
    token = cfg.jarlyq_admin_token

    if not token and cfg.admin_email:
        # Получаем токен
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{jarlyq_url}/auth/login",
                    json={"email": cfg.admin_email, "password": cfg.admin_password}
                )
            token = resp.json().get("accessToken") or resp.json().get("token", "")
        except Exception as e:
            raise HTTPException(500, f"Не удалось авторизоваться в Jarlyq API: {e}")

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    with db() as conn:
        for record_id in req.ids:
            row = conn.execute("SELECT * FROM staging WHERE id=?", (record_id,)).fetchone()
            if not row:
                results["errors"].append({"id": record_id, "error": "не найдено"})
                continue

            data = json.loads(row["data"])
            ai  = json.loads(row["ai_data"]) if row["ai_data"] else {}
            entity = row["entity"]

            # Мёржим AI поверх базовых данных
            merged = data.copy()
            for key in ("industry", "work_formats", "has_internship", "stack", "size_category"):
                if ai.get(key) and not merged.get(key):
                    merged[key] = ai[key]
            if ai.get("description_ru"):
                merged["description"] = ai["description_ru"]

            # Маппинг в формат Go API
            if entity == "companies":
                payload = _map_company(merged)
                endpoint = f"{jarlyq_url}/admin/companies"
            elif entity == "schools":
                payload = _map_school(merged)
                endpoint = f"{jarlyq_url}/admin/schools"
            elif entity == "vacancies":
                payload = _map_vacancy(merged)
                endpoint = f"{jarlyq_url}/admin/opportunities"
            else:
                results["errors"].append({"id": record_id, "error": f"неизвестный entity: {entity}"})
                continue

            try:
                async with httpx.AsyncClient(timeout=15) as client:
                    resp = await client.post(endpoint, json=payload, headers=headers)
                if resp.status_code in (200, 201):
                    conn.execute("UPDATE staging SET status='approved', reviewed_at=? WHERE id=?",
                                 (datetime.utcnow().isoformat(), record_id))
                    results["approved"].append(record_id)
                else:
                    results["errors"].append({"id": record_id, "error": f"{resp.status_code}: {resp.text[:100]}"})
            except Exception as e:
                results["errors"].append({"id": record_id, "error": str(e)})

        conn.commit()

    return results


@app.delete("/staging/records/{record_id}")
async def delete_staging_record(record_id: str):
    with db() as conn:
        conn.execute("DELETE FROM staging WHERE id=?", (record_id,))
        conn.commit()
    return {"status": "ok"}


def _map_company(d: dict) -> dict:
    fmts = d.get("work_formats", [])
    return {
        "name": d.get("name", ""), "description": d.get("description", ""),
        "logoUrl": d.get("logo_url", ""), "website": d.get("website", ""),
        "country": d.get("country", ""), "industry": d.get("industry", "IT"),
        "employeeCount": str(d.get("employee_count") or ""),
        "isRemote": "remote" in fmts, "isHybrid": "hybrid" in fmts,
        "isOffice": "office" in fmts or not fmts,
        "hasInternship": d.get("has_internship", False),
        "isActive": True, "isVerified": False,
        "stacks": d.get("stack", []),
        "externalId": d.get("external_id", ""),
        "openVacancies": d.get("open_vacancies", 0),
    }


def _map_school(d: dict) -> dict:
    return {
        "name": d.get("name", ""), "description": d.get("description", ""),
        "logoUrl": d.get("logo_url", ""), "website": d.get("website", ""),
        "country": d.get("country", "KZ"), "city": d.get("city", ""),
        "type": d.get("type", "center"),
        "isOnline": d.get("is_online", True), "isFree": d.get("is_free", False),
        "hasInternship": d.get("has_internship", False),
        "isActive": True, "isVerified": False,
        "stacks": d.get("stack", []),
        "externalId": d.get("external_id", ""),
    }


def _map_vacancy(d: dict) -> dict:
    return {
        "type": d.get("type", "job"), "title": d.get("title", ""),
        "description": d.get("description", ""),
        "applyUrl": d.get("apply_url", ""), "sourceUrl": d.get("source_url", ""),
        "level": d.get("level", ""), "workFormat": d.get("work_format", ""),
        "salaryMin": d.get("salary_min") or 0, "salaryMax": d.get("salary_max") or 0,
        "salaryCurrency": d.get("salary_currency", "KZT"),
        "city": d.get("city", ""), "country": d.get("country", ""),
        "source": d.get("source", ""), "externalId": d.get("external_id", ""),
        "isActive": True, "isVerified": False,
        "needsReview": d.get("needs_review", True),
        "stacks": d.get("stack", []),
    }


# ── Routes: AI ────────────────────────────────────────────────────────────────

@app.get("/ai/providers")
async def list_providers():
    providers = [
        {
            "id": "groq",
            "name": "Groq (LLaMA-3.3 70B)",
            "configured": bool(cfg.groq_api_key),
            "active": os.getenv("AI_PROVIDER", "groq") == "groq",
            "free": True,
            "note": "Бесплатно, 30 req/min. console.groq.com",
        },
        {
            "id": "gemini",
            "name": "Google Gemini",
            "configured": bool(os.getenv("GEMINI_API_KEY")),
            "active": os.getenv("AI_PROVIDER") == "gemini",
            "free": True,
            "note": "Бесплатный тир. aistudio.google.com",
        },
        {
            "id": "ollama",
            "name": f"Ollama ({os.getenv('OLLAMA_MODEL', 'qwen3:8b')})",
            "configured": bool(os.getenv("OLLAMA_URL")),
            "active": os.getenv("AI_PROVIDER") == "ollama",
            "free": True,
            "note": "Локальная модель. ollama.com",
        },
    ]
    return providers


@app.post("/ai/providers/test")
async def test_provider(req: TestProviderRequest):
    """Проверяет связь с AI провайдером — просто пингует, не требует JSON в ответе."""
    if req.provider == "groq":
        if not cfg.groq_api_key:
            raise HTTPException(400, "GROQ_API_KEY не задан в .env")
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {cfg.groq_api_key}"},
                    json={"model": GROQ_MODELS[0], "messages": [{"role": "user", "content": "Hi"}],
                          "max_tokens": 5},
                )
            if resp.status_code != 200:
                raise HTTPException(400, f"Groq вернул {resp.status_code}: {resp.text[:200]}")
        except httpx.TimeoutException:
            raise HTTPException(400, "Groq не ответил за 15 сек (timeout)")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(400, f"Ошибка соединения с Groq: {e}")

    elif req.provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise HTTPException(400, "GEMINI_API_KEY не задан в .env")
        model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                    params={"key": api_key},
                    json={"contents": [{"parts": [{"text": "Hi"}]}],
                          "generationConfig": {"maxOutputTokens": 5}},
                )
            if resp.status_code != 200:
                raise HTTPException(400, f"Gemini вернул {resp.status_code}: {resp.text[:200]}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(400, f"Ошибка соединения с Gemini: {e}")

    elif req.provider == "ollama":
        url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        if not url:
            raise HTTPException(400, "OLLAMA_URL не задан в .env")
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{url}/api/tags")
            if resp.status_code != 200:
                raise HTTPException(400, f"Ollama не отвечает: {resp.status_code}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(400, f"Ollama недоступен по {url}: {e}")
    else:
        raise HTTPException(400, f"Неизвестный провайдер: {req.provider}")

    return {"status": "ok", "provider": req.provider}


@app.post("/ai/enrich")
async def enrich_record(req: AIEnrichRequest):
    result = await ai_enrich(req.record)
    if not result:
        raise HTTPException(422, "AI не вернул результат")
    return result


# ── Routes: parse-url ─────────────────────────────────────────────────────────

@app.post("/parse-url")
async def parse_company_url(req: ParseURLRequest):
    result = await parse_url(req.url)

    # Добавляем в staging сразу
    record_id = str(uuid.uuid4())
    with db() as conn:
        conn.execute(
            """INSERT INTO staging(id, job_id, entity, source, external_id, data, status, created_at)
               VALUES(?,?,?,?,?,?,?,?)""",
            (record_id, None, "companies", "manual_url",
             result.get("external_id", ""),
             json.dumps(result, ensure_ascii=False),
             "pending", datetime.utcnow().isoformat())
        )
        conn.commit()

    return {"record_id": record_id, "data": result}


# ── Routes: config ────────────────────────────────────────────────────────────

@app.get("/config/env")
async def get_env():
    keys = read_env()
    # Скрываем значения ключей (показываем только: задан/не задан + первые 4 символа)
    safe = {}
    for key, val in keys.items():
        if val:
            safe[key] = {"set": True, "preview": val[:4] + "..." if len(val) > 4 else "***"}
        else:
            safe[key] = {"set": False, "preview": ""}
    # Добавляем незаполненные
    for key in EDITABLE_ENV_KEYS:
        if key not in safe:
            safe[key] = {"set": False, "preview": ""}
    return safe


@app.put("/config/env")
async def update_env(req: EnvUpdateRequest):
    forbidden = [k for k in req.keys if k not in EDITABLE_ENV_KEYS]
    if forbidden:
        raise HTTPException(400, f"Нельзя изменить: {forbidden}")
    write_env_keys(req.keys)
    # Перечитываем конфиг
    from importlib import reload
    import config as cfg_module
    reload(cfg_module)
    return {"status": "ok", "updated": list(req.keys.keys())}


@app.get("/config/channels")
async def get_channels():
    if not cfg.tg_channels_file.exists():
        return {"channels": [], "settings": {}}
    with open(cfg.tg_channels_file, encoding="utf-8") as f:
        return json.load(f)


@app.put("/config/channels")
async def update_channels(req: ChannelsUpdateRequest):
    data = {"channels": req.channels, "settings": req.settings,
            "_comment": "Добавляй каналы: username без @ или полная ссылка t.me/..."}
    with open(cfg.tg_channels_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return {"status": "ok", "count": len(req.channels)}


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Jarlyq Pipeline Server")
    parser.add_argument("--port", type=int, default=8082)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--reload", action="store_true", help="Авто-перезагрузка при изменении файлов")
    args = parser.parse_args()

    print(f"\nJarlyq Pipeline Server")
    print(f"  URL:     http://{args.host}:{args.port}")
    print(f"  Docs:    http://{args.host}:{args.port}/docs")
    print(f"  Staging: {DB_PATH}")
    print(f"  .env:    {ENV_FILE}\n")

    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )
