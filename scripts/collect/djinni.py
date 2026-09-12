#!/usr/bin/env python3
"""
djinni_scraper.py — парсер вакансий и компаний с Djinni.co

Djinni — главная джун-площадка СНГ с зарплатами и удалёнкой.
Использует JSON-LD разметку на страницах вакансий + API листинга.

Что собираем:
  - Список компаний с открытыми вакансиями (особенно junior/intern)
  - Технологии (из тегов вакансий)
  - Зарплаты ($-диапазон)
  - Формат работы (remote/office/hybrid)

Выход: data/raw/djinni_companies_{DATE}.jsonl
        data/raw/djinni_vacancies_{DATE}.jsonl
"""

import json
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import sys
import httpx

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import cfg
from bs4 import BeautifulSoup


BASE = "https://djinni.co"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

# Категории (slug в Djinni)
CATEGORIES = [
    "python",
    "javascript",
    "java",
    "golang",
    "ios",
    "android",
    "devops",
    "data-science",
    "qa",
    "react",
    "node-js",
    "php",
    "net",
    "c-plus-plus",
    "fullstack",
    "ui",
]

# Уровни опыта для junior/intern фокуса
EXPERIENCE_LEVELS = ["no_exp", "1y"]  # no_exp=0, 1y=1 год


def get_client() -> httpx.Client:
    return httpx.Client(
        headers={
            "User-Agent": UA,
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
        },
        follow_redirects=True,
        timeout=30,
    )


def fetch_vacancy_list(category: str, exp: str, client: httpx.Client, max_pages: int = 5) -> list[dict]:
    """Возвращает базовую информацию о вакансиях из листинга."""
    vacancies = []
    for page in range(1, max_pages + 1):
        url = f"{BASE}/jobs/{category}/?exp={exp}&page={page}"
        resp = client.get(url)
        if resp.status_code == 429:
            print("  Rate limit, sleep 20s...")
            time.sleep(20)
            resp = client.get(url)
        if resp.status_code != 200:
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        items = soup.select("li.list-jobs__item, .job-list-item")
        if not items:
            break

        for item in items:
            title_el = item.select_one("a.job-list-item__link, a.profile")
            if not title_el:
                continue
            href = title_el.get("href", "")
            title = title_el.get_text(strip=True)

            company_el = item.select_one(".job-list-item__company, .company-name")
            company = company_el.get_text(strip=True) if company_el else ""

            salary_el = item.select_one(".public-salary-item, .salary")
            salary_raw = salary_el.get_text(strip=True) if salary_el else ""

            location_el = item.select_one(".location-text, .job-list-item__location")
            location = location_el.get_text(strip=True) if location_el else ""

            tags_els = item.select(".nobr, .label-group span, .job-list-item__skill")
            tags = [t.get_text(strip=True) for t in tags_els if t.get_text(strip=True)]

            vacancies.append({
                "url": urljoin(BASE, href),
                "title": title,
                "company": company,
                "salary_raw": salary_raw,
                "location": location,
                "tags": tags,
                "category": category,
                "experience": exp,
            })

        print(f"  [{category}/{exp}] page {page}: +{len(items)} vac, total={len(vacancies)}")
        time.sleep(1.0)

    return vacancies


def parse_vacancy_detail(url: str, client: httpx.Client) -> dict:
    """Парсит детальную страницу вакансии, включая JSON-LD."""
    resp = client.get(url)
    if resp.status_code != 200:
        return {}

    soup = BeautifulSoup(resp.text, "html.parser")

    # JSON-LD разметка (JobPosting)
    jsonld_data = {}
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(script.string or "{}")
            if data.get("@type") == "JobPosting":
                jsonld_data = data
                break
        except (json.JSONDecodeError, AttributeError):
            pass

    # Зарплата из JSON-LD
    salary_from = salary_to = None
    currency = "USD"
    if "baseSalary" in jsonld_data:
        sal = jsonld_data["baseSalary"]
        value = sal.get("value", {})
        salary_from = value.get("minValue")
        salary_to = value.get("maxValue")
        currency = sal.get("currency", "USD")

    # Описание
    desc_el = soup.select_one(".profile-page-section__content, .job-post__description")
    description = desc_el.get_text(" ", strip=True)[:2000] if desc_el else jsonld_data.get("description", "")[:2000]

    # Формат работы
    work_format = "office"
    location_raw = jsonld_data.get("jobLocation", {})
    if isinstance(location_raw, dict):
        addr = location_raw.get("address", {})
        city = addr.get("addressLocality", "")
    else:
        city = ""

    if "remote" in description.lower() or "удал" in description.lower():
        work_format = "remote"
    elif "гибрид" in description.lower() or "hybrid" in description.lower():
        work_format = "hybrid"

    # Стек из тегов на странице
    skills_els = soup.select(".job-post__skills .badge, .skills-tag__item, .label")
    skills = list(dict.fromkeys(s.get_text(strip=True) for s in skills_els if s.get_text(strip=True)))

    return {
        "description": description,
        "salary_from": salary_from,
        "salary_to": salary_to,
        "currency": currency,
        "work_format": work_format,
        "city": city,
        "skills": skills,
        "jsonld_title": jsonld_data.get("title", ""),
        "date_posted": jsonld_data.get("datePosted", ""),
    }


