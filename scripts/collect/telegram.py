#!/usr/bin/env python3
"""
collect/telegram.py — парсер вакансий из Telegram-каналов (Telethon)

Читает каналы из tg_channels.json, забирает сообщения за N дней,
Groq определяет: вакансия/не вакансия, извлекает поля.

Требует: TG_API_ID, TG_API_HASH, TG_PHONE в .env
         Groq: GROQ_API_KEY (опционально, но сильно лучше)

Использование:
  python collect/telegram.py --dry-run
  python collect/telegram.py --channel ittaldau --days 3
  python collect/telegram.py --no-ai
"""

import argparse
import asyncio
import json
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import cfg

try:
    import httpx
    from telethon import TelegramClient
    from telethon.tl.types import Message
    from telethon.errors import ChannelPrivateError, UsernameNotOccupiedError
except ImportError:
    print("Установи: pip install telethon httpx python-dotenv")
    sys.exit(1)

GROQ_MODELS = ["llama-3.3-70b-versatile", "llama3-70b-8192", "qwen-qwq-32b"]

CLASSIFY_PROMPT = """Ты парсер Telegram-сообщений для платформы вакансий.

Сообщение из канала "{channel}" (страна: {country}):
---
{text}
---

1. Это объявление о вакансии/стажировке? (is_job: true/false)
2. Если да — извлеки поля. Если нет — верни только {{"is_job": false}}

ТОЛЬКО JSON:
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
  "apply_url": "ссылка для отклика или null",
  "apply_contact": "@username или null",
  "deadline": "YYYY-MM-DD или null",
  "confidence": 0.85
}}

stack — только технологии, не методологии.
type=internship если: стажировка/intern/trainee/практика.
type=grant если: грант/fellowship/scholarship/программа.
НИКАКОГО текста кроме JSON."""

JOB_KEYWORDS = [
    "вакансия", "ищем", "нанимаем", "требуется", "открыта позиция",
    "стажировка", "internship", "стажёр", "trainee",
    "junior", "middle", "senior", "разработчик", "developer",
    "engineer", "программист", "frontend", "backend", "fullstack",
    "зарплата", "salary", "оклад", "remote", "удалёнка",
]


def load_channels() -> tuple[list[dict], dict]:
    if not cfg.tg_channels_file.exists():
        print(f"Файл не найден: {cfg.tg_channels_file}")
        sys.exit(1)
    with open(cfg.tg_channels_file, encoding="utf-8") as f:
        data = json.load(f)
    return data["channels"], data.get("settings", {})


def clean_text(text: str) -> str:
    text = re.sub(r'\n{3,}', '\n\n', text)
    return re.sub(r'[ \t]{2,}', ' ', text).strip()


def is_job_basic(text: str) -> bool:
    text_lower = text.lower()
    return sum(1 for kw in JOB_KEYWORDS if kw in text_lower) >= 2


def basic_type(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["стажировка", "стажёр", "intern", "trainee", "практика"]):
        return "internship"
    if any(w in t for w in ["грант", "grant", "fellowship", "scholarship"]):
        return "grant"
    return "job"


def extract_title(text: str) -> str:
    first = text.split("\n")[0].strip()
    first = re.sub(r'^[\U00010000-\U0010ffff\u2600-\u27ff\s]+', '', first).strip()
    return first[:120] or "Вакансия"


def groq_classify(text: str, channel: str, country: str) -> dict | None:
    if not cfg.groq_api_key:
        return None
    for model in GROQ_MODELS:
        try:
            resp = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {cfg.groq_api_key}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": CLASSIFY_PROMPT.format(
                        channel=channel, country=country, text=text[:2500]
                    )}],
                    "temperature": 0.1,
                    "max_tokens": 500,
                },
                timeout=25,
            )
            if resp.status_code == 429:
                print("  [groq] rate limit, ждём 10с...")
                time.sleep(10)
                continue
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"]
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    return json.loads(match.group())
        except Exception as e:
            print(f"  [groq:{model}] {e}")
    return None


