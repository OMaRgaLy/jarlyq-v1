#!/usr/bin/env python3
"""
tg_parser.py — парсер вакансий из Telegram каналов для Jarlyq

Pipeline:
  1. Читает список каналов из tg_channels.json
  2. Подключается к Telegram через Telethon (user account, не бот)
  3. Забирает сообщения за последние N дней
  4. Groq (Llama 3.3 70B) определяет: это вакансия? извлекает поля
  5. Сырой текст → scripts/raw/YYYY-MM-DD/tg_channelname_msgid.txt
  6. Записывает через Jarlyq Admin API

Настройка Telegram API:
  1. Зайди на https://my.telegram.org
  2. Войди своим номером телефона
  3. API development tools → создай приложение
  4. Скопируй api_id и api_hash в .env

.env:
  TG_API_ID=12345678
  TG_API_HASH=abc123def456...
  TG_PHONE=+77001234567
  GROQ_API_KEY=gsk_...
  JARLYQ_ADMIN_TOKEN=...
  JARLYQ_API_URL=http://localhost:8080

Зависимости:
  pip install telethon httpx python-dotenv groq

Использование:
  python tg_parser.py                        # все каналы
  python tg_parser.py --channel ittaldau     # один канал
  python tg_parser.py --days 3               # за последние 3 дня
  python tg_parser.py --dry-run              # без записи в БД
  python tg_parser.py --no-ai               # без Groq
"""

import argparse
import asyncio
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from telethon import TelegramClient
    from telethon.tl.types import Message
    from telethon.errors import ChannelPrivateError, UsernameNotOccupiedError
except ImportError:
    print("Установи зависимости: pip install telethon httpx python-dotenv groq")
    sys.exit(1)

try:
    import httpx
except ImportError:
    print("pip install httpx")
    sys.exit(1)

# ──────────────────────────────────────────────
# Конфиг
# ──────────────────────────────────────────────

TG_API_ID    = int(os.getenv("TG_API_ID", "0"))
TG_API_HASH  = os.getenv("TG_API_HASH", "")
TG_PHONE     = os.getenv("TG_PHONE", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
JARLYQ_API   = os.getenv("JARLYQ_API_URL", "http://localhost:8080")
JARLYQ_TOKEN = os.getenv("JARLYQ_ADMIN_TOKEN", "")

SCRIPT_DIR   = Path(__file__).parent
RAW_DIR      = SCRIPT_DIR / "raw"
CHANNELS_FILE = SCRIPT_DIR / "tg_channels.json"
SESSION_FILE = SCRIPT_DIR / "tg_session"   # Telethon сохранит сессию здесь

GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "qwen-qwq-32b",
]

# ──────────────────────────────────────────────
# Загрузка конфига каналов
# ──────────────────────────────────────────────

def load_channels() -> tuple[list[dict], dict]:
    if not CHANNELS_FILE.exists():
        print(f"❌ Файл {CHANNELS_FILE} не найден")
        sys.exit(1)
    with open(CHANNELS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return data["channels"], data.get("settings", {})


# ──────────────────────────────────────────────
# Утилиты
# ──────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Убирает лишние пробелы и эмодзи-мусор, оставляет читаемый текст."""
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]{2,}', ' ', text)
    return text.strip()


def save_raw(channel: str, msg_id: int, text: str):
    day_dir = RAW_DIR / datetime.now().strftime("%Y-%m-%d")
    day_dir.mkdir(parents=True, exist_ok=True)
    path = day_dir / f"tg_{channel}_{msg_id}.txt"
    path.write_text(text, encoding="utf-8")


def external_id(channel: str, msg_id: int) -> str:
    return f"tg:{channel}:{msg_id}"


# ──────────────────────────────────────────────
# Groq AI — классификация + NER
# ──────────────────────────────────────────────