def aggregate_companies(vacancies: list[dict]) -> dict[str, dict]:
    """Группирует вакансии по компании, формирует профиль."""
    companies: dict[str, dict] = {}

    for v in vacancies:
        company_name = v.get("company", "").strip()
        if not company_name:
            continue

        if company_name not in companies:
            companies[company_name] = {
                "source": "djinni",
                "external_id": f"djinni:company:{re.sub(r'[^a-z0-9]', '-', company_name.lower())}",
                "name": company_name,
                "description": "",
                "logo_url": "",
                "website": "",
                "country": "",
                "industry": "IT",
                "employee_count": "",
                "open_vacancies": 0,
                "stack": set(),
                "has_internship": False,
                "work_formats": set(),
                "vacancies_sample": [],
                "parsed_at": datetime.utcnow().isoformat(),
                "needs_review": True,
            }

        co = companies[company_name]
        co["open_vacancies"] += 1
        co["stack"].update(v.get("tags", []))

        # формат работы
        loc = v.get("location", "").lower()
        if "remote" in loc or "удал" in loc:
            co["work_formats"].add("remote")
        elif "hybrid" in loc or "гибр" in loc:
            co["work_formats"].add("hybrid")
        else:
            co["work_formats"].add("office")

        # стажировка
        title_lower = v.get("title", "").lower()
        if "intern" in title_lower or "стаж" in title_lower or "0 лет" in title_lower:
            co["has_internship"] = True

        # пример вакансии
        if len(co["vacancies_sample"]) < 5:
            co["vacancies_sample"].append({
                "title": v.get("title"),
                "url": v.get("url"),
                "salary_raw": v.get("salary_raw"),
                "tags": v.get("tags", [])[:8],
            })

    # конвертируем set → list
    for co in companies.values():
        co["stack"] = sorted(co["stack"])
        co["work_formats"] = list(co["work_formats"])
        co["needs_review"] = len(co["stack"]) == 0

    return companies


def run(categories: list[str] | None = None, dry_run: bool = False, detail: bool = False):
    if categories is None:
        categories = CATEGORIES

    today = datetime.utcnow().strftime("%Y%m%d")
    all_vacancies = []

    with get_client() as client:
        for cat in categories:
            for exp in EXPERIENCE_LEVELS:
                print(f"\nDjinni: {cat} / exp={exp}")
                vacs = fetch_vacancy_list(cat, exp, client)
                all_vacancies.extend(vacs)
                time.sleep(0.5)

    print(f"\nВсего вакансий собрано: {len(all_vacancies)}")

    if dry_run:
        print("DRY RUN — примеры:")
        for v in all_vacancies[:5]:
            print(f"  {v['company']} | {v['title']} | {v['salary_raw']}")
        return

    # Сохраняем вакансии
    vac_file = cfg.data_raw / f"djinni_vacancies_{today}.jsonl"
    with open(vac_file, "w", encoding="utf-8") as f:
        for v in all_vacancies:
            f.write(json.dumps(v, ensure_ascii=False) + "\n")
    print(f"✓ Вакансии → {vac_file}")

    # Агрегируем компании
    companies = aggregate_companies(all_vacancies)
    print(f"Уникальных компаний: {len(companies)}")

    comp_file = cfg.data_raw / f"djinni_companies_{today}.jsonl"
    with open(comp_file, "w", encoding="utf-8") as f:
        for co in companies.values():
            f.write(json.dumps(co, ensure_ascii=False) + "\n")
    print(f"✓ Компании → {comp_file}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Djinni Company/Vacancy Scraper")
    parser.add_argument("--categories", nargs="+", default=None,
                        help=f"Категории: {' '.join(CATEGORIES)}")
    parser.add_argument("--detail", action="store_true",
                        help="Парсить детальные страницы вакансий (медленнее)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(categories=args.categories, dry_run=args.dry_run, detail=args.detail)
