#!/usr/bin/env python3
"""
habr_scraper.py — парсер компаний с Habr Career (career.habr.com)

Habr не имеет публичного API, поэтому скрапим HTML.
Habr Career — лучший источник по стекам компаний СНГ:
  - company page раскрывает технологии (Python, Go, React, ...)
  - список компаний фильтруется по стране и специализации

Выход: data/raw/habr_companies_{DATE}.jsonl
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


BASE = "https://career.habr.com"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

# Фильтры по специализации
SPECIALIZATIONS = [
    "Разработка",
    "DevOps / Системное администрирование",
    "Тестирование",
    "Аналитика",
    "Дизайн",
    "Продукт",
    "Данные / ML",
]

# Страны (slug в career.habr.com)
COUNTRIES = {
    "KZ": "kazakhstan",
    "RU": "russia",
    "BY": "belarus",
    "UZ": "uzbekistan",
    "GE": "georgia",
    "AM": "armenia",
    "AZ": "azerbaijan",
}


def get_client() -> httpx.Client:
    return httpx.Client(
        headers={
            "User-Agent": UA,
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        follow_redirects=True,
        timeout=30,
    )


def fetch_company_list(country_slug: str, client: httpx.Client, max_pages: int = 10) -> list[str]:
    """Возвращает список URL компаний со страницы листинга."""
    urls = []
    for page in range(1, max_pages + 1):
        url = f"{BASE}/companies?country={country_slug}&page={page}"
        resp = client.get(url)
        if resp.status_code == 429:
            print("  Rate limit, sleep 15s...")
            time.sleep(15)
            resp = client.get(url)
        if resp.status_code != 200:
            print(f"  Unexpected status {resp.status_code} for {url}")
            break
        soup = BeautifulSoup(resp.text, "html.parser")
        cards = soup.select("a.company-card__title-link")
        if not cards:
            # Попробуем другой селектор (Habr меняет вёрстку)
            cards = soup.select(".company_name a, .companies-list__item a[href*='/companies/']")
        if not cards:
            print(f"  No cards on page {page}, stopping")
            break
        for a in cards:
            href = a.get("href", "")
            if "/companies/" in href:
                full = urljoin(BASE, href)
                if full not in urls:
                    urls.append(full)
        print(f"  page {page}: +{len(cards)} companies, total={len(urls)}")
        time.sleep(1.0)
    return urls


def parse_company_page(url: str, client: httpx.Client) -> dict:
    """Парсит страницу компании career.habr.com/companies/slug."""
    resp = client.get(url)
    if resp.status_code == 429:
        time.sleep(15)
        resp = client.get(url)
    if resp.status_code != 200:
        return {}

    soup = BeautifulSoup(resp.text, "html.parser")

    # Название
    name_el = soup.select_one("h1.company-header__title, .page-header__title h1")
    name = name_el.get_text(strip=True) if name_el else ""

    # Описание
    desc_el = soup.select_one(".company-description__text, .company-about__text")
    description = desc_el.get_text(" ", strip=True) if desc_el else ""

    # Логотип
    logo_el = soup.select_one(".company-header__logo img, .company-avatar img")
    logo_url = logo_el.get("src", "") if logo_el else ""

    # Сайт
    site_el = soup.select_one("a[data-qa='company-site'], .company-contacts a[rel~='nofollow']")
    website = site_el.get("href", "") if site_el else ""

    # Стек технологий
    stack = []
    stack_section = soup.select_one(".company-stack, .tech-stack")
    if stack_section:
        for tag in stack_section.select(".tech-stack__item, .skills__item"):
            t = tag.get_text(strip=True)
            if t:
                stack.append(t)
    # Запасной: ищем список навыков в вакансиях (если нет явного стека)
    if not stack:
        skills_tags = soup.select(".skills-tag__item, .badge")
        stack = list(dict.fromkeys(t.get_text(strip=True) for t in skills_tags if t.get_text(strip=True)))[:30]

    # Количество сотрудников
    employee_el = soup.select_one(".company-summary__employees, [data-qa='employees-count']")
    employee_count = employee_el.get_text(strip=True) if employee_el else ""

    # Отрасль / индустрия
    industry_el = soup.select_one(".company-summary__industry, [data-qa='company-industry']")
    industry = industry_el.get_text(strip=True) if industry_el else ""

    # Slug из URL
    slug = url.rstrip("/").split("/")[-1]

    # Открытые вакансии
    vac_el = soup.select_one("a[href*='/vacancies'] .count, .company-vacancies-count")
    open_vacancies_raw = vac_el.get_text(strip=True) if vac_el else "0"
    try:
        open_vacancies = int(re.sub(r"\D", "", open_vacancies_raw))
    except ValueError:
        open_vacancies = 0

    return {
        "source": "habr",
        "external_id": f"habr:company:{slug}",
        "name": name,
        "description": description[:2000],
        "logo_url": logo_url,
        "website": website,
        "industry": industry,
        "employee_count": employee_count,
        "habr_url": url,
        "open_vacancies": open_vacancies,
        "stack": stack,
        "has_internship": "стаж" in description.lower() or "intern" in description.lower(),
        "work_formats": [],  # определяется из вакансий
        "vacancies_sample": [],
        "parsed_at": datetime.utcnow().isoformat(),
        "needs_review": len(stack) == 0,
    }


def run(countries: list[str], dry_run: bool = False):
    today = datetime.utcnow().strftime("%Y%m%d")

    with get_client() as client:
        for country_code in countries:
            slug = COUNTRIES.get(country_code.upper())
            if not slug:
                print(f"Unknown country: {country_code}")
                continue

            print(f"\n{'='*50}")
            print(f"Habr Career: {country_code} ({slug})")
            print(f"{'='*50}")

            company_urls = fetch_company_list(slug, client)
            print(f"\nНайдено компаний: {len(company_urls)}")

            if dry_run:
                print("DRY RUN:")
                for u in company_urls[:5]:
                    print(f"  {u}")
                continue

            out_file = cfg.data_raw / f"habr_companies_{country_code}_{today}.jsonl"
            written = 0

            with open(out_file, "w", encoding="utf-8") as f:
                for i, url in enumerate(company_urls):
                    print(f"  [{i+1}/{len(company_urls)}] {url}", end="")
                    row = parse_company_page(url, client)
                    if not row:
                        print(" — SKIP")
                        continue
                    print(f" | {row['name']} | {len(row['stack'])} stacks")
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")
                    written += 1
                    time.sleep(1.2)

            print(f"\n✓ Записано {written} компаний → {out_file}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Habr Career Company Scraper")
    parser.add_argument("--countries", nargs="+", default=["KZ"],
                        help="Коды стран: KZ RU BY UZ GE AM AZ")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(countries=args.countries, dry_run=args.dry_run)
