#!/usr/bin/env python3
"""
astana_hub.py — парсер школ и программ с AstanaHub + TechOrda

Источники:
  1. astana.hub — акселератор, каталог резидентов (компании)
  2. techorda.kz — государственная программа IT-обучения (школы/буткемпы)
  3. digital.gov.kz — программы цифровизации
  4. nu.edu.kz/sst — School of Sciences and Technology (Назарбаев Ун-т)

Что собираем:
  - Школы (буткемпы, курсы, программы переподготовки)
  - Компании-резиденты AstanaHub (IT компании Казахстана)
  - Программы стажировок при господдержке

Выход: data/raw/astana_hub_schools_{DATE}.jsonl
        data/raw/astana_hub_companies_{DATE}.jsonl
"""

import json
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import sys
import httpx

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import cfg
from bs4 import BeautifulSoup


UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

SOURCES = {
    "techorda": {
        "name": "TechOrda",
        "url": "https://techorda.kz",
        "type": "state_program",
        "country": "KZ",
        "description": "Государственная программа IT-обучения Казахстана",
    },
    "astana_hub": {
        "name": "Astana Hub",
        "url": "https://astanahub.com",
        "type": "accelerator",
        "country": "KZ",
        "description": "Международный технопарк IT-стартапов Казахстана",
    },
}

# Известные программы TechOrda (добавлено вручную как seed data)
TECHORDA_PROGRAMS = [
    {
        "source": "techorda",
        "external_id": "techorda:program:orda-bootcamp",
        "name": "ORDA Bootcamp",
        "description": "Интенсивный буткемп по программированию от TechOrda. Бесплатно для граждан Казахстана.",
        "logo_url": "https://techorda.kz/favicon.ico",
        "website": "https://techorda.kz",
        "country": "KZ",
        "city": "Алматы / Астана",
        "type": "bootcamp",
        "is_free": True,
        "is_online": True,
        "stack": ["Python", "JavaScript", "SQL"],
        "has_internship": True,
        "duration_weeks": 16,
        "parsed_at": datetime.utcnow().isoformat(),
        "needs_review": True,
    },
    {
        "source": "techorda",
        "external_id": "techorda:program:it-career",
        "name": "IT Career",
        "description": "Программа переквалификации специалистов в IT профессии. Финансируется государством.",
        "logo_url": "https://techorda.kz/favicon.ico",
        "website": "https://techorda.kz/it-career",
        "country": "KZ",
        "city": "Казахстан",
        "type": "state_program",
        "is_free": True,
        "is_online": True,
        "stack": ["Python", "JavaScript", "Java", "Data Analysis"],
        "has_internship": True,
        "duration_weeks": 24,
        "parsed_at": datetime.utcnow().isoformat(),
        "needs_review": True,
    },
]

# Известные школы Казахстана (seed data для ручной верификации)
KZ_SCHOOLS_SEED = [
    {
        "source": "manual",
        "external_id": "manual:school:epam-kz",
        "name": "EPAM Learning",
        "description": "Программы обучения от EPAM Systems Kazakhstan. Лабораторные работы, менторство, возможность трудоустройства.",
        "website": "https://www.epam.com/careers/campus",
        "country": "KZ",
        "city": "Алматы",
        "type": "bootcamp",
        "is_free": True,
        "stack": ["Java", "Python", "JavaScript", ".NET", "QA"],
        "has_internship": True,
        "needs_review": True,
        "parsed_at": datetime.utcnow().isoformat(),
    },
    {
        "source": "manual",
        "external_id": "manual:school:beknur",
        "name": "Beknur IT Academy",
        "description": "IT академия Казахстана с курсами программирования, дизайна и маркетинга.",
        "website": "https://beknur.kz",
        "country": "KZ",
        "city": "Алматы",
        "type": "center",
        "is_free": False,
        "stack": ["Python", "JavaScript", "Figma", "1C"],
        "has_internship": False,
        "needs_review": True,
        "parsed_at": datetime.utcnow().isoformat(),
    },
    {
        "source": "manual",
        "external_id": "manual:school:itpark-kz",
        "name": "IT Park Kazakhstan",
        "description": "Курсы и программы при IT Park Kazakhstan. Партнёрство с ведущими компаниями.",
        "website": "https://itpark.kz",
        "country": "KZ",
        "city": "Алматы",
        "type": "bootcamp",
        "is_free": False,
        "stack": ["Python", "JavaScript", "iOS", "Android"],
        "has_internship": True,
        "needs_review": True,
        "parsed_at": datetime.utcnow().isoformat(),
    },
    {
        "source": "manual",
        "external_id": "manual:school:alem-school",
        "name": "Alem School",
        "description": "Школа программирования без учителей по методологии School 42 (peer-to-peer). Бесплатно.",
        "website": "https://alem.school",
        "country": "KZ",
        "city": "Алматы",
        "type": "peer_learning",
        "is_free": True,
        "stack": ["C", "Python", "Algorithms", "Systems Programming"],
        "has_internship": False,
        "needs_review": False,  # хорошо известная школа
        "parsed_at": datetime.utcnow().isoformat(),
    },
    {
        "source": "manual",
        "external_id": "manual:school:qasqyr",
        "name": "Qasqyr Hub",
        "description": "Технологический хаб для молодёжи Казахстана. Буткемпы, хакатоны, менторство.",
        "website": "https://qasqyr.kz",
        "country": "KZ",
        "city": "Нур-Султан",
        "type": "bootcamp",
        "is_free": True,
        "stack": ["Python", "JavaScript", "Flutter"],
        "has_internship": True,
        "needs_review": True,
        "parsed_at": datetime.utcnow().isoformat(),
    },
    {
        "source": "manual",
        "external_id": "manual:school:bilimland",
        "name": "BilimLand",
        "description": "Образовательная платформа Казахстана с курсами для школьников и взрослых.",
        "website": "https://bilimland.kz",
        "country": "KZ",
        "city": "Алматы",
        "type": "center",
        "is_free": False,
        "stack": ["Scratch", "Python", "Robotics"],
        "has_internship": False,
        "needs_review": True,
        "parsed_at": datetime.utcnow().isoformat(),
    },
]


