# JARLYQ — AI CONTEXT FILE (v2)
> Этот файл — «память» проекта для ИИ-ассистентов. Читай его первым делом.
> Обновляй после каждого значимого изменения.

## CHANGELOG
| Версия | Дата | Изменения |
|--------|------|-----------|
| v1 | 2026-04-29 | Первичный анализ, создание файла памяти |
| v2 | 2026-04-30 | Фиксы: privacy save error, max body size 2MB; Редизайн: globals.css design system, CompanyCard с лого+verified, Skeleton shimmer, Footer multi-column |
| v3 | 2026-04-30 | CMS Phase 1 завершена: EntityBadge+EntityTheme в models.go, cms.go (showcase/photos/offices/hr/badges/themes API), роуты в admin.go, admin-api.ts типы, `/admin/companies/[id]/` tabbed editor (8 табов) |
| v4 | 2026-04-30 | School editor: School модель расширена (about, ageRange, audience, city, isVerified), SCHOOL_TYPES (6 типов: bootcamp/university/state_program/center/peer_learning/university_abroad), `/admin/schools/[id]/` tabbed editor (4 таба: основное/курсы/значки/тема) |

## 1. СУТЬ ПРОЕКТА

**Jarlyq** — платформа IT-возможностей для Центральной Азии (Казахстан, Кыргызстан, Узбекистан).  
**Цель:** помочь людям найти своё место в мире через стажировки, вакансии, курсы и карьерные пути.  
**Аудитория:** студенты, джуниоры, специалисты в поиске работы + компании и школы как поставщики контента.  
**Миссия основателя:** «Помочь людям найти своё место в мире через стажировки и понять какие возможности вообще есть в мире».

---

## 2. СТЕК ТЕХНОЛОГИЙ

### Backend
- **Язык:** Go 1.24
- **Фреймворк:** Gin (HTTP router)
- **ORM:** GORM + PostgreSQL (prod) / SQLite (тесты)
- **Auth:** JWT (access + refresh), Google OAuth
- **Безопасность:** CSRF double-submit cookie, Rate limiting (ulule/limiter), CORS
- **Логирование:** Zap
- **Документация API:** Swagger (swaggo)
- **Email:** SMTP (кастомный mailer)
- **Модуль:** `github.com/OMaRgaLy/jarlyq-v1/backend`

### Frontend
- **Фреймворк:** Next.js 14 (App Router), TypeScript
- **Стили:** TailwindCSS 3
- **Компоненты:** Radix UI
- **Запросы:** TanStack Query (React Query) + Axios
- **Auth:** Google OAuth (@react-oauth/google)
- **Темы:** next-themes (dark/light)
- **i18n:** самописный (lib/i18n.ts, ~92kb JSON)

