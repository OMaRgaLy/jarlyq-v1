#!/usr/bin/env python3
"""
groq_enricher.py — AI-обогащение профилей компаний через Groq (llama-3.3-70b)

Что делает:
  - Читает сырые JSONL файлы (hh, habr, djinni, github)
  - Для каждой компании с needs_review=True:
      * Определяет: есть ли стажировки, formат работы, страну, размер
      * Дополняет описание на русском (если пустое)
      * Проставляет industry (IT / Fintech / Edtech / Gaming / Telecom / ...)
      * Возвращает улучшенный профиль
  - Записывает в data/enriched/

Требует: GROQ_API_KEY в env
pip install groq

Использование:
  python groq_enricher.py --input data/raw/hh_companies_KZ_20240101.jsonl
  python groq_enricher.py --input data/raw/ --all  # все файлы в папке
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent))
from config import cfg

try:
    from groq import Groq
except ImportError:
    print("ERROR: pip install groq")
    sys.exit(1)


GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """Ты — эксперт по IT-компаниям СНГ и EMEA. Тебе дают JSON-профиль компании.
Твоя задача — заполнить пустые или плохие поля и вернуть ТОЛЬКО валидный JSON без комментариев.

Правила:
- industry: одно из [IT, Fintech, Edtech, Gaming, Telecom, Cybersecurity, E-commerce, Consulting, Outsourcing, AI/ML, Blockchain, Media, Healthtech, Logistics, Other]
- work_formats: список из [remote, hybrid, office]
- has_internship: true если компания берёт стажёров
- description_ru: 2-3 предложения о компании на русском языке (нейтральный тон)
- stack: список технологий если можно определить по описанию/индустрии
- size_category: one of [startup, small, medium, large, enterprise] (startup<10, small<50, medium<200, large<1000, enterprise>1000)
- Если не можешь определить поле достоверно — оставь как есть или пустым.
"""

USER_TEMPLATE = """Обогати профиль компании:

{company_json}

Верни JSON с полями: industry, work_formats, has_internship, description_ru, stack, size_category.
Только JSON, без markdown."""


def enrich_company(company: dict, client: Groq) -> dict:
    """Отправляет профиль в Groq, получает обогащённые поля."""
    # Отправляем сокращённый профиль (без лишнего)
    short_profile = {
        "name": company.get("name", ""),
        "description": (company.get("description") or "")[:500],
        "industry": company.get("industry", ""),
        "stack": company.get("stack", [])[:20],
        "country": company.get("country", ""),
        "employee_count": company.get("employee_count", ""),
        "website": company.get("website", ""),
        "has_internship": company.get("has_internship"),
        "work_formats": company.get("work_formats", []),
        "open_vacancies": company.get("open_vacancies", 0),
        "vacancies_sample": [
            v.get("title") for v in (company.get("vacancies_sample") or [])[:5]
        ],
    }

    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": USER_TEMPLATE.format(
                    company_json=json.dumps(short_profile, ensure_ascii=False, indent=2)
                )},
            ],
            temperature=0.2,
            max_tokens=512,
        )
        raw = completion.choices[0].message.content.strip()

        # Убираем ```json ``` если есть
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        enriched = json.loads(raw)
        return enriched
    except (json.JSONDecodeError, Exception) as e:
        print(f"    Groq error: {e}")
        return {}


def merge_enriched(original: dict, enriched: dict) -> dict:
    """Объединяет оригинальный профиль с обогащёнными полями."""
    result = original.copy()

    # Только перезаписываем если поле было пустым или нуждалось в обогащении
    if enriched.get("industry") and not original.get("industry"):
        result["industry"] = enriched["industry"]
    elif enriched.get("industry"):
        result["industry"] = enriched["industry"]  # AI знает лучше

    if enriched.get("work_formats") and not original.get("work_formats"):
        result["work_formats"] = enriched["work_formats"]

    if enriched.get("has_internship") is not None and original.get("has_internship") is False:
        result["has_internship"] = enriched["has_internship"]

    if enriched.get("description_ru"):
        result["description_ru"] = enriched["description_ru"]
        if not original.get("description"):
            result["description"] = enriched["description_ru"]

    if enriched.get("stack") and len(original.get("stack", [])) < 3:
        # Добавляем AI-угаданный стек, но помечаем
        ai_stack = enriched["stack"]
        existing = set(original.get("stack", []))
        for s in ai_stack:
            if s not in existing:
                existing.add(s)
        result["stack"] = sorted(existing)
        result["stack_source"] = "ai_inferred"

    if enriched.get("size_category"):
        result["size_category"] = enriched["size_category"]

    result["enriched_at"] = datetime.utcnow().isoformat()
    result["needs_review"] = False  # AI уже посмотрел

    return result


def process_file(input_path: Path, client: Groq, only_needs_review: bool = True,
                 limit: int | None = None) -> Path:
    """Обрабатывает один JSONL файл."""
    out_path = cfg.data_enriched / input_path.name.replace(".jsonl", "_enriched.jsonl")

    companies = []
    with open(input_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    companies.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    if limit:
        companies = companies[:limit]

    total = len(companies)
    enriched_count = 0
    skipped = 0

    print(f"\nФайл: {input_path.name} ({total} записей)")

    with open(out_path, "w", encoding="utf-8") as f:
        for i, company in enumerate(companies):
            name = company.get("name", "?")
            needs_review = company.get("needs_review", True)

            if only_needs_review and not needs_review:
                print(f"  [{i+1}/{total}] {name} — skip (already reviewed)")
                f.write(json.dumps(company, ensure_ascii=False) + "\n")
                skipped += 1
                continue

            print(f"  [{i+1}/{total}] {name}...", end="", flush=True)
            enriched_fields = enrich_company(company, client)

            if enriched_fields:
                merged = merge_enriched(company, enriched_fields)
                print(f" ✓ industry={merged.get('industry')} stack+={len(enriched_fields.get('stack', []))}")
                enriched_count += 1
            else:
                merged = company
                print(" ✗ (no enrichment)")

            f.write(json.dumps(merged, ensure_ascii=False) + "\n")
            time.sleep(0.3)  # Groq rate limit: ~30 req/min на free tier

    print(f"\n✓ Обогащено {enriched_count}/{total} компаний → {out_path}")
    return out_path


def run(input_paths: list[Path], only_needs_review: bool = True, limit: int | None = None):
    cfg.require("groq_api_key")
    client = Groq(api_key=cfg.groq_api_key)

    for path in input_paths:
        if not path.exists():
            print(f"File not found: {path}")
            continue
        process_file(path, client, only_needs_review=only_needs_review, limit=limit)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Groq AI Enricher for Company Profiles")
    parser.add_argument("--input", required=True, help="JSONL file или директория с --all")
    parser.add_argument("--all", action="store_true", help="Обработать все .jsonl в директории")
    parser.add_argument("--all-records", action="store_true",
                        help="Обогащать все записи, не только needs_review=true")
    parser.add_argument("--limit", type=int, default=None,
                        help="Максимум записей (для тестирования)")
    args = parser.parse_args()

    input_path = Path(args.input)
    if args.all and input_path.is_dir():
        paths = sorted(input_path.glob("*.jsonl"))
    elif input_path.is_file():
        paths = [input_path]
    else:
        print(f"Not found: {input_path}")
        sys.exit(1)

    run(
        input_paths=paths,
        only_needs_review=not args.all_records,
        limit=args.limit,
    )
