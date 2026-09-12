#!/usr/bin/env python3
"""
collect/hh.py — парсер HH.ru (официальный API)

Два режима:
  --mode companies  → профили работодателей (стек, лого, вакансии)
  --mode vacancies  → вакансии/стажировки → Opportunity в Jarlyq

Страны: KZ UZ KG RU BY AZ AM GE
"""

import argparse
import io
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path

# Windows cp1252 fix — force UTF-8 stdout
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import httpx

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import cfg

HH_BASE = "https://api.hh.ru"
HH_UA   = "Jarlyq/1.0 (jarlyq.kz; hello@jarlyq.kz)"

COUNTRIES = {
    "KZ": 40, "UZ": 97, "KG": 48, "RU": 113,
    "BY": 16, "AZ": 9,  "AM": 1213, "GE": 28,
}
IT_INDUSTRIES = ["7", "12"]   # IT/интернет + Телеком

GROQ_MODELS = ["llama-3.3-70b-versatile", "llama3-70b-8192", "qwen-qwq-32b"]

NER_PROMPT = """Ты парсер вакансий. Извлеки данные и верни ТОЛЬКО JSON.

Текст:
{text}

JSON (null если не найдено):
{{
  "stack": ["Python", "Django"],
  "work_format": "remote|office|hybrid|null",
  "level": "intern|junior|mid|senior|null",
  "salary_min": 0,
  "salary_max": 0,
  "salary_currency": "KZT|USD|EUR|RUB|null",
  "confidence": 0.85
}}

stack — только технологии (Python, Go, React, PostgreSQL...), не методологии.
ТОЛЬКО JSON, без пояснений."""


# ── HTTP клиент ───────────────────────────────────────────────────────────────

def hh_client() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": HH_UA, "HH-User-Agent": HH_UA},
        timeout=30,
    )


def hh_get(client: httpx.Client, path: str, params: dict = None) -> dict:
    for attempt in range(3):
        resp = client.get(f"{HH_BASE}{path}", params=params)
        if resp.status_code == 429:
            print("  Rate limit, ждём 10с...")
            time.sleep(10)
            continue
        if resp.status_code != 200:
            return {}
        return resp.json()
    return {}


# ── Groq NER ──────────────────────────────────────────────────────────────────

def groq_ner(text: str) -> dict | None:
    if not cfg.groq_api_key:
        return None
    for model in GROQ_MODELS:
        try:
            resp = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {cfg.groq_api_key}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": NER_PROMPT.format(text=text[:3000])}],
                    "temperature": 0.1,
                    "max_tokens": 400,
                },
                timeout=20,
            )
            if resp.status_code == 429:
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


def clean_html(text: str) -> str:
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&[a-z]+;', '', text)
    return re.sub(r'\s{2,}', ' ', text).strip()


# ── Режим COMPANIES ───────────────────────────────────────────────────────────

def fetch_employers(area: int, industry: str, client: httpx.Client) -> list[dict]:
    employers, page = [], 0
    while page < 20:
        data = hh_get(client, "/employers", {
            "area": area, "industry": industry,
            "type": "company", "per_page": 100, "page": page,
        })
        items = data.get("items", [])
        if not items:
            break
        employers.extend(items)
        pages = data.get("pages", 1)
        print(f"    стр {page+1}/{pages}: +{len(items)}")
        if page >= pages - 1:
            break
        page += 1
        time.sleep(0.3)
    return employers


def fetch_employer_detail(eid: int, client: httpx.Client) -> dict:
    return hh_get(client, f"/employers/{eid}")


def fetch_employer_vacancies(url: str, client: httpx.Client) -> list[dict]:
    if not url:
        return []
    resp = client.get(url, params={"per_page": 50})
    return resp.json().get("items", []) if resp.status_code == 200 else []


