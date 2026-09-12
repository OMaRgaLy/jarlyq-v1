#!/usr/bin/env python3
"""
enrich/build_company_profiles.py — строит черновики профилей компаний из вакансий.

Читает JSONL файл вакансий (output telegram.py),
группирует по company_name через AI (нормализация названий),
агрегирует стек/форматы/города, создаёт Company черновики в staging.

Использование:
  python enrich/build_company_profiles.py --input data/raw/telegram_*.jsonl
  python enrich/build_company_profiles.py --input data/raw/telegram_20260504.jsonl --dry-run
  python enrich/build_company_profiles.py --input data/raw/telegram_20260504.jsonl --min-mentions 2
"""

import argparse
import asyncio
import io
import json
import sys
import time
import uuid
from collections import defaultdict
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import cfg

# Windows UTF-8 fix
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

GROQ_MODELS = ["llama-3.3-70b-versatile", "llama3-70b-8192"]

NORMALIZE_PROMPT = """Ниже — список названий компаний из вакансий (некоторые могут быть одной и той же компанией, написанной по-разному).

Сгруппируй их и верни канонические названия. Отвечай ТОЛЬКО JSON:
{{
  "groups": [
    {{
      "canonical": "Kaspi",
      "aliases": ["kaspi.kz", "Kaspi Bank", "Каспи", "KASPI"]
    }}
  ]
}}

Список:
{names}

Правила:
- Один язык (предпочитай оригинальное название компании, не перевод)
- Если компания явно разная — отдельная группа
- Если похожи но неуверен — отдельные группы лучше чем слияние
- Отвечай ТОЛЬКО JSON, без пояснений"""

ENRICH_PROMPT = """На основе вакансий определи профиль компании. Отвечай ТОЛЬКО JSON:
{{
  "description": "2-3 предложения о компании (что делают, продукт/сервис)",
  "industry": "одна индустрия: fintech|ecommerce|edtech|marketplace|logistics|telecom|consulting|gaming|media|other",
  "size_category": "startup|small|medium|large|enterprise",
  "has_internship": true/false,
  "work_formats": ["remote", "hybrid", "office"],
  "stack": ["список всех упомянутых технологий"],
  "cities": ["список городов где есть офис/вакансии"],
  "confidence": 0.0-1.0
}}

Компания: {company}
Страна: {country}

Вакансии (последние {count}):
{vacancies}"""


def groq_call(prompt: str, timeout: int = 30) -> str | None:
    for model in GROQ_MODELS:
        try:
            resp = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {cfg.groq_api_key}"},
                json={"model": model, "messages": [{"role": "user", "content": prompt}],
                      "temperature": 0.1, "max_tokens": 800},
                timeout=timeout,
            )
            if resp.status_code == 429:
                print("  [groq] rate limit, ждём 15с...")
                time.sleep(15)
                continue
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"  [groq:{model}] {e}")
    return None


def extract_json(text: str) -> dict | None:
    import re
    m = re.search(r'\{[\s\S]*\}', text)
    if not m:
        return None
    try:
        return json.loads(m.group())
    except Exception:
        return None


