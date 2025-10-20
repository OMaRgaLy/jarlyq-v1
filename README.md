# Jarlyq — Платформа IT-возможностей Центральной Азии

Jarlyq помогает кандидатам из Казахстана, Кыргызстана и Узбекистана быстро находить школы, курсы, стажировки, вакансии и компании по нужным стекам. Проект состоит из backend-сервиса на Go и frontend-приложения на Next.js и полностью готов к развёртыванию через Docker.

## Основные возможности

- Регистрация и авторизация пользователей (email + Google OAuth), управление профилями, приватностью и достижениями.
- Управление профилями компаний и школ через настраиваемые виджеты без кода.
- Каталог стажировок и вакансий с фильтрами по стеку, региону и уровню.
- Витрина курсов и школ с поддержкой UTM.
- Проверка сертификатов по коду (школьные, корпоративные и независимые).
- Локализация интерфейса (русский, готовность к казахскому и английскому).
- Защита API: rate limiting, CSRF, CORS, JWT.

## Структура репозитория

```
/backend      # Go (Gin, GORM, JWT, Swagger)
/frontend     # Next.js 14, TailwindCSS, React Query, Radix UI
/deploy       # docker-compose и nginx-конфигурация
```

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose v2
- Make (опционально)

### Конфигурация

1. Скопируйте `.env.example` в `.env` и задайте переменные окружения:

```bash
cp .env.example .env
```

Минимально необходимо указать `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` и SMTP/Google данные (если используются).

### Запуск в Docker

```bash
make up
```

Сервисы будут доступны:

- Frontend: http://localhost/
- Backend API и Swagger: http://localhost/api/… и http://localhost/swagger/index.html
- База данных PostgreSQL: порт 5432 в контейнере `jarlyq-db`

Остановить и очистить ресурсы:

```bash
make down
```

### Локальная разработка

1. **Backend**

```bash
cd backend
cp ../.env .env
go test ./...
go run cmd/api/main.go
```

2. **Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend ожидает API по адресу `NEXT_PUBLIC_API_URL` (по умолчанию `http://localhost:8080/api/v1`).

## Тестирование

```bash
cd backend
go test ./...
```

Unit-тесты покрывают регистрацию, логин и восстановление пароля, а также валидацию сертификатов.

## Миграции

GORM автоматически применяет схему на старте сервера. Для production рекомендуется использовать `golang-migrate` с файлами в `backend/migrations`.

## Стек технологий

- **Backend:** Go 1.22, Gin, GORM, JWT, go-playground/validator, logrus/zap (zap), PostgreSQL, SMTP, Swagger.
- **Frontend:** Next.js 14 (App Router), TailwindCSS, Radix UI, React Query, Axios, next-themes.
- **Infrastructure:** Docker, docker-compose, Nginx reverse proxy.

## Make команды

- `make up` — сборка и запуск всех сервисов в Docker.
- `make down` — остановка и удаление контейнеров.
- `make logs` — просмотр логов сервисов.
- `make build` — локальная сборка backend и frontend.
- `make test` — прогон unit-тестов backend.

## Авторизация и безопасность

- JWT (access + refresh), CSRF cookie + header для защищённых запросов.
- Rate limiting (по умолчанию 180 запросов/минуту).
- CORS белый список через `CORS_ORIGINS`.
- Email-подтверждение и восстановление пароля через SMTP.

## Развёртывание на VPS

1. Установите Docker и Docker Compose v2.
2. Скопируйте репозиторий и `.env` на сервер.
3. Выполните `make up` или `docker compose -f deploy/docker-compose.yml up -d --build`.
4. Настройте DNS на IP сервера (Nginx слушает 80 порт).

Готово! Платформа будет доступна без дополнительной настройки.
