#!/usr/bin/env python3
"""
hh_parser.py — парсер вакансий с hh.ru для Jarlyq

Pipeline:
  1. Забирает вакансии через hh.ru API (KZ / UZ / KG)
  2. Полное описание вакансии очищается от HTML
  3. Groq (Llama 3.3 70B) извлекает стек, уровень, формат — NER
  4. Если confidence < 0.7 → помечается needs_review в Admin API
  5. Сырой текст сохраняется в scripts/raw/ (не в БД)

Зависимости:
  pip install httpx python-dotenv groq

.env:
  GROQ_API_KEY=...
  JARLYQ_ADMIN_TOKEN=...
  JARLYQ_API_URL=http://localhost:8080   # опционально

Использование:
  python hh_parser.py --dry-run              # только вывод, без записи
  python hh_parser.py --country KZ           # одна страна
  python hh_parser.py --type internship      # только стажировки
  python hh_parser.py --no-ai               # без Groq, только базовая нормализация
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    import httpx
except ImportError:
    print("pip install httpx python-dotenv groq")
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ──────────────────────────────────────────────
# Конфиг
# ──────────────────────────────────────────────

HH_BASE        = "https://api.hh.ru"
HH_UA          = "Jarlyq/1.0 (jarlyq.kz)"
JARLYQ_API     = os.getenv("JARLYQ_API_URL", "http://localhost:8080")
JARLYQ_TOKEN   = os.getenv("JARLYQ_ADMIN_TOKEN", "")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
RAW_DIR        = Path(__file__).parent / "raw"

COUNTRY_AREA = {"KZ": 40, "UZ": 97, "KG": 48}
IT_SPECS     = ["1", "3"]   # IT + Телеком на hh.ru
MAX_PAGES    = 20
DELAY        = 0.25         # пауза между запросами

# Groq модели по приоритету (fallback если одна недоступна)
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "qwen-qwq-32b",
]

# ──────────────────────────────────────────────
# Утилиты
# ──────────────────────────────────────────────

def clean_html(text: str) -> str:
    """Убирает HTML-теги, оставляет чистый текст."""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&[a-z]+;', '', text)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()


def save_raw(source: str, ext_id: str, content: str):
    """Сохраняет сырой текст в scripts/raw/YYYY-MM-DD/source_id.txt"""
    day_dir = RAW_DIR / datetime.now().strftime("%Y-%m-%d")
    day_dir.mkdir(parents=True, exist_ok=True)
    path = day_dir / f"{source}_{ext_id}.txt"
    path.write_text(content, encoding="utf-8")


def hh_get(path: str, params: dict = None) -> dict:
    """GET к hh.ru API с retry."""
    for attempt in range(3):
        try:
            r = httpx.get(
                f"{HH_BASE}{path}", params=params,
                headers={"User-Agent": HH_UA, "Accept": "application/json"},
                timeout=15,
            )
            if r.status_code == 429:
                time.sleep(3)
                continue
            r.raise_for_status()
            return r.json()
        except httpx.RequestError as e:
            if attempt == 2:
                raise
            time.sleep(1 + attempt)
    return {}


# ──────────────────────────────────────────────
# Groq AI нормализатор
# ──────────────────────────────────────────────

EXTRACT_PROMPT = """Ты — парсер вакансий. Извлеки данные из текста и верни ТОЛЬКО JSON.

Текст вакансии:
{text}

Верни строго этот JSON (null если не найдено):
{{
  "stack": ["Python", "Django"],
  "work_format": "remote|office|hybrid|null",
  "level": "intern|junior|mid|senior|null",
  "salary_min": 0,
  "salary_max": 0,
  "salary_currency": "KZT|USD|EUR|RUB|null",
  "employment_type": "full|part|contract|null",
  "confidence": 0.85
}}