def load_vacancies(paths: list[Path]) -> list[dict]:
    vacancies = []
    for p in paths:
        with open(p, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    v = json.loads(line)
                    if v.get("company_name"):
                        vacancies.append(v)
                except Exception:
                    pass
    return vacancies


def group_by_name_simple(vacancies: list[dict]) -> dict[str, list[dict]]:
    """Простая группировка без AI — нормализуем строку."""
    import re
    groups: dict[str, list[dict]] = defaultdict(list)
    for v in vacancies:
        raw = v.get("company_name") or ""
        normalized = re.sub(r'[\s\.,-]+', ' ', raw.lower().strip())
        normalized = re.sub(r'\b(llc|тоо|ооо|ип|ао|inc|ltd|gmbh)\b', '', normalized).strip()
        groups[normalized].append(v)
    return dict(groups)


def normalize_with_ai(names: list[str]) -> dict[str, str]:
    """Возвращает mapping alias → canonical. Батчами по 50 имён."""
    mapping: dict[str, str] = {}
    batch_size = 50

    for i in range(0, len(names), batch_size):
        batch = names[i:i + batch_size]
        prompt = NORMALIZE_PROMPT.format(names="\n".join(f"- {n}" for n in batch))
        raw = groq_call(prompt)
        if not raw:
            # Если AI не ответил — каждое имя само себе canonical
            for n in batch:
                mapping[n] = n
            continue

        data = extract_json(raw)
        if not data or "groups" not in data:
            for n in batch:
                mapping[n] = n
            continue

        for group in data["groups"]:
            canonical = group.get("canonical", "")
            aliases = group.get("aliases", [])
            mapping[canonical.lower()] = canonical
            for alias in aliases:
                mapping[alias.lower()] = canonical

        time.sleep(1)  # rate limit

    return mapping


def build_profile(canonical: str, vacancies: list[dict]) -> dict:
    """AI строит профиль компании из вакансий."""
    country = vacancies[0].get("country", "KZ")

    # Агрегируем стек и форматы без AI
    stacks: set[str] = set()
    formats: set[str] = set()
    cities: set[str] = set()
    has_internship = False

    for v in vacancies:
        stacks.update(v.get("stack") or [])
        fmt = v.get("work_format") or ""
        if fmt:
            formats.add(fmt)
        city = v.get("city")
        if city:
            cities.add(city)
        if v.get("type") == "internship":
            has_internship = True

    # Готовим краткое описание вакансий для AI
    sample = vacancies[:8]  # не более 8 вакансий для промпта
    vac_text = ""
    for v in sample:
        title = v.get("title") or ""
        desc = (v.get("description") or "")[:300]
        stack_str = ", ".join((v.get("stack") or [])[:5])
        vac_text += f"\n---\nДолжность: {title}\nСтек: {stack_str}\n{desc}\n"

    profile = {
        "description": "",
        "industry": "other",
        "size_category": "medium",
        "has_internship": has_internship,
        "work_formats": list(formats),
        "stack": list(stacks),
        "cities": list(cities),
        "confidence": 0.5,
    }

    if cfg.groq_api_key:
        prompt = ENRICH_PROMPT.format(
            company=canonical,
            country=country,
            count=len(vacancies),
            vacancies=vac_text,
        )
        raw = groq_call(prompt)
        if raw:
            ai_data = extract_json(raw)
            if ai_data:
                profile.update({
                    k: v for k, v in ai_data.items()
                    if k in profile and v is not None
                })
        time.sleep(1)

    return profile


def save_to_staging(records: list[dict], staging_db: Path):
    """Сохраняет Company черновики в SQLite staging (тот же формат что server.py)."""
    import sqlite3
    conn = sqlite3.connect(str(staging_db))
    inserted = 0
    for rec in records:
        record_id = str(uuid.uuid4())
        try:
            conn.execute(
                "INSERT INTO staging(id, entity, source, status, data, ai_data) VALUES(?,?,?,?,?,?)",
                (record_id, "company", "telegram", "pending",
                 json.dumps(rec["data"], ensure_ascii=False),
                 json.dumps(rec["ai_data"], ensure_ascii=False) if rec.get("ai_data") else None)
            )
            inserted += 1
        except sqlite3.IntegrityError:
            pass
    conn.commit()
    conn.close()
    return inserted


def main():
    parser = argparse.ArgumentParser(description="Строит профили компаний из вакансий Telegram")
    parser.add_argument("--input", nargs="+", required=True, help="JSONL файлы с вакансиями")
    parser.add_argument("--dry-run", action="store_true", help="Не записывать, только показать")
    parser.add_argument("--no-ai", action="store_true", help="Только агрегация без AI")
    parser.add_argument("--min-mentions", type=int, default=1, help="Мин. упоминаний компании")
    parser.add_argument("--output", default="data/company_profiles.jsonl", help="Куда сохранить JSONL")
    args = parser.parse_args()

    # Загружаем вакансии
    paths = []
    for pattern in args.input:
        paths.extend(Path(".").glob(pattern) if "*" in pattern else [Path(pattern)])
    paths = [p for p in paths if p.exists()]

    if not paths:
        print("Файлы не найдены")
        sys.exit(1)

    print(f"Загружаю вакансии из {len(paths)} файл(ов)...")
    vacancies = load_vacancies(paths)
    print(f"  Найдено {len(vacancies)} вакансий с company_name")

    # Простая группировка
    raw_groups = group_by_name_simple(vacancies)
    print(f"  Уникальных компаний (до нормализации): {len(raw_groups)}")

    # Фильтр по мин. упоминаниям
    filtered = {k: v for k, v in raw_groups.items() if len(v) >= args.min_mentions}
    print(f"  После фильтра (>= {args.min_mentions} упоминаний): {len(filtered)}")

    # AI нормализация имён
    if not args.no_ai and cfg.groq_api_key:
        print("\nНормализую названия компаний через AI...")
        # Берём самое частое raw имя из каждой группы как representative
        representatives = {}
        for norm_key, vacs in filtered.items():
            # Берём оригинальное имя которое встречается чаще всего
            from collections import Counter
            most_common = Counter(v["company_name"] for v in vacs).most_common(1)[0][0]
            representatives[norm_key] = most_common

        mapping = normalize_with_ai(list(representatives.values()))
        print(f"  AI объединил в {len(set(mapping.values()))} уникальных компаний")
    else:
        mapping = {}

    # Мерджим группы по canonical именам
    canonical_groups: dict[str, list[dict]] = defaultdict(list)
    for norm_key, vacs in filtered.items():
        from collections import Counter
        rep = Counter(v["company_name"] for v in vacs).most_common(1)[0][0]
        canonical = mapping.get(rep.lower(), rep)
        canonical_groups[canonical].extend(vacs)

    print(f"\nИтого компаний: {len(canonical_groups)}")
    print("=" * 60)

    # Строим профили
    staging_records = []
    output_lines = []

    for i, (canonical, vacs) in enumerate(sorted(canonical_groups.items(), key=lambda x: -len(x[1]))):
        count = len(vacs)
        print(f"\n[{i+1}/{len(canonical_groups)}] {canonical} ({count} вакансий)")

        if args.dry_run:
            stacks = set()
            for v in vacs:
                stacks.update(v.get("stack") or [])
            print(f"  Стек: {', '.join(list(stacks)[:8]) or '—'}")
            print(f"  Типы: {set(v.get('type','') for v in vacs)}")
            continue

        if not args.no_ai:
            profile = build_profile(canonical, vacs)
        else:
            stacks: set[str] = set()
            formats: set[str] = set()
            cities: set[str] = set()
            has_internship = False
            for v in vacs:
                stacks.update(v.get("stack") or [])
                fmt = v.get("work_format") or ""
                if fmt:
                    formats.add(fmt)
                city = v.get("city")
                if city:
                    cities.add(city)
                if v.get("type") == "internship":
                    has_internship = True
            profile = {
                "description": "",
                "industry": "other",
                "size_category": "medium",
                "has_internship": has_internship,
                "work_formats": list(formats),
                "stack": list(stacks),
                "cities": list(cities),
                "confidence": 0.3,
            }

        country = vacs[0].get("country", "KZ")
        city = list(profile.get("cities") or [])
        city_str = city[0] if city else ""

        data = {
            "name": canonical,
            "country": country,
            "city": city_str,
            "description": profile.get("description", ""),
            "industry": profile.get("industry", "other"),
            "size_category": profile.get("size_category", "medium"),
            "has_internship": profile.get("has_internship", False),
            "work_formats": profile.get("work_formats", []),
            "stack": profile.get("stack", []),
            "source": "telegram",
            "needs_review": True,
        }

        record = {
            "data": data,
            "ai_data": {
                "description": profile.get("description"),
                "industry": profile.get("industry"),
                "stack": profile.get("stack"),
                "work_formats": profile.get("work_formats"),
                "confidence": profile.get("confidence", 0.5),
                "mention_count": count,
                "sample_vacancies": [v.get("source_url") for v in vacs[:5] if v.get("source_url")],
            },
        }

        staging_records.append(record)
        output_lines.append(json.dumps({"company": canonical, "count": count, **data}, ensure_ascii=False))

        print(f"  industry: {data['industry']} | стек: {len(data['stack'])} тех. | города: {city}")

    if not args.dry_run:
        # Сохраняем в JSONL
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(output_lines))
        print(f"\nСохранено в {out_path}")

        # Сохраняем в staging SQLite
        staging_db = Path(__file__).parent.parent / "pipeline_staging.db"
        if staging_db.exists():
            inserted = save_to_staging(staging_records, staging_db)
            print(f"Добавлено в staging: {inserted} компаний")
            print("Открой /admin/staging чтобы проверить и одобрить")
        else:
            print(f"Staging DB не найдена ({staging_db}) — запусти server.py сначала")

    print(f"\nГотово. Обработано {len(canonical_groups)} компаний.")


if __name__ == "__main__":
    main()