async def process_channel(
    client: TelegramClient,
    ch: dict,
    days_back: int,
    max_messages: int,
    use_ai: bool,
    dry_run: bool,
    out_file,
    stats: dict,
):
    username = ch["username"]
    country  = ch.get("country", "KZ")
    since    = datetime.now(timezone.utc) - timedelta(days=days_back)

    print(f"\n@{username} [{country}]...")

    try:
        entity = await client.get_entity(username)
    except (ChannelPrivateError, UsernameNotOccupiedError, ValueError) as e:
        print(f"  Пропускаю: {e}")
        return

    processed = 0
    async for msg in client.iter_messages(entity, limit=max_messages):
        if not isinstance(msg, Message) or not msg.text:
            continue
        if msg.date.replace(tzinfo=timezone.utc) < since:
            break

        text = clean_text(msg.text)
        if len(text) < 80:
            continue

        stats["total_found"] += 1
        source_url = f"https://t.me/{username}/{msg.id}"
        ext_id = f"tg:{username}:{msg.id}"

        if use_ai:
            ai = groq_classify(text, username, country)
            time.sleep(0.5)
        else:
            ai = None

        if ai:
            if not ai.get("is_job"):
                continue
            opp = {
                "source": "telegram",
                "external_id": ext_id,
                "type": ai.get("type") or basic_type(text),
                "title": ai.get("title") or extract_title(text),
                "description": text[:1000],
                "company_name": ai.get("company_name"),
                "stack": ai.get("stack") or [],
                "work_format": ai.get("work_format") or "",
                "level": ai.get("level") or "",
                "salary_min": ai.get("salary_min") or 0,
                "salary_max": ai.get("salary_max") or 0,
                "salary_currency": ai.get("salary_currency") or "KZT",
                "city": ai.get("city"),
                "country": ai.get("country") or country,
                "apply_url": ai.get("apply_url") or "",
                "apply_contact": ai.get("apply_contact"),
                "source_url": source_url,
                "needs_review": ai.get("confidence", 1.0) < 0.7,
                "parsed_at": datetime.utcnow().isoformat(),
            }
        else:
            if not is_job_basic(text):
                continue
            opp = {
                "source": "telegram",
                "external_id": ext_id,
                "type": basic_type(text),
                "title": extract_title(text),
                "description": text[:1000],
                "company_name": None,
                "stack": [],
                "work_format": "",
                "level": "",
                "salary_min": 0, "salary_max": 0,
                "salary_currency": "KZT",
                "city": None,
                "country": country,
                "apply_url": "",
                "source_url": source_url,
                "needs_review": True,
                "parsed_at": datetime.utcnow().isoformat(),
            }

        if dry_run:
            stacks = ", ".join(opp["stack"][:4]) or "—"
            flag = " ⚠" if opp["needs_review"] else ""
            print(f"  [dry] {opp['type']:12} {opp.get('level',''):6} | {stacks}{flag} | {opp['title'][:55]}")
        else:
            out_file.write(json.dumps(opp, ensure_ascii=False) + "\n")

        stats["total_new"] += 1
        processed += 1

    print(f"  Обработано: {processed}")


async def run_async(channel_filter: str | None, days_back: int, use_ai: bool, dry_run: bool):
    channels, settings = load_channels()
    days = days_back or settings.get("days_back", 7)
    max_msg = settings.get("max_messages_per_channel", 200)

    today = datetime.utcnow().strftime("%Y%m%d")
    stats = {"total_found": 0, "total_new": 0}

    out_path = cfg.data_raw / f"telegram_vacancies_{today}.jsonl"

    print(f"\nTelegram парсер | AI: {'Groq' if use_ai else 'выкл'} | дней: {days} | dry-run: {dry_run}")
    print(f"Каналов: {len(channels)}")

    async with TelegramClient(str(cfg.tg_session_file), cfg.tg_api_id, cfg.tg_api_hash) as client:
        await client.start(phone=cfg.tg_phone)
        print("Telegram подключён\n")

        mode = "a" if out_path.exists() else "w"
        with open(out_path, mode, encoding="utf-8") as f:
            for ch in channels:
                if channel_filter and ch["username"] != channel_filter:
                    continue
                await process_channel(client, ch, days, max_msg, use_ai, dry_run, f, stats)

    print(f"\nИтого: просмотрено={stats['total_found']}, вакансий={stats['total_new']}")
    if not dry_run:
        print(f"✓ → {out_path}")


def run(channel_filter=None, days_back=None, use_ai=True, dry_run=False):
    cfg.require("tg_api_id", "tg_api_hash", "tg_phone")
    if use_ai and not cfg.groq_api_key:
        print("GROQ_API_KEY не задан → запуск без AI")
        use_ai = False
    asyncio.run(run_async(channel_filter, days_back, use_ai, dry_run))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Telegram вакансии парсер")
    parser.add_argument("--channel", help="username одного канала (без @)")
    parser.add_argument("--days", type=int, default=None)
    parser.add_argument("--no-ai", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(
        channel_filter=args.channel,
        days_back=args.days,
        use_ai=not args.no_ai,
        dry_run=args.dry_run,
    )