def normalize_employer(detail: dict, vacancies: list[dict], country: str) -> dict:
    stacks = sorted({
        s.get("name", "").strip()
        for v in vacancies for s in v.get("key_skills", [])
        if s.get("name", "").strip()
    })
    work_formats = set()
    for v in vacancies:
        sid = v.get("schedule", {}).get("id", "")
        if "remote" in sid:      work_formats.add("remote")
        elif "flexible" in sid:  work_formats.add("hybrid")
        else:                    work_formats.add("office")

    logos = detail.get("logo_urls") or {}
    logo = next((logos[k] for k in ("240", "90", "original") if logos.get(k)), "")

    return {
        "source": "hh",
        "external_id": f"hh:employer:{detail.get('id')}",
        "name": detail.get("name", ""),
        "description": detail.get("description", "") or detail.get("alternate_description", ""),
        "logo_url": logo,
        "website": detail.get("site_url", ""),
        "country": country,
        "industry": (detail.get("industries") or [{}])[0].get("name", ""),
        "employee_count": str(detail.get("employee_number") or ""),
        "hh_url": detail.get("alternate_url", ""),
        "open_vacancies": detail.get("open_vacancies", 0),
        "is_accredited_it": detail.get("accredited_it_employer", False),
        "stack": stacks,
        "has_internship": any(
            "стаж" in v.get("name", "").lower() or
            v.get("experience", {}).get("id") == "noExperience"
            for v in vacancies
        ),
        "work_formats": list(work_formats),
        "vacancies_sample": [
            {
                "id": v.get("id"), "title": v.get("name"),
                "level": v.get("experience", {}).get("name"),
                "salary_from": (v.get("salary") or {}).get("from"),
                "salary_to": (v.get("salary") or {}).get("to"),
                "currency": (v.get("salary") or {}).get("currency"),
                "url": v.get("alternate_url"),
            }
            for v in vacancies[:10]
        ],
        "parsed_at": datetime.utcnow().isoformat(),
        "needs_review": len(stacks) == 0,
    }


def run_companies(countries: list[str], dry_run: bool):
    today = datetime.utcnow().strftime("%Y%m%d")
    with hh_client() as client:
        for country in countries:
            area = COUNTRIES.get(country.upper())
            if not area:
                print(f"Неизвестная страна: {country}"); continue

            print(f"\n{'='*50}\nHH Companies: {country}\n{'='*50}")
            seen, all_emp = set(), []
            for ind in IT_INDUSTRIES:
                print(f"\nИндустрия {ind}:")
                for e in fetch_employers(area, ind, client):
                    if e.get("id") not in seen:
                        seen.add(e["id"]); all_emp.append(e)

            print(f"\nУникальных: {len(all_emp)}")
            if dry_run:
                for e in all_emp[:5]: print(f"  {e.get('id')} | {e.get('name')}")
                continue

            out = cfg.data_raw / f"hh_companies_{country}_{today}.jsonl"
            with open(out, "w", encoding="utf-8") as f:
                for i, emp in enumerate(all_emp):
                    eid, name = emp.get("id"), emp.get("name", "?")
                    print(f"  [{i+1}/{len(all_emp)}] {name}", end="")
                    detail = fetch_employer_detail(eid, client)
                    vacs = fetch_employer_vacancies(detail.get("vacancies_url", ""), client)
                    row = normalize_employer(detail, vacs, country)
                    print(f" | {len(row['stack'])} стеков | {row['open_vacancies']} вак.")
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")
                    time.sleep(0.2)
            print(f"\n✓ → {out}")


# ── Режим VACANCIES ───────────────────────────────────────────────────────────

def base_level(item: dict) -> str:
    return {"noExperience": "intern", "between1And3": "junior",
            "between3And6": "mid", "moreThan6": "senior"}.get(
        item.get("experience", {}).get("id", ""), "")


def base_format(item: dict) -> str:
    sid = item.get("schedule", {}).get("id", "")
    if "remote" in sid:   return "remote"
    if "flexible" in sid: return "hybrid"
    return "office"


def base_type(title: str) -> str:
    t = title.lower()
    if any(w in t for w in ["стажир", "intern", "trainee", "практик"]): return "internship"
    return "job"