CLASSIFY_PROMPT = """Ты парсер Telegram-сообщений для платформы вакансий.

Сообщение из канала "{channel}" (страна: {country}):
---
{text}
---

Задача:
1. Определи: это объявление о вакансии/стажировке? (is_job: true/false)
2. Если да — извлеки поля. Если нет — верни только {{"is_job": false}}

Верни ТОЛЬКО JSON:
{{
  "is_job": true,
  "type": "internship|job|grant",
  "title": "название должности",
  "company_name": "название компании или null",
  "stack": ["Python", "Django"],
  "work_format": "remote|office|hybrid|null",
  "level": "intern|junior|mid|senior|null",
  "salary_min": 0,
  "salary_max": 0,
  "salary_currency": "KZT|USD|EUR|RUB|null",
  "city": "город или null",
  "country": "{country}",
  "apply_url": "ссылка для отклика или null",
  "apply_contact": "@username или email для связи, или null",
  "deadline": "YYYY-MM-DD или null",
  "confidence": 0.85
}}

Правила:
- type=internship если: стажировка, intern, trainee, практика
- type=grant если: грант, программа, fellowship, scholarship
- stack: только технологии (Python/Go/React/...), не методологии
- salary: только числа без валюты (валюта отдельно)
- confidence: насколько уверен в данных (0.0–1.0)
- Текст может быть на русском, казахском, английском — JSON всегда на английском
- НИКАКОГО текста кроме JSON"""


def groq_classify(text: str, channel: str, country: str) -> Optional[dict]:
    if not GROQ_API_KEY:
        return None

    text_short = text[:2500]

    for model in GROQ_MODELS:
        try:
            r = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": CLASSIFY_PROMPT.format(
                        channel=channel, country=country, text=text_short
                    )}],
                    "temperature": 0.1,
                    "max_tokens": 500,
                },
                timeout=25,
            )
            if r.status_code == 200:
                content = r.json()["choices"][0]["message"]["content"].strip()
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    return json.loads(match.group())
            elif r.status_code == 429:
                print(f"  [groq rate limit] жду 10с...")
                time.sleep(10)
                continue
            else:
                print(f"  [groq {r.status_code}] {r.text[:80]}")
        except json.JSONDecodeError:
            continue
        except Exception as e:
            print(f"  [groq:{model}] {e}")
            continue

    return None


# ──────────────────────────────────────────────
# Базовая классификация без AI
# ──────────────────────────────────────────────

JOB_KEYWORDS = [
    "вакансия", "ищем", "нанимаем", "требуется", "открыта позиция",
    "стажировка", "internship", "стажёр", "trainee",
    "junior", "middle", "senior", "разработчик", "developer",
    "engineer", "программист", "frontend", "backend", "fullstack",
    "зарплата", "salary", "оклад", "офис", "remote", "удалёнка",
]

def is_job_basic(text: str) -> bool:
    text_lower = text.lower()
    hits = sum(1 for kw in JOB_KEYWORDS if kw in text_lower)
    return hits >= 2


def basic_type(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["стажировка", "стажёр", "intern", "trainee", "практика"]):
        return "internship"
    if any(w in t for w in ["грант", "grant", "fellowship", "scholarship", "программа"]):
        return "grant"
    return "job"


# ──────────────────────────────────────────────
# Запись в Jarlyq
# ──────────────────────────────────────────────

def ensure_company(name: str, country: str) -> Optional[int]:
    if not name or not JARLYQ_TOKEN:
        return None
    headers = {"Authorization": f"Bearer {JARLYQ_TOKEN}", "Content-Type": "application/json"}
    # Создаём компанию — если уже есть с таким именем, вернём существующую через внешний поиск
    # (у Telegram-вакансий нет external_id компании, поэтому ищем по имени)
    try:
        r = httpx.get(
            f"{JARLYQ_API}/api/v1/admin/companies",
            params={"limit": 200}, headers=headers, timeout=10
        )
        if r.status_code == 200:
            for c in r.json().get("companies", []):
                if c["name"].lower().strip() == name.lower().strip():
                    return c["id"]
    except Exception:
        pass

    try:
        r = httpx.post(
            f"{JARLYQ_API}/api/v1/admin/companies",
            json={"name": name, "country": country, "source": "telegram", "is_active": True},
            headers=headers, timeout=10
        )
        if r.status_code in (200, 201):
            return r.json().get("company", {}).get("id")
    except Exception:
        pass
    return None


