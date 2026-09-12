# Jarlyq — Data Pipeline

Инструмент для сбора, AI-обогащения и загрузки данных компаний, школ и стажировок.

## Структура

```
scripts/
├── config.py          ← загрузчик .env (все токены отсюда)
├── pipeline.py        ← оркестратор: запускает всё за один шаг
├── enrich.py          ← AI-обогащение профилей (Groq / Gemini / Ollama)
├── export.py          ← загрузка в Jarlyq через Admin API
├── tg_channels.json   ← список Telegram-каналов с вакансиями
├── requirements.txt
├── collect/
│   ├── hh.py          ← HH.ru API (компании + вакансии)
│   ├── habr.py        ← Habr Career (стеки компаний)
│   ├── djinni.py      ← Djinni.co (junior вакансии)
│   ├── github.py      ← GitHub Organizations по локации
│   ├── astana_hub.py  ← TechOrda / Alem School (KZ школы)
│   └── telegram.py    ← Telegram-каналы вакансий (Telethon)
└── data/
    ├── raw/           ← сырые JSONL от парсеров
    ├── enriched/      ← AI-обогащённые файлы
    └── merged/        ← итоговые дедуплицированные файлы
```

---

## Быстрый старт

```bash
cd scripts
pip install -r requirements.txt

# Тест без записи файлов
python collect/hh.py --dry-run

# Компании Казахстана из HH.ru
python collect/hh.py --countries KZ

# Полный пайплайн: сбор → AI → мёрж
python pipeline.py --countries KZ --sources all --enrich
```

---

## Настройка токенов

Все токены хранятся в корневом `.env` (один файл для всего проекта).
Открой `../.env` и заполни нужные секции:

### Groq AI (обязательно для AI-обогащения)
Бесплатно, лимит 30 req/min, модель LLaMA-3.3 70B.
1. Зарегистрируйся на [console.groq.com](https://console.groq.com)
2. API Keys → Create API Key
3. Добавь в `.env`:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxx
```

### GitHub (для парсинга организаций)
Бесплатно, лимит 5000 req/hour (против 60 без токена).
1. Зайди на [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate new token (classic) → scope: `public_repo`
3. Добавь в `.env`:
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

### Telegram (для парсинга каналов вакансий)
Нужен аккаунт Telegram (не бот, а твой личный).
1. Зайди на [my.telegram.org](https://my.telegram.org)
2. Войди своим номером телефона
3. API development tools → Create application
4. Скопируй `App api_id` и `App api_hash`
5. Добавь в `.env`:
```
TG_API_ID=12345678
TG_API_HASH=abc123def456...
TG_PHONE=+77001234567
```
При первом запуске Telethon попросит код из Telegram (одноразово).

### Jarlyq Admin API
Для загрузки данных в БД через Admin API.
Либо токен (JWT из браузера после логина), либо email+пароль:
```
JARLYQ_ADMIN_TOKEN=eyJ...   # вариант 1: токен напрямую
# или
ADMIN_EMAIL=admin@jarlyq.kz  # вариант 2: логин
ADMIN_PASSWORD=yourpassword
```

---

## Команды

### Сбор данных

```bash
# HH.ru — профили компаний (8 стран CIS)
python collect/hh.py --mode companies --countries KZ UZ KG

# HH.ru — вакансии с AI-NER (стек, уровень, зарплата)
python collect/hh.py --mode vacancies --countries KZ --type internship

# Habr Career — стеки компаний
python collect/habr.py --countries KZ RU

# Djinni — junior вакансии
python collect/djinni.py

# GitHub Organizations по геолокации
python collect/github.py --countries KZ UZ

# Школы Казахстана (TechOrda, Alem School, ...)
python collect/astana_hub.py

# Telegram-каналы вакансий (за последние 7 дней)
python collect/telegram.py --days 7
python collect/telegram.py --channel ittaldau --dry-run
```

### AI-обогащение

```bash
# Обогатить один файл
python enrich.py --input data/raw/hh_companies_KZ_20240101.jsonl

# Все файлы в папке
python enrich.py --input data/raw/ --all

# Только записи с needs_review=true (по умолчанию)
python enrich.py --input data/raw/hh_companies_KZ_20240101.jsonl

# Все записи принудительно
python enrich.py --input data/raw/hh_companies_KZ_20240101.jsonl --all-records

# Тест: только первые 5 записей
python enrich.py --input data/raw/hh_companies_KZ_20240101.jsonl --limit 5
```

### Дедупликация и мёрж

```bash
# Объединить все сырые файлы компаний
python pipeline.py --merge-only

# Мёрж с обогащёнными файлами
python pipeline.py --merge-only --enrich
```

### Загрузка в БД

```bash
# Загрузить компании
python export.py --entity companies --input data/merged/companies_20240101.jsonl

# Загрузить школы
python export.py --entity schools --input data/merged/schools_20240101.jsonl

# Dry-run: проверить без записи
python export.py --entity companies --input data/merged/companies_20240101.jsonl --dry-run

# Пропустить записи с needs_review
python export.py --entity companies --input data/merged/ --all --skip-needs-review
```

### Полный пайплайн

```bash
# KZ: все источники без AI (быстро)
python pipeline.py --countries KZ --sources all

# KZ + AI обогащение
python pipeline.py --countries KZ --sources all --enrich

# Несколько стран, только HH + Habr
python pipeline.py --countries KZ UZ KG --sources hh habr

# Только вакансии (стажировки)
python pipeline.py --countries KZ --sources hh_vacancies telegram
```

### Telegram-каналы

Список каналов в `tg_channels.json`. Добавь новые:

```json
{
  "channels": [
    {"username": "ittaldau",   "country": "KZ", "lang": "ru", "note": "IT вакансии KZ"},
    {"username": "uzdevjobs",  "country": "UZ", "lang": "ru", "note": "Dev вакансии UZ"}
  ],
  "settings": {
    "days_back": 7,
    "max_messages_per_channel": 200
  }
}
```

---

## Формат данных

### Компания (JSONL)
```json
{
  "source": "hh",
  "external_id": "hh:employer:1234",
  "name": "Kaspi Bank",
  "description": "...",
  "logo_url": "https://...",
  "website": "https://kaspi.kz",
  "country": "KZ",
  "industry": "Fintech",
  "employee_count": "10000+",
  "stack": ["Python", "Go", "Kotlin", "React"],
  "has_internship": true,
  "work_formats": ["office", "hybrid"],
  "open_vacancies": 42,
  "needs_review": false,
  "parsed_at": "2024-01-01T00:00:00"
}
```

### Вакансия / стажировка (JSONL)
```json
{
  "source": "hh",
  "external_id": "hh:vacancy:5678",
  "type": "internship",
  "title": "Junior Python Developer (стажировка)",
  "company_name": "Kaspi Bank",
  "stack": ["Python", "Django", "PostgreSQL"],
  "level": "intern",
  "work_format": "office",
  "salary_min": 150000,
  "salary_max": 250000,
  "salary_currency": "KZT",
  "city": "Алматы",
  "country": "KZ",
  "apply_url": "https://hh.kz/vacancy/5678",
  "needs_review": false
}
```

---

## Источники по странам

| Страна | HH  | Habr | Djinni | GitHub | Telegram | Другие        |
|--------|-----|------|--------|--------|----------|---------------|
| KZ     | ✓   | ✓    | ✓      | ✓      | ✓        | AstanaHub, TechOrda |
| UZ     | ✓   | ✓    | ✓      | ✓      | ✓        | IT Park UZ    |
| KG     | ✓   | —    | ✓      | ✓      | ✓        | —             |
| RU     | ✓   | ✓    | ✓      | ✓      | ✓        | —             |
| BY     | ✓   | ✓    | ✓      | ✓      | —        | —             |
| GE     | —   | —    | ✓      | ✓      | —        | —             |
| AM     | ✓   | —    | —      | ✓      | —        | —             |
| AZ     | ✓   | —    | —      | ✓      | —        | —             |
| TR     | —   | —    | —      | ✓      | —        | —             |