def run_vacancies(countries: list[str], opp_type: str | None, use_ai: bool, dry_run: bool):
    today = datetime.utcnow().strftime("%Y%m%d")
    with hh_client() as client:
        for country in countries:
            area = COUNTRIES.get(country.upper())
            if not area:
                print(f"Неизвестная страна: {country}"); continue

            print(f"\n{'='*50}\nHH Vacancies: {country}\n{'='*50}")
            params = {"area": area, "specialization": ["1", "3"], "per_page": 100}
            if opp_type == "internship":
                params["experience"] = "noExperience"
                params["text"] = "стажировка OR intern OR trainee"

            out = cfg.data_raw / f"hh_vacancies_{country}_{today}.jsonl"
            written = 0
            page = 0

            with open(out, "w", encoding="utf-8") as f:
                while page < 20:
                    data = hh_get(client, "/vacancies", {**params, "page": page})
                    items = data.get("items", [])
                    if not items: break
                    print(f"  стр {page+1}/{data.get('pages',1)}: {len(items)} вакансий")

                    for item in items:
                        vac_id = item["id"]
                        time.sleep(0.25)

                        # Полное описание для NER
                        detail = hh_get(client, f"/vacancies/{vac_id}")
                        full_text = clean_html(detail.get("description", ""))

                        # AI NER
                        ai = groq_ner(full_text) if (use_ai and full_text) else None

                        sal = item.get("salary") or {}
                        emp = item.get("employer", {})
                        logos = emp.get("logo_urls") or {}

                        row = {
                            "source": "hh",
                            "external_id": f"hh:vacancy:{vac_id}",
                            "type": opp_type or base_type(item.get("name", "")),
                            "title": item.get("name", ""),
                            "description": full_text[:1000],
                            "apply_url": item.get("alternate_url", ""),
                            "level": base_level(item),
                            "work_format": base_format(item),
                            "salary_min": sal.get("from") or 0,
                            "salary_max": sal.get("to") or 0,
                            "salary_currency": sal.get("currency", "KZT"),
                            "city": item.get("area", {}).get("name", ""),
                            "country": country,
                            "company_name": emp.get("name", ""),
                            "company_hh_id": str(emp.get("id", "")),
                            "company_logo": logos.get("90", ""),
                            "stack": [],
                            "needs_review": False,
                            "parsed_at": datetime.utcnow().isoformat(),
                        }

                        if ai:
                            row["stack"] = ai.get("stack") or []
                            row["needs_review"] = ai.get("confidence", 1.0) < 0.7
                            if ai.get("work_format") not in (None, "null"):
                                row["work_format"] = ai["work_format"]
                            if ai.get("level") not in (None, "null"):
                                row["level"] = ai["level"]
                        else:
                            row["needs_review"] = True

                        if dry_run:
                            stacks = ", ".join(row["stack"][:4]) or "—"
                            print(f"  [dry] {row['type']:12} {row['level']:6} {row['work_format']:6} | {stacks} | {row['title'][:50]}")
                        else:
                            f.write(json.dumps(row, ensure_ascii=False) + "\n")
                            written += 1

                    page += 1
                    if page >= data.get("pages", 1):
                        break

            if not dry_run:
                print(f"\n✓ {written} вакансий → {out}")


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HH.ru парсер")
    parser.add_argument("--mode", choices=["companies", "vacancies"], default="companies")
    parser.add_argument("--countries", nargs="+", default=["KZ"])
    parser.add_argument("--type", choices=["internship", "job"], default=None,
                        dest="opp_type", help="Только для --mode vacancies")
    parser.add_argument("--no-ai", action="store_true", help="Без Groq NER")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.mode == "companies":
        run_companies(args.countries, args.dry_run)
    else:
        if not args.no_ai and cfg.groq_api_key:
            print(f"AI: Groq ({GROQ_MODELS[0]})")
        else:
            print("AI: выкл")
        run_vacancies(args.countries, args.opp_type, not args.no_ai, args.dry_run)
