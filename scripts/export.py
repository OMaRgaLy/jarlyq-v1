#!/usr/bin/env python3
"""
export_to_db.py — загрузка нормализованных данных в Jarlyq PostgreSQL

Два режима:
  1. Через Admin API (рекомендуется):
     POST /api/v1/admin/companies  — создаёт компанию
     POST /api/v1/admin/schools    — создаёт школу
     Требует: ADMIN_EMAIL + ADMIN_PASSWORD или ADMIN_TOKEN

  2. Прямое подключение к PostgreSQL (если API не доступен):
     Требует: DATABASE_URL

Использование:
  python export_to_db.py --input data/merged/companies_20240101.jsonl --entity companies
  python export_to_db.py --input data/merged/schools_20240101.jsonl --entity schools
  python export_to_db.py --input data/merged/ --all --entity companies
  python export_to_db.py --dry-run --input data/merged/companies_20240101.jsonl --entity companies

ENV переменные:
  JARLYQ_API_URL     — базовый URL API (default: http://localhost:8080/api/v1)
  ADMIN_TOKEN        — JWT токен администратора (или получаем через email+password)
  ADMIN_EMAIL        — email для получения токена
  ADMIN_PASSWORD     — пароль
  DATABASE_URL       — для режима прямого подключения
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import sys
from pathlib import Path
import httpx

sys.path.insert(0, str(Path(__file__).parent))
from config import cfg

API_URL = cfg.jarlyq_api_url
MERGED_DIR = cfg.data_merged


# ── Auth ──────────────────────────────────────────────────────────────────────

def get_admin_token() -> str:
    """Получает JWT токен администратора."""
    token = cfg.jarlyq_admin_token
    if token:
        return token

    email = cfg.admin_email
    password = cfg.admin_password
    if not email or not password:
        print("ERROR: Заполни JARLYQ_ADMIN_TOKEN или ADMIN_EMAIL+ADMIN_PASSWORD в .env")
        sys.exit(1)

    resp = httpx.post(
        f"{API_URL}/auth/login",
        json={"email": email, "password": password},
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"ERROR: Login failed: {resp.status_code} {resp.text}")
        sys.exit(1)

    data = resp.json()
    token = data.get("accessToken") or data.get("access_token") or data.get("token")
    if not token:
        print(f"ERROR: No token in response: {data}")
        sys.exit(1)

    print(f"✓ Авторизован как {email}")
    return token


# ── Маппинг полей ─────────────────────────────────────────────────────────────

def map_company(raw: dict) -> dict:
    """Конвертирует сырой профиль в формат API /admin/companies."""
    # Форматы работы
    formats = raw.get("work_formats", [])
    is_remote = "remote" in formats
    is_hybrid = "hybrid" in formats
    is_office = "office" in formats or (not is_remote and not is_hybrid)

    return {
        "name": raw.get("name", "").strip(),
        "description": raw.get("description_ru") or raw.get("description") or "",
        "logoUrl": raw.get("logo_url", ""),
        "website": raw.get("website", ""),
        "country": raw.get("country", ""),
        "industry": raw.get("industry", "IT"),
        "employeeCount": str(raw.get("employee_count") or ""),
        "isRemote": is_remote,
        "isHybrid": is_hybrid,
        "isOffice": is_office,
        "hasInternship": raw.get("has_internship", False),
        "isActive": True,
        "isVerified": False,  # нужна ручная верификация
        "stacks": raw.get("stack", []),
        # Метаданные источника
        "externalId": raw.get("external_id", ""),
        "sourceUrl": (
            raw.get("hh_url") or
            raw.get("habr_url") or
            raw.get("github_url") or
            raw.get("website", "")
        ),
        "openVacancies": raw.get("open_vacancies", 0),
    }


def map_school(raw: dict) -> dict:
    """Конвертирует сырой профиль в формат API /admin/schools."""
    return {
        "name": raw.get("name", "").strip(),
        "description": raw.get("description_ru") or raw.get("description") or "",
        "logoUrl": raw.get("logo_url", ""),
        "website": raw.get("website", ""),
        "country": raw.get("country", "KZ"),
        "city": raw.get("city", ""),
        "type": raw.get("type", "center"),
        "isOnline": raw.get("is_online", True),
        "isFree": raw.get("is_free", False),
        "hasInternship": raw.get("has_internship", False),
        "isActive": True,
        "isVerified": False,
        "stacks": raw.get("stack", []),
        "durationWeeks": raw.get("duration_weeks"),
        "externalId": raw.get("external_id", ""),
    }


# ── API клиент ────────────────────────────────────────────────────────────────

class JarlyqAPIClient:
    def __init__(self, token: str):
        self.token = token
        self.client = httpx.Client(
            base_url=API_URL,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        self.created = 0
        self.skipped = 0
        self.errors = 0

    def upsert_company(self, data: dict, dry_run: bool = False) -> bool:
        if dry_run:
            print(f"    [DRY] POST /admin/companies — {data['name']}")
            return True

        resp = self.client.post("/admin/companies", json=data)
        if resp.status_code in (200, 201):
            return True
        if resp.status_code == 409:
            # Уже существует — пробуем найти и обновить
            return self._try_update_company(data)
        print(f"    ERROR {resp.status_code}: {resp.text[:200]}")
        return False

    def _try_update_company(self, data: dict) -> bool:
        """Ищет компанию по имени и обновляет."""
        resp = self.client.get("/admin/companies", params={"q": data["name"], "per_page": 5})
        if resp.status_code != 200:
            return False
        items = resp.json().get("items") or resp.json().get("companies") or []
        for item in items:
            if item.get("name", "").lower() == data["name"].lower():
                company_id = item.get("id")
                update_resp = self.client.put(f"/admin/companies/{company_id}", json=data)
                return update_resp.status_code in (200, 204)
        return False

    def upsert_school(self, data: dict, dry_run: bool = False) -> bool:
        if dry_run:
            print(f"    [DRY] POST /admin/schools — {data['name']}")
            return True

        resp = self.client.post("/admin/schools", json=data)
        if resp.status_code in (200, 201):
            return True
        if resp.status_code == 409:
            return self._try_update_school(data)
        print(f"    ERROR {resp.status_code}: {resp.text[:200]}")
        return False

    def _try_update_school(self, data: dict) -> bool:
        resp = self.client.get("/admin/schools", params={"q": data["name"], "per_page": 5})
        if resp.status_code != 200:
            return False
        items = resp.json().get("items") or resp.json().get("schools") or []
        for item in items:
            if item.get("name", "").lower() == data["name"].lower():
                sid = item.get("id")
                update_resp = self.client.put(f"/admin/schools/{sid}", json=data)
                return update_resp.status_code in (200, 204)
        return False

    def close(self):
        self.client.close()


# ── Основной экспорт ──────────────────────────────────────────────────────────

def process_file(input_path: Path, entity: str, api: JarlyqAPIClient,
                 dry_run: bool = False, limit: int | None = None,
                 skip_needs_review: bool = False):
    """Загружает один JSONL файл в базу через API."""
    records = []
    with open(input_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    if limit:
        records = records[:limit]

    total = len(records)
    print(f"\n{input_path.name}: {total} записей")

    for i, raw in enumerate(records):
        name = raw.get("name", "?")

        if skip_needs_review and raw.get("needs_review", False):
            print(f"  [{i+1}/{total}] SKIP needs_review — {name}")
            api.skipped += 1
            continue

        # Фильтруем записи без имени
        if not name or name == "?":
            api.skipped += 1
            continue

        print(f"  [{i+1}/{total}] {name}...", end="", flush=True)

        if entity == "companies":
            data = map_company(raw)
            ok = api.upsert_company(data, dry_run=dry_run)
        elif entity == "schools":
            data = map_school(raw)
            ok = api.upsert_school(data, dry_run=dry_run)
        else:
            print(f" UNKNOWN entity {entity}")
            continue

        if ok:
            api.created += 1
            print(f" ✓")
        else:
            api.errors += 1
            print(f" ✗")

        if not dry_run:
            time.sleep(0.1)  # не флудим API


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Jarlyq DB Exporter")
    parser.add_argument("--input", required=True, help="JSONL файл или директория")
    parser.add_argument("--entity", required=True, choices=["companies", "schools"],
                        help="Тип сущности")
    parser.add_argument("--all", action="store_true",
                        help="Загрузить все .jsonl файлы из директории")
    parser.add_argument("--limit", type=int, default=None,
                        help="Максимум записей (для тестирования)")
    parser.add_argument("--skip-needs-review", action="store_true",
                        help="Пропускать записи с needs_review=true")
    parser.add_argument("--dry-run", action="store_true",
                        help="Не писать в базу, только показывать")
    args = parser.parse_args()

    input_path = Path(args.input)
    if args.all and input_path.is_dir():
        files = sorted(input_path.glob(f"{args.entity}_*.jsonl"))
        if not files:
            files = sorted(input_path.glob("*.jsonl"))
    elif input_path.is_file():
        files = [input_path]
    else:
        print(f"Not found: {input_path}")
        sys.exit(1)

    if not files:
        print("No files found")
        sys.exit(1)

    print(f"\nJarlyq Exporter")
    print(f"API:    {API_URL}")
    print(f"Entity: {args.entity}")
    print(f"Files:  {len(files)}")
    print(f"DryRun: {args.dry_run}")

    token = get_admin_token()
    api = JarlyqAPIClient(token)

    start = datetime.utcnow()

    try:
        for f in files:
            process_file(
                f, args.entity, api,
                dry_run=args.dry_run,
                limit=args.limit,
                skip_needs_review=args.skip_needs_review,
            )
    finally:
        api.close()

    elapsed = (datetime.utcnow() - start).total_seconds()
    total_processed = api.created + api.skipped + api.errors

    print(f"\n{'='*50}")
    print(f"ИТОГО:")
    print(f"  Загружено:  {api.created}")
    print(f"  Пропущено:  {api.skipped}")
    print(f"  Ошибок:     {api.errors}")
    print(f"  Время:      {elapsed:.1f}s")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