def upsert_opportunity(opp: dict) -> str:
    """Возвращает "new" | "skip" | "error"."""
    if not JARLYQ_TOKEN:
        return "error"
    headers = {"Authorization": f"Bearer {JARLYQ_TOKEN}", "Content-Type": "application/json"}

    # Дедупликация
    try:
        r = httpx.get(
            f"{JARLYQ_API}/api/v1/admin/opportunities",
            params={"external_id": opp["external_id"]}, headers=headers, timeout=10
        )
        if r.status_code == 200 and r.json().get("opportunities"):
            return "skip"
    except Exception:
        pass

    company_id = ensure_company(opp.get("company_name", ""), opp["country"])

    payload = {
        "company_id":      company_id or 0,
        "type":            opp["type"],
        "title":           opp["title"],
        "description":     opp.get("description", ""),
        "apply_url":       opp.get("apply_url") or "",
        "source_url":      opp.get("source_url", ""),
        "level":           opp.get("level") or "",
        "salary_min":      opp.get("salary_min") or 0,
        "salary_max":      opp.get("salary_max") or 0,
        "salary_currency": opp.get("salary_currency") or "KZT",
        "work_format":     opp.get("work_format") or "",
        "city":            opp.get("city") or "",
        "country":         opp["country"],
        "source":          "telegram",
        "external_id":     opp["external_id"],
        "is_active":       True,
        "is_verified":     False,
        "needs_review":    opp.get("needs_review", False),
    }

    try:
        r = httpx.post(
            f"{JARLYQ_API}/api/v1/admin/opportunities",
            json=payload, headers=headers, timeout=10
        )
        if r.status_code in (200, 201):
            return "new"
        print(f"  [api {r.status_code}] {r.text[:100]}")
    except Exception as e:
        print(f"  [api error] {e}")
    return "error"


def post_parse_log(stats: dict):
    if not JARLYQ_TOKEN:
        return
    try:
        httpx.post(
            f"{JARLYQ_API}/api/v1/admin/parse-logs",
            json={"source": "telegram", "entity_type": "opportunity", **stats},
            headers={"Authorization": f"Bearer {JARLYQ_TOKEN}"},
            timeout=5,
        )
    except Exception:
        pass


# ──────────────────────────────────────────────
# Основная логика (async — требует Telethon)
# ──────────────────────────────────────────────

async def process_channel(
    client: TelegramClient,
    channel_cfg: dict,
    days_back: int,
    max_messages: int,
    use_ai: bool,
    dry_run: bool,
    filter_channel: Optional[str],
    stats: dict,
):
    username = channel_cfg["username"]
    country  = channel_cfg.get("country", "KZ")

    if filter_channel and username != filter_channel:
        return

    print(f"\n📡 @{username} [{country}]...")

    since = datetime.now(timezone.utc) - timedelta(days=days_back)
    processed = 0

    try:
        entity = await client.get_entity(username)
    except (ChannelPrivateError, UsernameNotOccupiedError, ValueError) as e:
        print(f"  ⚠️ Пропускаю: {e}")
        return

    async for msg in client.iter_messages(entity, limit=max_messages, offset_date=None, reverse=False):
        if not isinstance(msg, Message) or not msg.text:
            continue
        if msg.date.replace(tzinfo=timezone.utc) < since:
            break

        text = clean_text(msg.text)
        if len(text) < 80:
            continue

        stats["total_found"] += 1
        ext_id = external_id(username, msg.id)

        # Сохраняем сырой файл
        save_raw(username, msg.id, text)

        # Ссылка на сообщение
        source_url = f"https://t.me/{username}/{msg.id}"

        # AI или базовая классификация
        if use_ai:
            ai = groq_classify(text, username, country)
            time.sleep(0.5)  # пауза чтобы не упереться в rate limit Groq
        else:
            ai = None

        # Определяем — вакансия ли это
        if ai:
            if not ai.get("is_job"):
                continue
            confidence = ai.get("confidence", 1.0)
            title = ai.get("title") or _extract_title_basic(text)
            opp = {
                "external_id":   ext_id,
                "type":          ai.get("type") or basic_type(text),
                "title":         title,
                "description":   text[:1000],
                "company_name":  ai.get("company_name"),
                "stack":         ai.get("stack") or [],
                "work_format":   ai.get("work_format") or "",
                "level":         ai.get("level") or "",
                "salary_min":    ai.get("salary_min") or 0,
                "salary_max":    ai.get("salary_max") or 0,
                "salary_currency": ai.get("salary_currency") or "KZT",
                "city":          ai.get("city"),
                "country":       ai.get("country") or country,
                "apply_url":     ai.get("apply_url") or "",
                "source_url":    source_url,
                "needs_review":  confidence < 0.7,
            }
        else:
            if not is_job_basic(text):
                continue
            opp = {
                "external_id":   ext_id,
                "type":          basic_type(text),
                "title":         _extract_title_basic(text),
                "description":   text[:1000],
                "company_name":  None,
                "stack":         [],
                "work_format":   "",
                "level":         "",
                "salary_min":    0,
                "salary_max":    0,
                "salary_currency": "KZT",
                "city":          None,
                "country":       country,
                "apply_url":     "",
                "source_url":    source_url,
                "needs_review":  True,  # без AI — всегда на проверку
            }

        if dry_run:
            review = " ⚠️" if opp["needs_review"] else ""
            stacks = ", ".join(opp["stack"][:4]) if opp["stack"] else "—"
            print(f"  [dry] {opp['type']:12} | {opp.get('level',''):6} | "
                  f"стек: {stacks}{review} | {opp['title'][:55]}")
            stats["total_new"] += 1
        else:
            result = upsert_opportunity(opp)
            if result == "new":
                stats["total_new"] += 1
            elif result == "skip":
                stats["total_updated"] += 1

        processed += 1

    print(f"  Обработано: {processed}")