Правила:
- stack: только реальные технологии (Python, Go, React, PostgreSQL и т.д.), не методологии
- confidence: 0.0–1.0, насколько уверен в извлечённых данных
- Если текст на русском/казахском — всё равно верни JSON на английском
- НИКАКОГО текста кроме JSON"""


def groq_extract(text: str) -> Optional[dict]:
    """Запрашивает Groq для NER из текста вакансии."""
    if not GROQ_API_KEY:
        return None

    # Обрезаем текст — не нужно слать 10к токенов
    text_short = text[:3000]

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
                    "messages": [
                        {"role": "user", "content": EXTRACT_PROMPT.format(text=text_short)}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 400,
                },
                timeout=20,
            )
            if r.status_code == 200:
                content = r.json()["choices"][0]["message"]["content"].strip()
                # Вырезаем JSON если модель добавила лишнее
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    return json.loads(match.group())
            elif r.status_code == 429:
                time.sleep(5)
                continue
        except Exception as e:
            print(f"  [groq:{model}] ошибка: {e}")
            continue

    return None


# ──────────────────────────────────────────────
# Базовая нормализация (без AI)
# ──────────────────────────────────────────────

def base_work_format(item: dict) -> str:
    sid = item.get("schedule", {}).get("id", "")
    if sid in ("remote", "flyInFlyOut"):
        return "remote"
    if sid == "flexible":
        return "hybrid"
    return "office"


def base_level(item: dict) -> str:
    mapping = {
        "noExperience": "intern",
        "between1And3": "junior",
        "between3And6": "mid",
        "moreThan6": "senior",
    }
    return mapping.get(item.get("experience", {}).get("id", ""), "")


def base_type(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ["стажир", "intern", "trainee", "практик"]):
        return "internship"
    return "job"


def base_salary(item: dict) -> tuple:
    sal = item.get("salary") or {}
    return sal.get("from"), sal.get("to"), sal.get("currency", "KZT")


# ──────────────────────────────────────────────
# Получение полного описания вакансии
# ──────────────────────────────────────────────

def fetch_vacancy_detail(vac_id: str) -> str:
    """Загружает полное описание вакансии и возвращает чистый текст."""
    try:
        data = hh_get(f"/vacancies/{vac_id}")
        raw_html = data.get("description", "")
        return clean_html(raw_html)
    except Exception:
        return ""


# ──────────────────────────────────────────────
# Сборка финального объекта
# ──────────────────────────────────────────────

def build_opportunity(item: dict, country: str, full_text: str, ai: Optional[dict], force_type: Optional[str]) -> dict:
    """Собирает нормализованный объект вакансии."""
    sal_min, sal_max, currency = base_salary(item)
    employer = item.get("employer", {})

    opp = {
        "title":           item.get("name", ""),
        "type":            force_type or base_type(item.get("name", "")),
        "apply_url":       item.get("alternate_url", ""),
        "source_url":      item.get("alternate_url", ""),
        "level":           base_level(item),
        "salary_min":      sal_min or 0,
        "salary_max":      sal_max or 0,
        "salary_currency": currency,
        "work_format":     base_work_format(item),
        "city":            item.get("area", {}).get("name", ""),
        "country":         country,
        "source":          "hh",
        "external_id":     f"hh:{item['id']}",
        "is_active":       True,
        "is_verified":     False,
        "needs_review":    False,
        "company_name":    employer.get("name", ""),
        "company_hh_id":   str(employer.get("id", "")),
        "company_logo":    (employer.get("logo_urls") or {}).get("90"),
        "stack":           [],
    }

    # Обогащаем данными от AI
    if ai:
        confidence = ai.get("confidence", 1.0)
        if confidence < 0.7:
            opp["needs_review"] = True

        if ai.get("stack"):
            opp["stack"] = ai["stack"]
        if ai.get("work_format") and ai["work_format"] != "null":
            opp["work_format"] = ai["work_format"]
        if ai.get("level") and ai["level"] != "null":
            opp["level"] = ai["level"]
        if ai.get("salary_min") and not sal_min:
            opp["salary_min"] = ai["salary_min"]
        if ai.get("salary_max") and not sal_max:
            opp["salary_max"] = ai["salary_max"]
        if ai.get("salary_currency") and ai["salary_currency"] not in (None, "null"):
            opp["salary_currency"] = ai["salary_currency"]

    return opp


# ──────────────────────────────────────────────
# Запись в Jarlyq Admin API
# ──────────────────────────────────────────────

def ensure_company(name: str, country: str, logo: Optional[str], hh_id: str) -> Optional[int]:
    if not name:
        return None
    headers = {"Authorization": f"Bearer {JARLYQ_TOKEN}", "Content-Type": "application/json"}
    ext_id = f"hh:employer:{hh_id}"

    # Поиск существующей
    try:
        r = httpx.get(f"{JARLYQ_API}/api/v1/admin/companies",
                      params={"external_id": ext_id}, headers=headers, timeout=10)
        if r.status_code == 200:
            companies = r.json().get("companies", [])
            if companies:
                return companies[0]["id"]
    except Exception:
        pass

    # Создание
    payload = {"name": name, "country": country, "source": "hh",
               "is_active": True, "external_id": ext_id}
    if logo:
        payload["logo_url"] = logo
    try:
        r = httpx.post(f"{JARLYQ_API}/api/v1/admin/companies",
                       json=payload, headers=headers, timeout=10)
        if r.status_code in (200, 201):
            return r.json().get("company", {}).get("id")
    except Exception:
        pass
    return None


def upsert_opportunity(opp: dict) -> str:
    """Возвращает "new" | "skip" | "error"."""
    headers = {"Authorization": f"Bearer {JARLYQ_TOKEN}", "Content-Type": "application/json"}

    # Дедупликация
    try:
        r = httpx.get(f"{JARLYQ_API}/api/v1/admin/opportunities",
                      params={"external_id": opp["external_id"]}, headers=headers, timeout=10)
        if r.status_code == 200 and r.json().get("opportunities"):
            return "skip"
    except Exception:
        pass

    company_id = ensure_company(
        opp["company_name"], opp["country"],
        opp.get("company_logo"), opp.get("company_hh_id", "")
    )

    payload = {
        "company_id":      company_id or 0,
        "type":            opp["type"],
        "title":           opp["title"],
        "apply_url":       opp["apply_url"],
        "source_url":      opp["source_url"],
        "level":           opp["level"],
        "salary_min":      opp["salary_min"],
        "salary_max":      opp["salary_max"],
        "salary_currency": opp["salary_currency"],
        "work_format":     opp["work_format"],
        "city":            opp["city"],
        "country":         opp["country"],
        "source":          "hh",
        "external_id":     opp["external_id"],
        "is_active":       True,
        "is_verified":     False,
    }

    try:
        r = httpx.post(f"{JARLYQ_API}/api/v1/admin/opportunities",
                       json=payload, headers=headers, timeout=10)
        if r.status_code in (200, 201):
            return "new"
        print(f"  [api error] {r.status_code}: {r.text[:120]}")
    except Exception as e:
        print(f"  [api error] {e}")
    return "error"


def post_parse_log(source: str, stats: dict):
    if not JARLYQ_TOKEN:
        return
    try:
        httpx.post(
            f"{JARLYQ_API}/api/v1/admin/parse-logs",
            json={"source": source, "entity_type": "opportunity", **stats},
            headers={"Authorization": f"Bearer {JARLYQ_TOKEN}"},
            timeout=5,
        )
    except Exception:
        pass


# ──────────────────────────────────────────────
# Основной цикл
# ──────────────────────────────────────────────

def fetch_and_process(country: str, force_type: Optional[str], use_ai: bool, dry_run: bool) -> dict:
    area_id = COUNTRY_AREA[country]
    stats = {"total_found": 0, "total_new": 0, "total_updated": 0, "total_archived": 0}
    page = 0

    while page < MAX_PAGES:
        params = {
            "area": area_id, "specialization": IT_SPECS,
            "per_page": 100, "page": page,
        }
        if force_type == "internship":
            params["experience"] = "noExperience"
            params["text"] = "стажировка OR intern OR trainee"

        data = hh_get("/vacancies", params)
        items = data.get("items", [])
        if not items:
            break

        print(f"  [{country}] стр {page+1}/{data.get('pages',1)}, вакансий: {len(items)}")
        stats["total_found"] += len(items)

        for item in items:
            vac_id = item["id"]
            time.sleep(DELAY)

            # Полное описание
            full_text = fetch_vacancy_detail(vac_id)

            # Сохраняем сырой текст в файл
            if full_text:
                save_raw("hh", vac_id, f"{item.get('name','')}\n\n{full_text}")

            # AI нормализация
            ai_result = None
            if use_ai and full_text and GROQ_API_KEY:
                ai_result = groq_extract(full_text)

            opp = build_opportunity(item, country, full_text, ai_result, force_type)

            if dry_run:
                review_mark = " ⚠️" if opp["needs_review"] else ""
                stacks = ", ".join(opp["stack"][:5]) if opp["stack"] else "—"
                print(f"  [dry] {opp['type']:12} | {opp['level']:6} | {opp['work_format']:6} | "
                      f"стек: {stacks}{review_mark} | {opp['title'][:50]}")
                stats["total_new"] += 1
            else:
                result = upsert_opportunity(opp)
                if result == "new":
                    stats["total_new"] += 1

        page += 1
        if page >= data.get("pages", 1):
            break

    return stats


# ──────────────────────────────────────────────
# Точка входа
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="hh.ru → Jarlyq парсер")
    parser.add_argument("--country", choices=list(COUNTRY_AREA) + ["ALL"], default="ALL")
    parser.add_argument("--type", choices=["internship", "job", "all"], default="all", dest="opp_type")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--no-ai", action="store_true", help="без Groq, только базовая нормализация")
    parser.add_argument("--output", help="сохранить результат в JSON")
    args = parser.parse_args()

    use_ai = not args.no_ai
    force_type = None if args.opp_type == "all" else args.opp_type
    countries = list(COUNTRY_AREA) if args.country == "ALL" else [args.country]

    if not args.dry_run and not JARLYQ_TOKEN:
        print("⚠️  JARLYQ_ADMIN_TOKEN не задан. Используй --dry-run или добавь токен в .env")
        sys.exit(1)

    if use_ai and not GROQ_API_KEY:
        print("⚠️  GROQ_API_KEY не задан. Запускаю без AI (--no-ai режим)")
        use_ai = False

    print(f"🚀 Старт | AI: {'Groq' if use_ai else 'выкл'} | dry-run: {args.dry_run}")

    all_stats = {"total_found": 0, "total_new": 0, "total_updated": 0, "total_archived": 0}

    for country in countries:
        print(f"\n🌍 {country}...")
        stats = fetch_and_process(country, force_type, use_ai, args.dry_run)
        for k in all_stats:
            all_stats[k] += stats.get(k, 0)

    print(f"\n✅ Готово:")
    print(f"   Найдено:   {all_stats['total_found']}")
    print(f"   Новых:     {all_stats['total_new']}")
    print(f"   Ошибок:    {all_stats.get('error', 0)}")
    print(f"   Сырые файлы: {RAW_DIR}/")

    if not args.dry_run:
        post_parse_log("hh", all_stats)


if __name__ == "__main__":
    main()
