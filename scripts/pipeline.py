#!/usr/bin/env python3
"""
pipeline.py — оркестратор сбора данных Jarlyq

Запускает парсеры → AI обогащение → дедупликация → единый JSONL

Использование:
  python pipeline.py --countries KZ --sources hh habr
  python pipeline.py --countries KZ UZ --sources all --enrich
  python pipeline.py --merge-only
  python pipeline.py --dry-run

Токены читаются из корневого .env (через config.py)
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from config import cfg

TODAY = datetime.utcnow().strftime("%Y%m%d")
COLLECT_DIR = Path(__file__).parent / "collect"

SOURCES = {
    "hh": {
        "script": COLLECT_DIR / "hh.py",
        "entity": "companies",
        "args": lambda countries, dry: ["--mode", "companies", "--countries", *countries, *(["--dry-run"] if dry else [])],
    },
    "hh_vacancies": {
        "script": COLLECT_DIR / "hh.py",
        "entity": "vacancies",
        "args": lambda countries, dry: ["--mode", "vacancies", "--countries", *countries, *(["--dry-run"] if dry else [])],
    },
    "habr": {
        "script": COLLECT_DIR / "habr.py",
        "entity": "companies",
        "args": lambda countries, dry: ["--countries", *countries, *(["--dry-run"] if dry else [])],
    },
    "djinni": {
        "script": COLLECT_DIR / "djinni.py",
        "entity": "companies",
        "args": lambda countries, dry: [*(["--dry-run"] if dry else [])],
    },
    "github": {
        "script": COLLECT_DIR / "github.py",
        "entity": "companies",
        "args": lambda countries, dry: ["--countries", *countries, *(["--dry-run"] if dry else [])],
    },
    "astana_hub": {
        "script": COLLECT_DIR / "astana_hub.py",
        "entity": "schools",
        "args": lambda countries, dry: [*(["--dry-run"] if dry else [])],
    },
    "telegram": {
        "script": COLLECT_DIR / "telegram.py",
        "entity": "vacancies",
        "args": lambda countries, dry: [*(["--dry-run"] if dry else [])],
    },
}


def run_source(name: str, countries: list[str], dry_run: bool) -> bool:
    source = SOURCES.get(name)
    if not source:
        print(f"Неизвестный источник: {name}")
        return False
    if not source["script"].exists():
        print(f"Скрипт не найден: {source['script']}")
        return False

    args = source["args"](countries, dry_run)
    cmd = [sys.executable, str(source["script"])] + args
    print(f"\n{'─'*60}")
    print(f"[{name.upper()}] {' '.join(str(a) for a in args)}")
    print(f"{'─'*60}")
    return subprocess.run(cmd, cwd=Path(__file__).parent).returncode == 0


def collect_files(entity: str, enriched: bool = False) -> list[Path]:
    base = cfg.data_enriched if enriched else cfg.data_raw
    patterns = {
        "companies": ["hh_companies_*.jsonl", "habr_companies_*.jsonl",
                      "djinni_companies_*.jsonl", "github_orgs_*.jsonl",
                      "astana_hub_companies_*.jsonl"],
        "schools":   ["astana_hub_schools_*.jsonl"],
        "vacancies": ["hh_vacancies_*.jsonl", "telegram_vacancies_*.jsonl",
                      "djinni_vacancies_*.jsonl"],
    }
    if enriched:
        patterns = {k: [p.replace(".jsonl", "_enriched.jsonl") for p in v]
                    for k, v in patterns.items()}
    files = []
    for pat in patterns.get(entity, []):
        files.extend(base.glob(pat))
    return sorted(files)


def run_enrichment(entity: str):
    files = collect_files(entity)
    if not files:
        return
    enricher = Path(__file__).parent / "enrich.py"
    for f in files:
        print(f"\n[ENRICH] {f.name}")
        subprocess.run([sys.executable, str(enricher), "--input", str(f)],
                       cwd=Path(__file__).parent)


def deduplicate(records: list[dict]) -> list[dict]:
    seen: dict[str, dict] = {}
    for r in records:
        eid = r.get("external_id", "")
        key = eid if eid else f"name:{r.get('name','').strip().lower()}"
        if key not in seen:
            seen[key] = r
        else:
            ex = seen[key]
            ex_score = len(ex.get("stack", [])) * 2 + (5 if not ex.get("needs_review") else 0) + (3 if ex.get("enriched_at") else 0)
            nw_score = len(r.get("stack",  [])) * 2 + (5 if not r.get("needs_review")  else 0) + (3 if r.get("enriched_at")  else 0)
            if nw_score > ex_score:
                merged = ex.copy()
                for field in ("description", "website", "logo_url", "industry", "employee_count", "description_ru", "size_category"):
                    if not merged.get(field) and r.get(field):
                        merged[field] = r[field]
                merged["stack"] = sorted(set(merged.get("stack", []) + r.get("stack", [])))
                merged["work_formats"] = list(set(merged.get("work_formats", []) + r.get("work_formats", [])))
                merged["has_internship"] = merged.get("has_internship") or r.get("has_internship")
                seen[key] = merged
    return list(seen.values())


def merge_files(entity: str, use_enriched: bool = False) -> Path | None:
    files = collect_files(entity, enriched=use_enriched)
    if not files and use_enriched:
        files = collect_files(entity, enriched=False)
    if not files:
        print(f"Нет файлов для {entity}")
        return None

    all_records = []
    for f in files:
        with open(f, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    try: all_records.append(json.loads(line))
                    except json.JSONDecodeError: pass
        print(f"  {f.name}: {len(all_records)} записей всего")

    print(f"\nДо дедупликации: {len(all_records)}")
    deduped = deduplicate(all_records)
    print(f"После:           {len(deduped)}")

    out = cfg.data_merged / f"{entity}_{TODAY}.jsonl"
    with open(out, "w", encoding="utf-8") as f:
        for r in deduped:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"✓ → {out}")
    return out


def print_stats(path: Path, entity: str):
    if not path or not path.exists():
        return
    records = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            try: records.append(json.loads(line.strip()))
            except: pass
    if not records:
        return
    total = len(records)
    by_country: dict[str, int] = {}
    by_source:  dict[str, int] = {}
    for r in records:
        by_country[r.get("country", "?")] = by_country.get(r.get("country", "?"), 0) + 1
        by_source [r.get("source",  "?")] = by_source.get (r.get("source",  "?"), 0) + 1
    print(f"\n{'='*50}")
    print(f"ИТОГ {entity}: {total}")
    print(f"  Со стеком:   {sum(1 for r in records if r.get('stack'))}")
    print(f"  Стажировки:  {sum(1 for r in records if r.get('has_internship'))}")
    print(f"  На проверке: {sum(1 for r in records if r.get('needs_review'))}")
    print(f"  Страны:  {dict(sorted(by_country.items(), key=lambda x:-x[1]))}")
    print(f"  Источники: {dict(sorted(by_source.items(), key=lambda x:-x[1]))}")


def main():
    parser = argparse.ArgumentParser(description="Jarlyq Data Pipeline")
    parser.add_argument("--countries", nargs="+", default=["KZ"],
                        help="KZ UZ KG RU BY AZ AM GE TR")
    parser.add_argument("--sources", nargs="+", default=["hh"],
                        help=f"Источники: {' '.join(SOURCES)} all")
    parser.add_argument("--enrich", action="store_true",
                        help="AI обогащение через Groq (нужен GROQ_API_KEY в .env)")
    parser.add_argument("--merge-only", action="store_true",
                        help="Только дедупликация, без запуска парсеров")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sources = list(SOURCES) if "all" in args.sources else args.sources

    print(f"\n{'='*60}")
    print(f"JARLYQ DATA PIPELINE — {TODAY}")
    print(f"{'='*60}")
    print(f"Страны:    {args.countries}")
    print(f"Источники: {sources}")
    print(f"Enrich:    {args.enrich}")
    print(f"Dry-run:   {args.dry_run}")

    if not args.merge_only:
        print(f"\n{'─'*60}")
        print("ШАГ 1: Сбор данных")
        for src in sources:
            ok = run_source(src, args.countries, args.dry_run)
            if not ok:
                print(f"WARNING: {src} завершился с ошибкой")

        if args.enrich and not args.dry_run:
            print(f"\n{'─'*60}")
            print("ШАГ 2: AI обогащение")
            for entity in ("companies", "schools"):
                run_enrichment(entity)

    if not args.dry_run:
        print(f"\n{'─'*60}")
        print("ШАГ 3: Дедупликация и мёрж")
        for entity in ("companies", "schools", "vacancies"):
            merged = merge_files(entity, use_enriched=args.enrich)
            if merged:
                print_stats(merged, entity)

        print(f"\n{'='*60}")
        print("ГОТОВО")
        print(f"Данные:       {cfg.data_merged}")
        print(f"Следующий шаг: python export.py --entity companies --input data/merged/")
        print(f"{'='*60}")


if __name__ == "__main__":
    main()
