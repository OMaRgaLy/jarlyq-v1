#!/usr/bin/env python3
"""
github_orgs.py — поиск IT-компаний через GitHub Organizations API

GitHub позволяет искать организации по location.
Это даёт нам: tech stack (по языкам репозиториев), публичные проекты,
количество разработчиков — очень сильный сигнал для профиля компании.

Требует: GITHUB_TOKEN в env (бесплатный, rate limit 5000 req/hour vs 60 без токена)

Выход: data/raw/github_orgs_{LOCATION}_{DATE}.jsonl
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path

import sys
import httpx

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import cfg


GITHUB_API = "https://api.github.com"

# Поисковые запросы по локации (GitHub search поддерживает location:)
LOCATIONS = {
    "KZ": ["Kazakhstan", "Almaty", "Astana", "Nur-Sultan", "Shymkent"],
    "UZ": ["Uzbekistan", "Tashkent"],
    "KG": ["Kyrgyzstan", "Bishkek"],
    "GE": ["Georgia", "Tbilisi"],
    "AM": ["Armenia", "Yerevan"],
    "AZ": ["Azerbaijan", "Baku"],
    "BY": ["Belarus", "Minsk"],
    "TR": ["Turkey", "Istanbul", "Ankara"],
}

# Языки → технологии (маппинг для enrichment)
LANG_TO_STACK = {
    "Python": "Python",
    "JavaScript": "JavaScript",
    "TypeScript": "TypeScript",
    "Go": "Go",
    "Rust": "Rust",
    "Java": "Java",
    "Kotlin": "Kotlin",
    "Swift": "Swift",
    "C#": "C#",
    "C++": "C++",
    "PHP": "PHP",
    "Ruby": "Ruby",
    "Scala": "Scala",
    "Dart": "Flutter",
    "Shell": "DevOps",
    "HCL": "Terraform",
    "Dockerfile": "Docker",
}


def get_client(token: str | None = None) -> httpx.Client:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Jarlyq/1.0",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return httpx.Client(headers=headers, timeout=30)


def search_orgs(query: str, client: httpx.Client, max_pages: int = 5) -> list[dict]:
    """Ищет организации через GitHub Search API."""
    orgs = []
    for page in range(1, max_pages + 1):
        resp = client.get(
            f"{GITHUB_API}/search/users",
            params={
                "q": f"{query} type:org",
                "per_page": 30,
                "page": page,
                "sort": "repositories",
            }
        )
        if resp.status_code == 403:
            remaining = resp.headers.get("X-RateLimit-Remaining", "?")
            reset_at = resp.headers.get("X-RateLimit-Reset", "?")
            print(f"  Rate limit! Remaining={remaining}, reset={reset_at}")
            time.sleep(60)
            continue
        if resp.status_code != 200:
            print(f"  Error: {resp.status_code}")
            break

        data = resp.json()
        items = data.get("items", [])
        if not items:
            break

        orgs.extend(items)
        total = data.get("total_count", 0)
        print(f"  '{query}' page {page}: +{len(items)} orgs (total={total})")

        # GitHub Search ограничен 1000 результатами
        if page * 30 >= min(total, 1000):
            break

        time.sleep(0.5)

    return orgs


def fetch_org_detail(login: str, client: httpx.Client) -> dict:
    """Получает детальный профиль организации."""
    resp = client.get(f"{GITHUB_API}/orgs/{login}")
    if resp.status_code == 404:
        return {}
    if resp.status_code != 200:
        return {}
    return resp.json()


def fetch_org_languages(login: str, client: httpx.Client, max_repos: int = 10) -> list[str]:
    """Получает топ языки из репозиториев организации."""
    resp = client.get(
        f"{GITHUB_API}/orgs/{login}/repos",
        params={"per_page": max_repos, "sort": "updated", "type": "public"}
    )
    if resp.status_code != 200:
        return []

    repos = resp.json()
    lang_counts: dict[str, int] = {}
    for repo in repos:
        lang = repo.get("language")
        if lang:
            lang_counts[lang] = lang_counts.get(lang, 0) + 1

    # Сортируем по частоте
    sorted_langs = sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)
    return [LANG_TO_STACK.get(l, l) for l, _ in sorted_langs[:10]]


def normalize_org(detail: dict, languages: list[str], country_code: str) -> dict:
    """Приводит GitHub org к Jarlyq формату."""
    login = detail.get("login", "")
    return {
        "source": "github",
        "external_id": f"github:org:{login}",
        "name": detail.get("name") or login,
        "description": (detail.get("description") or "")[:1000],
        "logo_url": detail.get("avatar_url", ""),
        "website": detail.get("blog", "") or f"https://github.com/{login}",
        "country": country_code,
        "industry": "IT",
        "employee_count": str(detail.get("public_members_count") or ""),
        "github_url": f"https://github.com/{login}",
        "open_vacancies": 0,
        "stack": languages,
        "has_internship": False,
        "work_formats": [],
        "public_repos": detail.get("public_repos", 0),
        "followers": detail.get("followers", 0),
        "location": detail.get("location", ""),
        "email": detail.get("email", ""),
        "parsed_at": datetime.utcnow().isoformat(),
        "needs_review": len(languages) == 0,
    }


def run(countries: list[str], token: str | None = None, detail: bool = True, dry_run: bool = False):
    token = token or cfg.github_token
    if not token:
        print("WARNING: No GITHUB_TOKEN — rate limit is 60 req/hour. Set GITHUB_TOKEN env var.")

    today = datetime.utcnow().strftime("%Y%m%d")

    with get_client(token) as client:
        for country_code in countries:
            locations = LOCATIONS.get(country_code.upper(), [])
            if not locations:
                print(f"Unknown country: {country_code}")
                continue

            print(f"\n{'='*50}")
            print(f"GitHub Orgs: {country_code}")
            print(f"{'='*50}")

            all_orgs: dict[str, dict] = {}

            for location_query in locations:
                orgs = search_orgs(f"location:{location_query}", client)
                for o in orgs:
                    login = o.get("login", "")
                    if login and login not in all_orgs:
                        all_orgs[login] = o

            print(f"\nУникальных org: {len(all_orgs)}")

            if dry_run:
                print("DRY RUN:")
                for login in list(all_orgs.keys())[:5]:
                    print(f"  {login}")
                continue

            out_file = cfg.data_raw / f"github_orgs_{country_code}_{today}.jsonl"
            written = 0

            with open(out_file, "w", encoding="utf-8") as f:
                for i, (login, org_basic) in enumerate(all_orgs.items()):
                    print(f"  [{i+1}/{len(all_orgs)}] {login}", end="")

                    if detail:
                        org_detail = fetch_org_detail(login, client)
                        languages = fetch_org_languages(login, client)
                        time.sleep(0.3)
                    else:
                        org_detail = org_basic
                        languages = []

                    if not org_detail:
                        print(" — SKIP")
                        continue

                    row = normalize_org(org_detail, languages, country_code)
                    print(f" | {row['name']} | {len(languages)} langs | repos={row['public_repos']}")
                    f.write(json.dumps(row, ensure_ascii=False) + "\n")
                    written += 1

            print(f"\n✓ Записано {written} орг → {out_file}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="GitHub Organizations Parser")
    parser.add_argument("--countries", nargs="+", default=["KZ"],
                        help="Коды стран: KZ UZ KG GE AM AZ BY TR")
    parser.add_argument("--token", default=None, help="GitHub Personal Access Token")
    parser.add_argument("--no-detail", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    run(
        countries=args.countries,
        token=args.token,
        detail=not args.no_detail,
        dry_run=args.dry_run,
    )
