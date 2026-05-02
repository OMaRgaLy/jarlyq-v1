# Jarlyq — Гайд по запуску, настройке и деплою

## Структура проекта

```
jarlyq-v1/
├── backend/          ← Go + Gin + GORM
├── frontend/         ← Next.js 14
├── scripts/          ← Python парсеры
│   ├── hh_parser.py      ← парсер hh.ru
│   ├── raw/              ← сырые файлы от парсера (создаётся автоматически)
│   └── ai_data_parser.py ← старый парсер (Claude API)
└── docker-compose.yml
```

---

## 1. Локальный запуск (разработка)

### Требования
- Go 1.22+
- Node.js 20+
- Docker Desktop (для PostgreSQL)
- Python 3.11+ (для парсеров)

### Шаг 1 — База данных
```bash
# Запустить только PostgreSQL через Docker
docker-compose up -d postgres

# Или вручную если нет Docker:
# createdb jarlyq && createuser jarlyq
```

### Шаг 2 — Бэкенд
```bash
cd backend

# Скопировать env файл
cp .env.example .env
# Заполнить: DB_URL, JWT_SECRET, SMTP_*, GOOGLE_CLIENT_ID

# Запустить (автоматически мигрирует и сидирует БД)
go run ./cmd/app/main.go

# Бэкенд запустится на http://localhost:8080
```

**Переменные окружения бэкенда (`.env`):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jarlyq
DB_USER=jarlyq
DB_PASSWORD=jarlyq

JWT_SECRET=твой-секрет-минимум-32-символа
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=720h

APP_BASE_URL=http://localhost:3000

# SMTP (для писем верификации и сброса пароля)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=твой@gmail.com
SMTP_PASSWORD=app-password
SMTP_FROM=noreply@jarlyq.kz

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=...

PORT=8080
```

### Шаг 3 — Фронтенд
```bash
cd frontend

npm install

# Скопировать env
cp .env.local.example .env.local
# Заполнить NEXT_PUBLIC_API_URL

npm run dev
# Фронтенд на http://localhost:3000
```

**Переменные фронтенда (`.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Шаг 4 — Создать admin пользователя
```bash
# Зарегистрируйся через /auth на фронте
# Потом через psql или любой DB клиент:
UPDATE users SET role = 'admin' WHERE email = 'твой@email.com';
```

После этого заходи на `/admin` — откроется панель управления.

---

## 2. Admin панель — как пользоваться

### Компании
1. Зайди `/admin/companies`
2. Нажми **"Полный редактор"** рядом с компанией
3. Табы:
   - **📝 Основное** — название, описание, стек технологий (кликай теги), логотип, контакты
   - **💼 Вакансии** — добавить стажировку или вакансию
   - **🎯 Витрина** — pinned блоки (новость, ивент, вакансия)
   - **🖼 Галерея** — фотографии офиса/команды
   - **🏢 Офисы** — адреса офисов
   - **👥 HR-контакты** — контакты рекрутеров
   - **🏅 Значки** — плашки (Топ работодатель, В тренде и т.д.)
   - **🎨 Тема** — цвета карточки компании

### Школы
1. Зайди `/admin/schools`
2. **"Полный редактор"** → 4 таба: Основное, Программы, Значки, Тема

### Значки (badges)
- Показываются на карточках в каталоге
- Цвет отличается в светлой/тёмной теме
- Можно создать кастомный с любым эмодзи

### Стеки компании
- В табе "Основное" нажимай на теги технологий
- Синий = выбрано, серый = не выбрано
- Нажми "Сохранить" — стеки привяжутся к компании
- После этого компания появится в фильтре по стеку на `/companies`

---

## 3. Парсер hh.ru

### Настройка
```bash
cd scripts

pip install httpx python-dotenv groq

# Создать .env в папке scripts/
cat > .env << EOF
GROQ_API_KEY=gsk_...          # получить на console.groq.com (бесплатно)
JARLYQ_ADMIN_TOKEN=...        # JWT токен admin пользователя
JARLYQ_API_URL=http://localhost:8080
EOF
```

**Как получить JARLYQ_ADMIN_TOKEN:**
1. Зайди на `/auth`, войди как admin
2. Открой DevTools → Application → Local Storage
3. Скопируй значение `jarlyq_token`