### Инфраструктура
- Docker + Docker Compose
- Nginx (reverse proxy + SSL termination)
- Certbot (Let's Encrypt автообновление)
- Make (команды: up, down, logs, build, test, ssl-init)

### Скрипты (Python)
- `scripts/ai_data_parser.py` — парсинг данных компаний через Claude API
- `scripts/import_to_db.py` — импорт JSON данных в БД

---

## 3. СТРУКТУРА РЕПОЗИТОРИЯ

```
jarlyq-v1/
├── backend/
│   ├── cmd/api/           # точка входа (main.go)
│   ├── internal/
│   │   ├── auth/          # JWT Manager (генерация/парсинг токенов)
│   │   ├── config/        # конфиг из env
│   │   ├── middleware/    # auth.go, admin.go, csrf.go, audit.go, owner.go, logger.go
│   │   ├── model/         # models.go — ВСЕ GORM модели (692 строки)
│   │   ├── repository/    # слой БД (15 файлов: user, company, job, education, etc.)
│   │   ├── seed/          # сидирование БД начальными данными
│   │   ├── server/        # инициализация HTTP сервера
│   │   ├── service/       # бизнес-логика (18 файлов + тесты)
│   │   └── transport/http/ # HTTP хендлеры (20 файлов)
│   ├── migrations/        # SQL миграции (1 файл: init)
│   └── pkg/
│       ├── logger/        # обёртка Zap
│       └── mailer/        # SMTP отправка писем
├── frontend/
│   ├── app/               # Next.js App Router (19 роутов)
│   │   ├── page.tsx       # главная страница
│   │   ├── auth/          # страницы авторизации
│   │   ├── admin/         # панель администратора
│   │   ├── companies/     # каталог и профили компаний
│   │   ├── internships/   # стажировки
│   │   ├── jobs/          # вакансии
│   │   ├── schools/       # школы и курсы
│   │   ├── career-paths/  # карьерные пути
│   │   ├── interview/     # вопросы на собеседование
│   │   ├── project-ideas/ # идеи пет-проектов
│   │   ├── hackathons/    # хакатоны
│   │   ├── masters/       # магистратура
│   │   ├── dashboard/     # ЛК компании/школы
│   │   ├── profile/       # профиль пользователя
│   │   ├── search/        # глобальный поиск
│   │   ├── suggest/       # предложить компанию/школу
│   │   ├── users/         # публичные профили
│   │   ├── for/           # landing для job-seekers и students
│   │   └── legal/         # юридические страницы
│   ├── components/        # 14 компонентов (header, footer, cards, etc.)
│   └── lib/
│       ├── api.ts         # Axios instance + типы (421 строка)
│       ├── auth.ts        # localStorage auth helpers
│       ├── i18n.ts        # переводы RU/KZ/EN (~92kb)
│       ├── lang-context.tsx # React context для языка
│       ├── hooks.ts       # кастомные хуки
│       ├── admin-api.ts   # функции для админ панели
│       └── dashboard-api.ts # функции для дашборда
├── deploy/
│   ├── docker-compose.yml      # prod (nginx + certbot + SSL)
│   ├── docker-compose.local.yml # локальный оверрайд
│   ├── nginx.conf              # prod конфиг (HTTP→HTTPS redirect)
│   └── nginx-local.conf        # локальный конфиг
├── scripts/
│   ├── ai_data_parser.py  # Claude API парсер компаний
│   └── import_to_db.py    # импортёр JSON в БД
├── .env.example           # шаблон переменных окружения
├── Makefile               # make up/down/logs/build/test/ssl-init
└── README.md
```

---

## 4. МОДЕЛИ ДАННЫХ (все таблицы)

| Модель | Описание |
|--------|----------|
| `User` | Пользователь: email, password_hash, role, privacy, preferred_stacks |
| `UserExtProfile` | Расширенный профиль: avatar, city, github, linkedin, instagram |
| `UserExperience` | История работы пользователя |
| `UserSkill` | Навыки пользователя + уровень (beginner/intermediate/expert) |
| `Achievement` | Достижения/бейджи пользователя |
| `Company` | Компания: name, logo, widgets, contacts, regions, stack |
| `CompanyOffice` | Офисы компании с координатами |
| `CompanyPhoto` | Фотогалерея компании |
| `CompanyShowcase` | Витрина компании (стажировки, события, новости) |
| `CompanyProfile` | Расширенный профиль для job-search (hiring_now, reviews, HR) |
| `CompanyReview` | Отзывы о компании (moderation: pending/approved/rejected) |
| `CompanyWidgets` | Флаги включённых секций (training/internship/vacancy) |
| `Opportunity` | Стажировка или вакансия с дедлайном, зарплатой, форматом |
| `Job` | Вакансия с более детальной информацией (фаза 2) |
| `JobInterviewQuestion` | Реальные вопросы от компании на собеседовании |
| `JobReview` | Отзыв о процессе интервью на конкретную вакансию |
| `School` | Образовательная организация (bootcamp/university/state_program) |
| `Course` | Курс/программа в рамках школы |
| `Stack` | Технологический стек (name, popularity, isTrending) |
| `Region` | Регионы (KZ, KG, UZ, EMEA) |
| `CareerPath` | Карьерный путь (от студента до джуниора) |
| `PathStage` | Этап карьерного пути (2-3 месяца) |
| `InterviewQuestion` | База вопросов на собеседование |
| `UserProgress` | Прогресс пользователя по карьерному пути |
| `UserInterviewProgress` | Прогресс по вопросам собеседования |
| `ProjectIdea` | Идея пет-проекта для портфолио |
| `HRContact` | Публичный HR-контакт компании |
| `HRContent` | Статьи/советы/речи от HR компании |
| `HRAdvice` | Советы HR о найме (фаза 2) |
| `Hackathon` | Хакатон с дедлайном и призами |
| `Certificate` | Сертификат для верификации по коду |
| `PasswordResetToken` | Токены сброса пароля (SHA-256 хэш, TTL 1 час) |
| `Suggestion` | Предложение добавить компанию/школу |
| `OwnerRequest` | Заявка на владение страницей компании/школы |
| `UserFavorite` | Избранное (company/opportunity/school) |
| `AuditLog` | Лог admin/owner действий |
| `TechStackPopularity` | Месячная статистика популярности стека |
| `ConferenceEvent` | Конференции и митапы |

**Роли пользователей:** `user` | `company_owner` | `school_owner` | `partner` | `admin`

---

## 5. API ЭНДПОИНТЫ (backend)

Базовый путь: `/api/v1`

### Auth (`/auth`)
- `POST /auth/register` — регистрация
- `POST /auth/login` — вход
- `POST /auth/google` — Google OAuth
- `POST /auth/refresh` — обновление токена
- `POST /auth/password/forgot` — запрос сброса пароля
- `POST /auth/password/reset` — сброс пароля

### Users (`/users`)
- `GET /users/:uid` — публичный профиль (если ProfilePublic=true)
- `GET /users/me` — свой профиль (JWT required)
- `PUT /users/me` — обновление профиля
- `PUT /users/me/privacy` — настройки приватности
- `PUT /users/me/ext-profile` — расширенный профиль (avatar, city, links)
- `POST/DELETE /users/me/experiences` — опыт работы
- `POST/DELETE /users/me/skills` — навыки
- `GET/PUT /users/me/preferred-stacks` — предпочтительные стеки

### Companies, Opportunities, Schools, Courses, Stacks — CRUD через admin и public эндпоинты
### Admin (`/admin`) — только admin email из ADMIN_EMAIL env
### Dashboard (`/dashboard`) — для company_owner и school_owner
### Favorites, Career Paths, Interview Questions, Jobs, Hackathons, Search, Suggestions, Certificates

---

## 6. БЕЗОПАСНОСТЬ

| Механизм | Реализация |
|----------|-----------|
| JWT | Access (короткий) + Refresh (длинный), HS256 |
| CSRF | Double-submit cookie (csrf_token cookie + X-CSRF-Token header) |
| Rate Limiting | 180 req/min глобально, отдельный лимитер для auth |
| CORS | Whitelist через CORS_ORIGINS env |
| Admin | Только один email (ADMIN_EMAIL env) — **однопользовательская модель** |
| Password Reset | SHA-256 хэш токена в БД, TTL 1 час |
| Email enumeration | forgotPassword всегда возвращает 200 |
| Bcrypt | DefaultCost (10) для хэширования паролей |

---

## 7. ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

```env
APP_ENV=development|production
HTTP_PORT=8080
APP_BASE_URL=http://localhost:3000
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
RATE_LIMIT_PER_MIN=180
CORS_ORIGINS=http://localhost:3000
CSRF_COOKIE_NAME=csrf_token
CSRF_COOKIE_DOMAIN=localhost
SWAGGER_ENABLED=true
ADMIN_EMAIL=your@email.com
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
DATABASE_URL=postgres://...
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
BACKEND_URL=http://localhost:8080
DOMAIN=jarlyq.com
```

---

## 8. БЫСТРЫЙ СТАРТ

```bash
# 1. Скопировать и заполнить .env
cp .env.example .env
# 2. Обязательно задать: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ADMIN_EMAIL, POSTGRES_PASSWORD

# Запуск в Docker (рекомендуется)
make up
# Frontend: http://localhost/
# Backend API: http://localhost/api/v1/
# Swagger: http://localhost/swagger/index.html

# Локальная разработка
cd backend && go run cmd/api/main.go
cd frontend && npm install && npm run dev

# Тесты
make test  # или: cd backend && go test ./...
```

---

## 9. ИЗВЕСТНЫЕ БАГИ И ПРОБЛЕМЫ

### 🔴 КРИТИЧЕСКИЕ

1. **Однопользовательская admin-модель** (`middleware/admin.go:13`)  
   `ADMIN_EMAIL` — единственный способ стать администратором. Нет таблицы ролей. Смена email = потеря доступа.

2. **Tokens в localStorage** (`frontend/lib/auth.ts:16-18`)  
   JWT хранятся в `localStorage` — уязвимо к XSS атакам. Правильно: httpOnly cookie.

3. **CSRF cookie не httpOnly** (`middleware/csrf.go:72`)  
   `HttpOnly: false` — это правильно для double-submit паттерна, но CSRF защита не работает для XSS.

4. **Refresh token не ротируется в БД** (`transport/http/auth.go:158-190`)  
   При `/auth/refresh` создаётся новый refresh token, но старый не инвалидируется. Возможно переиспользование.

5. **Прямые DB-запросы в хендлерах** (во многих файлах: `h.Services.DB.Create/Save/Delete`)  
   В `user.go`, `admin.go` хендлеры напрямую обращаются к `h.Services.DB` минуя сервисный слой — нарушение архитектуры.

6. **Нет pagination в некоторых admin endpoints** (`admin.go:17`)  
   `listAllFilter()` возвращает лимит 200 без возможности пагинации.

### 🟡 СРЕДНИЕ

7. **Email verification не реализована** (`service/user.go:141`)  
   Письмо отправляется, но `access_token` используется как verification link — это неверно. Верификация email не меняет `EmailVerified` флаг.

8. **Нет валидации URL полей** (models: LogoURL, CoverURL, AvatarURL)  
   Любая строка принимается как URL — возможен SSRF или XSS через SVG.

9. **ai_data_parser.py передаёт API ключ в stdout** (`scripts/ai_data_parser.py:333`)  
   `print(f"API Key loaded: {api_key[:20]}...")` — часть ключа в логах.

10. **CompanyProfile дублирует поля Company** (models.go:351-372)  
    `CompanyProfile` содержит `LogoURL`, `EmployeeCount`, `FoundedYear`, `Industry` — дублируя `Company`.

11. ~~**Нет ограничения размера запроса**~~ ✅ **ИСПРАВЛЕНО** (v2)  
    Добавлен `MaxBytesReader` 2MB и `MaxMultipartMemory` в `server/server.go`.

12. **i18n файл огромный** (`frontend/lib/i18n.ts` — 92kb)  
    Всё в одном файле, загружается синхронно. Нет lazy loading.

13. **Нет индексов на часто фильтруемые поля**  
    `Opportunity.Type`, `Opportunity.WorkFormat`, `Job.Level` — нет составных индексов.

### 🟢 МИНОРНЫЕ

14. **Compiled binaries в репозитории** (`backend/api.exe`, `backend/main.exe` — ~50MB каждый)  
    `*.exe` есть в `.gitignore`, но старые бинари могли быть закоммичены. Проверить: `git rm --cached backend/*.exe`.

15. **Нет `logoURL` в adminSchoolRequest** (`admin.go`)  
    Школа не может иметь лого через API (есть `cover_url` но не `logo_url`).

16. **Hardcoded регионы** (`frontend/lib/api.ts:316`)  
    Регионы захардкожены на клиенте — при изменении БД надо менять клиентский код.

17. ~~**Нет обработки ошибок в `updatePrivacy`** (`user.go:195`)~~ ✅ **ИСПРАВЛЕНО** (v2)  
    `h.Services.DB.Save(&user)` теперь с проверкой `.Error` и возвратом 500.


---

## 10. АРХИТЕКТУРНЫЕ НАБЛЮДЕНИЯ

### Плюсы ✅
- Чистая слоистая архитектура: transport → service → repository → model
- Интерфейсы для сервисов — хорошая тестируемость
- Unit-тесты на ключевую логику (user, job, certificate, interview, career_path)
- Полная Docker-инфраструктура с Certbot SSL
- CSRF + Rate limiting + CORS из коробки
- Audit log всех admin/owner действий
- Privacy settings для пользователей
- Богатая доменная модель (37 таблиц)
- Swagger документация
- Silent token refresh на клиенте

### Минусы ❌
- Нет Redis (нет кэша, нет refresh token blacklist)
- Нет S3/Object Storage (загрузка изображений — только ссылки)
- Нет поиска (нет Elasticsearch/PostgreSQL FTS реально используется)
- Нет очередей (email отправляется синхронно)
- Нет мониторинга (Prometheus, Sentry)
- Нет CI/CD pipeline
- Refresh token не инвалидируется
- Admin — один email вместо роль-based системы
- Много хендлеров обходят сервисный слой

---

## 11. ЧТО НУЖНО ДЛЯ MVP ЗАПУСКА

### Минимально необходимо (P0)
- [ ] Заполнить `.env` (JWT secrets, ADMIN_EMAIL, POSTGRES_PASSWORD, GOOGLE_CLIENT_ID)
- [ ] Наполнить БД данными (компании, стажировки, школы) через admin панель или `scripts/import_to_db.py`
- [ ] Настроить SMTP для email верификации
- [ ] VPS с Docker + Make up + DNS

### Важно для первых пользователей (P1)
- [ ] Минимум 20-30 реальных стажировок в БД
- [ ] Минимум 10-15 компаний с описаниями
- [ ] Минимум 5 школ/курсов
- [ ] Карьерные пути с вопросами на собеседование
- [ ] Запустить `scripts/ai_data_parser.py` для автозаполнения

### Для роста (P2)
- [ ] Fix: tokens в httpOnly cookie вместо localStorage
- [ ] Fix: refresh token blacklist (Redis)
- [ ] Добавить: file upload (S3/MinIO) для логотипов
- [ ] Добавить: Full-text search по PostgreSQL
- [ ] Добавить: уведомления Telegram bot
- [ ] Добавить: страница успешных историй
- [ ] Добавить: AI-рекомендации через LLM

---

## 12. ПОСЛЕДОВАТЕЛЬНОСТЬ ПЕРВЫХ ШАГОВ

```
1. git clone + cp .env.example .env + заполнить секреты
2. make up (поднять Docker)
3. Зарегистрироваться по ADMIN_EMAIL
4. Зайти на /admin и добавить первые 5 компаний вручную
5. Добавить к каждой компании 2-3 стажировки
6. Добавить 3-4 школы с курсами
7. Запустить ai_data_parser.py для автозаполнения (нужен ANTHROPIC_API_KEY)
8. Поделиться ссылкой в Telegram-чатах студентов Казахстана/Кыргызстана
```

---

## 13. РЕКОМЕНДАЦИИ ПО РЕФАКТОРИНГУ (приоритет)

### Срочно
```go
// 1. Вынести DB-операции из хендлеров в репозитории
// Сейчас в user.go:195:
h.Services.DB.Save(&user)  // ❌ прямо в хендлере

// Должно быть через repository:
userRepo.Update(ctx, &user)  // ✅
```

```typescript
// 2. Перенести токены из localStorage в httpOnly cookie
// Сейчас: localStorage.setItem(TOKEN_KEY, accessToken)  ❌
// Должно быть: устанавливать через Set-Cookie на сервере ✅
```

### Важно
```go
// 3. Добавить max body size
router.Use(func(c *gin.Context) {
    c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20) // 1MB
    c.Next()
})

// 4. Инвалидация refresh tokens (нужен Redis или таблица)
// При /auth/refresh - записывать использованный токен как невалидный
```

---

## 14. ФАЙЛЫ ДЛЯ ИЗУЧЕНИЯ (если ИИ нужен контекст)

| Задача | Файл |
|--------|------|
| Понять модели данных | `backend/internal/model/models.go` |
| Понять auth | `backend/internal/service/user.go` + `transport/http/auth.go` |
| Понять безопасность | `backend/internal/middleware/` (все файлы) |
| Понять API | `backend/internal/transport/http/` (все файлы) |
| Понять клиент | `frontend/lib/api.ts` + `frontend/lib/auth.ts` |
| Понять роутинг | `frontend/app/` (структура директорий) |
| Понять деплой | `deploy/docker-compose.yml` + `Makefile` |

---

*Последнее обновление: 2026-04-29. Обновляй этот файл при каждом значимом изменении.*

---

## 15. ПЛАН: SUPER ADMIN CMS + ПАРТНЁРСКАЯ СИСТЕМА

> Подробный план: `brain/ef0d9bef.../scratch/cms_plan.md`

### Проблема текущего /admin

Текущий редактор (`/admin/companies/page.tsx`) — плоская модальная форма.
**Не хватает:** превью логотипа, редактора стека, галереи, витрины showcase, HR-контактов, значков, тем.

### Что строим

#### Phase 1 — Super Admin CMS (приоритет)

**Backend (новые модели):**
```go
EntityBadge { EntityType, EntityID, Icon, Label, ColorLight, ColorDark, SortOrder }
EntityTheme { EntityType, EntityID, AccentLight, AccentDark, CoverGradient }
```

**Новые API:**
- `POST/PUT/DELETE /admin/badges` — значки для любой сущности
- `PUT /admin/companies/:id/theme` — тема профиля (цвета)
- `POST/PUT/DELETE /admin/companies/:id/showcase` — витрина
- `POST/PUT/DELETE /admin/companies/:id/photos` — галерея
- `POST/PUT/DELETE /admin/companies/:id/hr-contacts` — HR команда
- `POST/PUT/DELETE /admin/companies/:id/offices` — офисы
- `GET /admin/export/companies` — JSON дамп (импорт/экспорт)

**Frontend (новое):**
- `/admin/companies/[id]/` — tabbed редактор: Основное / Контакты / Стек / Возможности / Витрина / Галерея / HR / Офисы / Значки / Тема
- URL-превью логотипа и обложки прямо в форме
- Система значков: predefined (✓ Верифицировано, ⭐ Топ, 🔥 Тренд) + кастомные с color picker
- Тема: accent color picker с light/dark вариантом → применяется на публичном профиле

#### Phase 2 — Partner Self-Service (будущее)

Уже есть: `OwnerRequest` модель + `/dashboard/` форма запроса.
Нужно добавить: полноценный `/dashboard/company` редактор (ограниченный — без значков, тем, верификации).

#### Phase 3 — Безопасность Admin

- **Admin PIN**: доп. заголовок `X-Admin-PIN` (env: `ADMIN_PIN`) → 2-фактор для admin API
- **IP Whitelist**: env `ADMIN_IP_WHITELIST` для production
- **Session timeout**: admin JWT TTL = 1 час (вместо стандартных 24h)
- AuditLog уже работает ✅

### Значки (Badge System)

Predefined иконки: `verified`, `top`, `partner`, `government`, `trending`, `new`, `hiring`, `scholarship`

Кастомные: произвольный текст + emoji + два hex цвета (light/dark)

Отображение через inline style с opacity-based background:
```tsx
style={{ color: isDark ? badge.colorDark : badge.colorLight }}
```

### Поддержка Markdown

Поля `about` и `description` → хранить markdown, рендерить через `react-markdown`:
```bash
npm install react-markdown
```

### Приоритет задач

| Sprint | Задача | Сложность |
|--------|--------|-----------|
| 1 | EntityBadge модель + API | Medium |
| 1 | Showcase/photos/offices API | Medium |
| 1 | `/admin/companies/[id]/` tabbed editor | Hard |
| 1 | Badge editor + URL preview в форме | Medium |
| 2 | EntityTheme + color picker | Medium |
| 2 | Публичный профиль с custom theme | Easy |
| 2 | Admin PIN middleware | Easy |
| 2 | `/admin/schools/[id]/` editor | Medium |
| 3 | Partner dashboard редактор | Hard |
| 3 | IP whitelist | Easy |

*Последнее обновление: 2026-04-30.*