def _extract_title_basic(text: str) -> str:
    """Берёт первую строку как заголовок (без AI)."""
    first_line = text.split("\n")[0].strip()
    # Убираем эмодзи в начале
    first_line = re.sub(r'^[\U00010000-\U0010ffff\u2600-\u27ff\s]+', '', first_line).strip()
    return first_line[:120] or "Вакансия"


# ──────────────────────────────────────────────
# Точка входа
# ──────────────────────────────────────────────

async def run(args):
    channels, settings = load_channels()

    days_back    = args.days or settings.get("days_back", 7)
    max_messages = settings.get("max_messages_per_channel", 200)
    use_ai       = not args.no_ai

    if not TG_API_ID or not TG_API_HASH:
        print("❌ TG_API_ID и TG_API_HASH не заданы в .env")
        print("   Зайди на https://my.telegram.org → API development tools")
        sys.exit(1)

    if use_ai and not GROQ_API_KEY:
        print("⚠️  GROQ_API_KEY не задан. Запускаю без AI (--no-ai)")
        use_ai = False

    if not args.dry_run and not JARLYQ_TOKEN:
        print("❌ JARLYQ_ADMIN_TOKEN не задан. Добавь в .env или используй --dry-run")
        sys.exit(1)

    print(f"🚀 Telegram парсер | AI: {'Groq' if use_ai else 'выкл'} | "
          f"дней: {days_back} | dry-run: {args.dry_run}")

    stats = {"total_found": 0, "total_new": 0, "total_updated": 0, "total_archived": 0}

    async with TelegramClient(str(SESSION_FILE), TG_API_ID, TG_API_HASH) as client:
        await client.start(phone=TG_PHONE)
        print("✅ Telegram подключён\n")

        for ch in channels:
            await process_channel(
                client, ch, days_back, max_messages,
                use_ai, args.dry_run, args.channel, stats
            )

    print(f"\n✅ Готово:")
    print(f"   Просмотрено: {stats['total_found']}")
    print(f"   Новых:       {stats['total_new']}")
    print(f"   Уже было:    {stats['total_updated']}")
    print(f"   Сырые файлы: {RAW_DIR}/")

    if not args.dry_run:
        post_parse_log(stats)


def main():
    parser = argparse.ArgumentParser(description="Telegram → Jarlyq парсер")
    parser.add_argument("--channel", help="username одного канала (без @)")
    parser.add_argument("--days", type=int, help="за сколько дней (по умолч. из tg_channels.json)")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--no-ai", action="store_true")
    args = parser.parse_args()

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