### Запуск
```bash
# Тест без записи в БД (посмотреть что найдёт)
python hh_parser.py --dry-run --country KZ

# Только стажировки в Казахстане
python hh_parser.py --country KZ --type internship

# Все страны (KZ + UZ + KG), все типы
python hh_parser.py

# Без AI нормализации (быстрее, меньше точности)
python hh_parser.py --no-ai --country KZ

# Сохранить результат в файл
python hh_parser.py --dry-run --output result.json
```

### Что делает парсер
1. Забирает IT-вакансии с hh.ru по странам
2. Для каждой — загружает полное описание
3. Сохраняет сырой текст в `scripts/raw/YYYY-MM-DD/hh_ID.txt`
4. Groq (Llama 3.3 70B) извлекает: стек, уровень, формат, зарплату
5. Если AI не уверен (confidence < 0.7) — ставит `needs_review = true`
6. Создаёт компанию если нет, потом вакансию
7. Пропускает дубликаты по `external_id`

### Расписание (cron)
```bash
# Запускать каждый день в 6 утра
0 6 * * * cd /path/to/jarlyq-v1/scripts && python hh_parser.py >> logs/hh_parser.log 2>&1
```

---

## 4. Деплой на VPS

### Требования
- VPS: Ubuntu 22.04, минимум 2GB RAM
- Docker + Docker Compose
- Домен с A-записью на IP сервера

### Структура на сервере
```
/opt/jarlyq/
├── docker-compose.prod.yml
├── .env.backend
├── .env.frontend
└── nginx/
    └── jarlyq.conf
```

### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_DB: jarlyq
      POSTGRES_USER: jarlyq
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    image: ghcr.io/yourusername/jarlyq-backend:latest
    restart: always
    env_file: .env.backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  pgdata:
```

### Nginx конфиг (`/etc/nginx/sites-available/jarlyq`)
```nginx
server {
    listen 80;
    server_name api.jarlyq.kz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.jarlyq.kz;

    ssl_certificate /etc/letsencrypt/live/api.jarlyq.kz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.jarlyq.kz/privkey.pem;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req zone=api burst=10 nodelay;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL сертификат
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.jarlyq.kz
```

### Деплой бэкенда
```bash
# На своём компьютере — собери Docker образ
cd backend
docker build -t jarlyq-backend .
docker tag jarlyq-backend ghcr.io/yourusername/jarlyq-backend:latest
docker push ghcr.io/yourusername/jarlyq-backend:latest

# На сервере
ssh user@your-vps-ip
cd /opt/jarlyq
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Деплой фронтенда (Vercel — рекомендуется)
```bash
# Один раз
npm install -g vercel
cd frontend
vercel

# Переменные в Vercel Dashboard:
# NEXT_PUBLIC_API_URL = https://api.jarlyq.kz
```

Или через GitHub — подключи репо к Vercel, он сам деплоит при push в main.

### Переменные на проде (.env.backend на сервере)
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=jarlyq
DB_USER=jarlyq
DB_PASSWORD=очень-сложный-пароль

JWT_SECRET=очень-длинный-секрет-минимум-64-символа
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=720h

APP_BASE_URL=https://jarlyq.kz

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@jarlyq.kz
SMTP_PASSWORD=gmail-app-password
SMTP_FROM=noreply@jarlyq.kz

GOOGLE_CLIENT_ID=...
PORT=8080
```

---

## 5. Проверка что всё работает

```bash
# Бэкенд здоров?
curl http://localhost:8080/api/v1/stacks

# Компании?
curl http://localhost:8080/api/v1/companies

# Admin (нужен токен)
curl -H "Authorization: Bearer TOKEN" http://localhost:8080/api/v1/admin/companies
```

---

## 6. Частые проблемы

| Проблема | Решение |
|---|---|
| `tsc` ошибки в footer.tsx | Игнорировать — pre-existing, не наши |
| `@/lib/...` не резолвится | Использовать relative путь `../../../lib/...` |
| Admin панель 401 | Токен протух — перелогинься, скопируй новый |
| Парсер `needs_review` | Зайди в `/admin`, проверь вакансии вручную |
| БД не мигрировала | Перезапусти бэкенд — AutoMigrate запускается при старте |