def get_client() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": UA},
        follow_redirects=True,
        timeout=30,
    )


def scrape_astanahub_residents(client: httpx.Client) -> list[dict]:
    """Скрапит резидентов Astana Hub (IT компании)."""
    companies = []
    # AstanaHub имеет страницу резидентов
    url = "https://astanahub.com/ru/residents/"

    try:
        resp = client.get(url)
        if resp.status_code != 200:
            print(f"  AstanaHub residents: status {resp.status_code}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        cards = soup.select(".resident-card, .company-card, .resident-item")

        for card in cards:
            name_el = card.select_one("h3, h4, .resident-name, .company-name")
            name = name_el.get_text(strip=True) if name_el else ""
            if not name:
                continue

            logo_el = card.select_one("img")
            logo = logo_el.get("src", "") if logo_el else ""
            if logo and not logo.startswith("http"):
                logo = urljoin("https://astanahub.com", logo)

            link_el = card.select_one("a")
            href = link_el.get("href", "") if link_el else ""
            website = href if href.startswith("http") else ""

            desc_el = card.select_one("p, .description")
            description = desc_el.get_text(strip=True) if desc_el else ""

            companies.append({
                "source": "astanahub",
                "external_id": f"astanahub:company:{name.lower().replace(' ', '-')}",
                "name": name,
                "description": description,
                "logo_url": logo,
                "website": website,
                "country": "KZ",
                "industry": "IT",
                "employee_count": "",
                "stack": [],
                "has_internship": False,
                "work_formats": ["office"],
                "open_vacancies": 0,
                "parsed_at": datetime.utcnow().isoformat(),
                "needs_review": True,
            })

        print(f"  AstanaHub residents: {len(companies)} компаний")
    except Exception as e:
        print(f"  AstanaHub error: {e}")

    return companies


def run(dry_run: bool = False):
    today = datetime.utcnow().strftime("%Y%m%d")

    print("\n=== AstanaHub / TechOrda Parser ===\n")

    # 1. Seed данные по школам
    schools = TECHORDA_PROGRAMS + KZ_SCHOOLS_SEED
    print(f"Школ из seed данных: {len(schools)}")

    # 2. Попытка скрапинга AstanaHub
    companies = []
    with get_client() as client:
        print("\nСкрапим AstanaHub резидентов...")
        companies = scrape_astanahub_residents(client)

    if dry_run:
        print("\nDRY RUN — школы:")
        for s in schools[:3]:
            print(f"  {s['name']} | {s['type']} | {s['country']}")
        print("\nDRY RUN — компании:")
        for c in companies[:3]:
            print(f"  {c['name']} | {c['country']}")
        return

    # Сохраняем школы
    schools_file = cfg.data_raw / f"astana_hub_schools_{today}.jsonl"
    with open(schools_file, "w", encoding="utf-8") as f:
        for s in schools:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    print(f"\n✓ Школы → {schools_file}")

    # Сохраняем компании
    if companies:
        comp_file = cfg.data_raw / f"astana_hub_companies_{today}.jsonl"
        with open(comp_file, "w", encoding="utf-8") as f:
            for c in companies:
                f.write(json.dumps(c, ensure_ascii=False) + "\n")
        print(f"✓ Компании → {comp_file}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="AstanaHub / TechOrda Schools Parser")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
