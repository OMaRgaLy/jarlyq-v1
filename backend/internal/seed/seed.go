package seed

import (
	"log"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

// SeedCareerPaths seeds initial career paths if they don't exist
func SeedCareerPaths(db *gorm.DB) error {
	var count int64
	db.Model(&model.CareerPath{}).Count(&count)
	if count > 0 {
		log.Println("Career paths already seeded, skipping")
		return nil
	}

	paths := []model.CareerPath{
		{
			Title:       "Backend разработчик",
			Description: "Путь от новичка к junior backend разработчику за 2-3 года. Научишься работать с базами данных, написанием REST API и деплою приложений.",
			Icon:        "⚙️",
			Duration:    24,
			Difficulty:  "beginner",
			CompletedBy: 0,
		},
		{
			Title:       "Frontend разработчик",
			Description: "Стань мастером React и TypeScript. Путь включает основы HTML/CSS, JavaScript, React и создание современных веб-приложений.",
			Icon:        "💻",
			Duration:    20,
			Difficulty:  "beginner",
			CompletedBy: 0,
		},
		{
			Title:       "Data Scientist",
			Description: "Научись анализировать большие объемы данных, работать с Python, pandas, numpy и создавать ML модели.",
			Icon:        "📊",
			Duration:    28,
			Difficulty:  "intermediate",
			CompletedBy: 0,
		},
		{
			Title:       "Mobile разработчик (Flutter)",
			Description: "Создавай приложения для iOS и Android на одном коде. Полный путь от основ Dart до публикации в App Store и Google Play.",
			Icon:        "📱",
			Duration:    22,
			Difficulty:  "beginner",
			CompletedBy: 0,
		},
		{
			Title:       "DevOps инженер",
			Description: "Научись управлять серверами, настраивать CI/CD пайплайны, работать с Docker, Kubernetes и облачными сервисами.",
			Icon:        "🚀",
			Duration:    26,
			Difficulty:  "intermediate",
			CompletedBy: 0,
		},
	}

	for _, path := range paths {
		if err := db.Create(&path).Error; err != nil {
			return err
		}
		log.Printf("Seeded career path: %s", path.Title)
	}

	return nil
}

// SeedPathStages seeds stages for career paths if they don't exist
func SeedPathStages(db *gorm.DB) error {
	var count int64
	db.Model(&model.PathStage{}).Count(&count)
	if count > 0 {
		log.Println("Path stages already seeded, skipping")
		return nil
	}

	var backendPath model.CareerPath
	if err := db.Where("title = ?", "Backend разработчик").First(&backendPath).Error; err != nil {
		return err
	}

	stages := []model.PathStage{
		{
			CareerPathID: backendPath.ID,
			Order:        1,
			Title:        "Основы программирования",
			Description:  "Изучи основы программирования, типы данных, переменные, циклы и условные операторы.",
			DurationDays: 60,
			Milestone:    "Напиши первую программу: калькулятор",
			Badge:        "Новичок",
		},
		{
			CareerPathID: backendPath.ID,
			Order:        2,
			Title:        "Python: базовый уровень",
			Description:  "Глубокое изучение Python: функции, классы, работа с файлами и модули.",
			DurationDays: 75,
			Milestone:    "Создай приложение с классами и файлами",
			Badge:        "Пайтонист",
		},
		{
			CareerPathID: backendPath.ID,
			Order:        3,
			Title:        "Базы данных SQL",
			Description:  "Изучи SQL, проектирование БД, JOIN, индексы и оптимизацию запросов.",
			DurationDays: 60,
			Milestone:    "Создай сложный запрос с несколькими JOIN",
			Badge:        "SQL Мастер",
		},
		{
			CareerPathID: backendPath.ID,
			Order:        4,
			Title:        "REST API и Django",
			Description:  "Построение REST API с помощью Django или FastAPI. Аутентификация, авторизация, сериализация данных.",
			DurationDays: 90,
			Milestone:    "Создай полноценное REST API приложение",
			Badge:        "API Разработчик",
		},
		{
			CareerPathID: backendPath.ID,
			Order:        5,
			Title:        "Версионирование Git и Docker",
			Description:  "Работа с Git, создание Docker контейнеров, управление зависимостями через requirements.txt.",
			DurationDays: 45,
			Milestone:    "Задеплой приложение в Docker контейнер",
			Badge:        "Docker Мастер",
		},
		{
			CareerPathID: backendPath.ID,
			Order:        6,
			Title:        "Тестирование и CI/CD",
			Description:  "Unit тесты, интеграционные тесты, GitHub Actions, автоматическое тестирование.",
			DurationDays: 60,
			Milestone:    "Напиши полный набор тестов для API",
			Badge:        "Качество Код",
		},
	}

	for _, stage := range stages {
		if err := db.Create(&stage).Error; err != nil {
			return err
		}
		log.Printf("Seeded stage: %s for path %s", stage.Title, backendPath.Title)
	}

	return nil
}

// SeedInterviewQuestions seeds interview questions if they don't exist
func SeedInterviewQuestions(db *gorm.DB) error {
	var count int64
	db.Model(&model.InterviewQuestion{}).Count(&count)
	if count > 0 {
		log.Println("Interview questions already seeded, skipping")
		return nil
	}

	questions := []model.InterviewQuestion{
		{
			Question:    "Чем отличается List от Tuple в Python?",
			Answer:      "List - это изменяемая коллекция (можно добавлять, удалять, изменять элементы), Tuple - неизменяемая (immutable). List медленнее, но гибче. Tuple можно использовать как ключи в словарях.",
			Explanation: "Примеры: list = [1, 2, 3], tuple = (1, 2, 3). После создания tuple нельзя изменить.",
			Level:       "easy",
			Topic:       "Python",
			TimesAsked:  47,
			SuccessRate: 85,
			Difficulty:  1,
		},
		{
			Question:    "Объясни что такое REST API",
			Answer:      "REST (Representational State Transfer) - архитектурный стиль для создания веб-сервисов. Использует HTTP методы (GET, POST, PUT, DELETE) для операций с ресурсами. Каждый ресурс имеет уникальный URL.",
			Explanation: "GET /users - получить список пользователей, POST /users - создать нового пользователя, PUT /users/1 - обновить пользователя с ID 1, DELETE /users/1 - удалить пользователя.",
			Level:       "medium",
			Topic:       "Web Development",
			TimesAsked:  89,
			SuccessRate: 78,
			Difficulty:  2,
		},
		{
			Question:    "Что такое индекс в базе данных?",
			Answer:      "Индекс - это структура данных, которая ускоряет поиск информации в таблице БД. Вместо сканирования всех строк, БД использует индекс для быстрого поиска.",
			Explanation: "Индексы замедляют INSERT/UPDATE/DELETE, но ускоряют SELECT. Индекс на уникальном столбце (PRIMARY KEY, UNIQUE) гарантирует уникальность значений.",
			Level:       "medium",
			Topic:       "SQL",
			TimesAsked:  76,
			SuccessRate: 72,
			Difficulty:  2,
		},
		{
			Question:    "Что такое виртуальное окружение в Python?",
			Answer:      "Виртуальное окружение (venv) - это изолированная среда Python, где можно установить пакеты без влияния на системный Python. Каждый проект имеет свое окружение с нужными версиями пакетов.",
			Explanation: "Создание: python -m venv myenv, Активация: source myenv/bin/activate (Linux/Mac) или myenv\\Scripts\\activate (Windows).",
			Level:       "easy",
			Topic:       "Python",
			TimesAsked:  54,
			SuccessRate: 88,
			Difficulty:  1,
		},
		{
			Question:    "Объясни что такое ORM (Object-Relational Mapping)",
			Answer:      "ORM - инструмент, который преобразует объекты программы в записи БД и наоборот. Позволяет работать с БД используя объекты вместо SQL запросов.",
			Explanation: "Примеры: Django ORM, SQLAlchemy, Prisma. Преимущества: меньше SQL кода, автоматическая миграция. Недостатки: сложность, медленнее чем чистый SQL.",
			Level:       "medium",
			Topic:       "Web Development",
			TimesAsked:  68,
			SuccessRate: 76,
			Difficulty:  2,
		},
		{
			Question:    "Напиши алгоритм поиска в глубину (DFS)",
			Answer:      "DFS - рекурсивный алгоритм обхода графа в глубину. Посещает узел, отмечает как посещенный, затем рекурсивно посещает всех соседей.",
			Explanation: "def dfs(node, visited, graph):\\n  visited.add(node)\\n  for neighbor in graph[node]:\\n    if neighbor not in visited:\\n      dfs(neighbor, visited, graph)",
			Level:       "medium",
			Topic:       "Algorithms",
			TimesAsked:  92,
			SuccessRate: 65,
			Difficulty:  3,
		},
		{
			Question:    "Что такое HTTP статус код 404?",
			Answer:      "404 Not Found - статус код, указывающий что запрашиваемый ресурс не найден на сервере. Это ошибка клиента (4xx), а не ошибка сервера.",
			Explanation: "Примеры других 4xx: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500+ - ошибки сервера.",
			Level:       "easy",
			Topic:       "Web Development",
			TimesAsked:  73,
			SuccessRate: 95,
			Difficulty:  1,
		},
		{
			Question:    "Объясни концепцию SOLID принципов",
			Answer:      "SOLID - пять принципов хорошего дизайна ПО: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.",
			Explanation: "Single Responsibility - класс должен отвечать за одно. Open/Closed - открыт для расширения, закрыт для изменения.",
			Level:       "hard",
			Topic:       "Design Patterns",
			TimesAsked:  45,
			SuccessRate: 58,
			Difficulty:  4,
		},
	}

	for _, q := range questions {
		if err := db.Create(&q).Error; err != nil {
			return err
		}
		log.Printf("Seeded question: %s", q.Question)
	}

	return nil
}

// SeedProjectIdeas seeds portfolio project ideas across all IT directions
func SeedProjectIdeas(db *gorm.DB) error {
	var count int64
	db.Model(&model.ProjectIdea{}).Count(&count)
	if count > 0 {
		log.Println("Project ideas already seeded, skipping")
		return nil
	}

	ideas := []model.ProjectIdea{
		// ===== BACKEND =====
		{
			Title:       "REST API для блог-платформы",
			Description: "Полноценный REST API с авторизацией, CRUD постов, комментариями, тегами и пагинацией. Идеальный первый бэкенд-проект.",
			Direction:   "backend",
			Difficulty:  "beginner",
			Duration:    "2-3 недели",
			TechStack:   "Python, FastAPI, PostgreSQL, Docker",
			Skills:      "REST API design, JWT auth, ORM, SQL, Docker",
			Features:    "Регистрация/авторизация (JWT)\nCRUD постов с тегами\nКомментарии и лайки\nПагинация и фильтрация\nЗагрузка изображений\nSwagger документация",
			WhyGood:     "Покрывает 80% вопросов на собеседовании junior backend: REST, авторизация, работа с БД, документация API",
			Likes:       156,
			CompletedBy: 89,
		},
		{
			Title:       "URL Shortener с аналитикой",
			Description: "Сервис сокращения ссылок с трекингом кликов, геолокацией, и дашбордом аналитики. Показывает навыки работы с кэшированием.",
			Direction:   "backend",
			Difficulty:  "beginner",
			Duration:    "1-2 недели",
			TechStack:   "Go, Redis, PostgreSQL, Docker",
			Skills:      "URL hashing, Redis caching, rate limiting, analytics",
			Features:    "Сокращение URL с кастомным alias\nРедирект с трекингом\nСтатистика кликов по дням\nRate limiting\nAPI ключи для интеграции",
			WhyGood:     "Компактный проект, который показывает понимание кэширования, хэширования и работы с данными",
			Likes:       134,
			CompletedBy: 72,
		},
		{
			Title:       "Микросервисная платформа заказов",
			Description: "E-commerce backend из 3-4 микросервисов с очередями сообщений, API Gateway и мониторингом.",
			Direction:   "backend",
			Difficulty:  "advanced",
			Duration:    "2-3 месяца",
			TechStack:   "Go/Java, gRPC, RabbitMQ, PostgreSQL, Docker, Kubernetes",
			Skills:      "Microservices, gRPC, message queues, distributed systems, K8s",
			Features:    "API Gateway (авторизация, роутинг)\nСервис пользователей\nСервис каталога товаров\nСервис заказов с очередями\nМониторинг (Prometheus + Grafana)\nCI/CD pipeline",
			WhyGood:     "Показывает senior-level архитектурное мышление. Такие проекты выделяют на фоне сотен todo-приложений",
			Likes:       203,
			CompletedBy: 31,
		},
		{
			Title:       "Real-time чат на WebSocket",
			Description: "Мессенджер с приватными и групповыми чатами, онлайн-статусами, историей сообщений и уведомлениями.",
			Direction:   "backend",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "Node.js, Socket.io, MongoDB, Redis",
			Skills:      "WebSocket, real-time communication, NoSQL, pub/sub",
			Features:    "Приватные и групповые чаты\nОнлайн статусы пользователей\nИстория сообщений\nОтправка файлов и картинок\nПуш-уведомления\nПоиск по сообщениям",
			WhyGood:     "WebSocket - частый вопрос на собеседованиях. Real-time системы показывают глубокое понимание сетевых протоколов",
			Likes:       178,
			CompletedBy: 54,
		},

		// ===== FRONTEND =====
		{
			Title:       "Kanban-доска (аналог Trello)",
			Description: "Drag-and-drop доска задач с колонками, тегами, дедлайнами и командной работой в реальном времени.",
			Direction:   "frontend",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "React, TypeScript, DnD Kit, TailwindCSS, Zustand",
			Skills:      "Drag and drop, state management, responsive design, TypeScript",
			Features:    "Drag-and-drop карточек между колонками\nСоздание/редактирование задач\nТеги, приоритеты, дедлайны\nФильтрация и поиск\nТемная тема\nЛокальное хранение (localStorage)",
			WhyGood:     "Kanban - идеальный проект для фронтенда: сложный UI, drag-and-drop, state management. Всё, что спрашивают на собеседованиях",
			Likes:       245,
			CompletedBy: 112,
		},
		{
			Title:       "Дашборд с графиками и виджетами",
			Description: "Админ-панель с интерактивными графиками, таблицами данных, фильтрами и экспортом в PDF/CSV.",
			Direction:   "frontend",
			Difficulty:  "intermediate",
			Duration:    "2-3 недели",
			TechStack:   "Next.js, TypeScript, Recharts, TailwindCSS, React Table",
			Skills:      "Data visualization, tables, responsive layout, SSR",
			Features:    "Графики: линейные, столбчатые, круговые\nТаблица с сортировкой и пагинацией\nФильтры по дате и категории\nЭкспорт в CSV\nAdaptive layout\nDark mode",
			WhyGood:     "Аналитические дашборды - самый частый тип корпоративных приложений. Этот проект прямо показывает продуктовые навыки",
			Likes:       189,
			CompletedBy: 78,
		},
		{
			Title:       "Лендинг с анимациями (portfolio сайт)",
			Description: "Персональный сайт-портфолио с плавными анимациями, параллаксом, секциями проектов и формой контакта.",
			Direction:   "frontend",
			Difficulty:  "beginner",
			Duration:    "1-2 недели",
			TechStack:   "HTML, CSS, JavaScript, GSAP или Framer Motion",
			Skills:      "CSS animations, responsive design, accessibility, performance",
			Features:    "Hero секция с анимацией\nПараллакс эффекты при скролле\nГалерея проектов\nФорма обратной связи\n100/100 Lighthouse score\nАдаптив для мобильных",
			WhyGood:     "Это буквально ваше портфолио - первое, что увидит рекрутер. Качественный лендинг говорит больше, чем резюме",
			Likes:       312,
			CompletedBy: 198,
		},

		// ===== DATA SCIENCE / ML =====
		{
			Title:       "Анализ рынка вакансий (парсинг + визуализация)",
			Description: "Парсер вакансий с hh.kz/hh.uz с анализом зарплат, требуемых навыков и трендов по регионам.",
			Direction:   "data-science",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "Python, BeautifulSoup/Scrapy, Pandas, Matplotlib, Jupyter",
			Skills:      "Web scraping, data cleaning, EDA, visualization, statistics",
			Features:    "Парсинг вакансий по IT-специальностям\nОчистка и нормализация данных\nАнализ зарплат по уровням и городам\nТоп-10 требуемых навыков\nТренды за последний год\nИнтерактивный Jupyter notebook",
			WhyGood:     "Реальный полезный анализ, который можно показать работодателю. Доказывает навыки работы с данными на практике",
			Likes:       167,
			CompletedBy: 45,
		},
		{
			Title:       "Рекомендательная система фильмов",
			Description: "Система рекомендаций на основе collaborative filtering и content-based подходов с веб-интерфейсом.",
			Direction:   "data-science",
			Difficulty:  "intermediate",
			Duration:    "2-4 недели",
			TechStack:   "Python, Scikit-learn, Pandas, Flask/Streamlit",
			Skills:      "Recommender systems, collaborative filtering, cosine similarity, ML pipeline",
			Features:    "Collaborative filtering (user-based и item-based)\nContent-based рекомендации\nГибридный подход\nВеб-интерфейс с поиском\nОценка качества (RMSE, precision)\nDataset: MovieLens",
			WhyGood:     "Рекомендательные системы - один из самых практичных ML-проектов. Используется в Netflix, Spotify, Amazon",
			Likes:       145,
			CompletedBy: 38,
		},
		{
			Title:       "Предсказание оттока клиентов (Churn Prediction)",
			Description: "End-to-end ML pipeline: от EDA до деплоя модели предсказания оттока с API и мониторингом.",
			Direction:   "ml-ai",
			Difficulty:  "advanced",
			Duration:    "1-2 месяца",
			TechStack:   "Python, XGBoost, MLflow, FastAPI, Docker",
			Skills:      "Feature engineering, model selection, hyperparameter tuning, MLOps, deployment",
			Features:    "Exploratory Data Analysis\nFeature engineering и selection\nСравнение моделей (Logistic Regression, Random Forest, XGBoost)\nMLflow эксперименты\nFastAPI для inference\nDocker контейнер для деплоя",
			WhyGood:     "Полный ML pipeline от данных до продакшена - именно это ищут компании. Показывает не только модели, но и инженерные навыки",
			Likes:       198,
			CompletedBy: 27,
		},

		// ===== MOBILE =====
		{
			Title:       "Трекер привычек",
			Description: "Мобильное приложение для отслеживания ежедневных привычек с напоминаниями, статистикой и виджетами.",
			Direction:   "mobile",
			Difficulty:  "beginner",
			Duration:    "2-3 недели",
			TechStack:   "Flutter, Dart, Hive/SQLite, Provider",
			Skills:      "Mobile UI, local storage, notifications, state management",
			Features:    "Добавление привычек с иконками\nЕжедневный чек-ин\nКалендарь с историей\nСтатистика: streak, процент выполнения\nЛокальные пуш-уведомления\nТемная тема",
			WhyGood:     "Простой, но полезный проект - его можно публиковать в App Store/Google Play. Живое приложение в сторе = огромный плюс в портфолио",
			Likes:       189,
			CompletedBy: 95,
		},
		{
			Title:       "Приложение для изучения слов (Flashcards)",
			Description: "Приложение с карточками для запоминания слов, использующее алгоритм интервального повторения (Spaced Repetition).",
			Direction:   "mobile",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "React Native, TypeScript, AsyncStorage, Expo",
			Skills:      "Animations, spaced repetition algorithm, offline-first, i18n",
			Features:    "Создание колод и карточек\nAlgorithm SM-2 (как Anki)\nSwipe-анимации (знаю/не знаю)\nСтатистика повторений\nOffline режим\nЭкспорт/импорт колод",
			WhyGood:     "Сочетает алгоритмику (SM-2) с красивым UI. Показывает, что вы понимаете и UX, и computer science",
			Likes:       156,
			CompletedBy: 42,
		},
		{
			Title:       "Фитнес-трекер с GPS",
			Description: "Приложение для записи тренировок: бег с GPS, программы упражнений, графики прогресса и социальная лента.",
			Direction:   "mobile",
			Difficulty:  "advanced",
			Duration:    "2-3 месяца",
			TechStack:   "Flutter, Google Maps API, Firebase, Dart",
			Skills:      "GPS tracking, maps integration, real-time data, Firebase, background tasks",
			Features:    "Запись бега с GPS-треком на карте\nТаймер тренировок\nБиблиотека упражнений\nГрафики прогресса (вес, дистанция)\nSocial feed: делись тренировками\nSync с Firebase",
			WhyGood:     "Работа с GPS, картами и фоновыми задачами - это advanced mobile разработка. Серьезный проект для портфолио",
			Likes:       134,
			CompletedBy: 19,
		},

		// ===== DEVOPS =====
		{
			Title:       "CI/CD Pipeline для микросервисов",
			Description: "Полный DevOps pipeline: от push в git до деплоя в Kubernetes с мониторингом и алертами.",
			Direction:   "devops",
			Difficulty:  "intermediate",
			Duration:    "2-4 недели",
			TechStack:   "GitHub Actions, Docker, Kubernetes, Helm, Prometheus, Grafana",
			Skills:      "CI/CD, containerization, orchestration, monitoring, IaC",
			Features:    "Multi-stage Docker builds\nGitHub Actions pipeline (lint, test, build, deploy)\nKubernetes manifests или Helm charts\nPrometheus метрики\nGrafana дашборды\nSlack алерты при ошибках",
			WhyGood:     "DevOps без реального pipeline - как повар без кухни. Этот проект показывает, что вы умеете строить, а не только теоретизировать",
			Likes:       167,
			CompletedBy: 34,
		},
		{
			Title:       "Infrastructure as Code: облачная инфраструктура",
			Description: "Развертывание production-ready инфраструктуры в облаке через Terraform с автоскейлингом и бэкапами.",
			Direction:   "devops",
			Difficulty:  "advanced",
			Duration:    "1-2 месяца",
			TechStack:   "Terraform, AWS/GCP, Ansible, Vault, Nginx",
			Skills:      "IaC, cloud architecture, security, networking, automation",
			Features:    "Terraform модули (VPC, EC2/GCE, RDS, S3)\nAnsible playbooks для конфигурации\nHashiCorp Vault для секретов\nАвтоскейлинг группы\nАвтоматические бэкапы БД\nМониторинг и алерты",
			WhyGood:     "Terraform и IaC - must-have для DevOps. Публичный Terraform модуль на GitHub - это как золотая печать в резюме",
			Likes:       145,
			CompletedBy: 18,
		},
		{
			Title:       "Домашний сервер с Docker Compose",
			Description: "Self-hosted инфраструктура: VPN, мониторинг, файлохранилище и автоматизация - всё в Docker.",
			Direction:   "devops",
			Difficulty:  "beginner",
			Duration:    "1-2 недели",
			TechStack:   "Docker Compose, Nginx, WireGuard, Portainer, Uptime Kuma",
			Skills:      "Docker Compose, reverse proxy, networking, Linux administration",
			Features:    "Docker Compose для всех сервисов\nNginx reverse proxy с SSL (Let's Encrypt)\nWireGuard VPN\nPortainer для управления контейнерами\nUptime Kuma мониторинг\nАвтоматические бэкапы",
			WhyGood:     "Начальный DevOps проект, который реально полезен. Показывает понимание Docker, сетей и Linux без сложности облака",
			Likes:       213,
			CompletedBy: 87,
		},

		// ===== QA =====
		{
			Title:       "Автотесты для e-commerce сайта",
			Description: "Полный набор E2E, API и unit тестов для интернет-магазина с CI интеграцией и отчётами.",
			Direction:   "qa",
			Difficulty:  "intermediate",
			Duration:    "2-3 недели",
			TechStack:   "Playwright, Python/JS, Allure, GitHub Actions",
			Skills:      "E2E testing, API testing, test design, CI integration, reporting",
			Features:    "E2E тесты: регистрация, каталог, корзина, оплата\nAPI тесты: все CRUD эндпоинты\nPage Object Pattern\nData-driven тесты\nAllure отчёты с скриншотами\nЗапуск в CI (GitHub Actions)",
			WhyGood:     "QA без портфолио тестов - это как программист без кода. Allure отчёты и CI pipeline показывают профессиональный подход",
			Likes:       123,
			CompletedBy: 56,
		},
		{
			Title:       "Фреймворк нагрузочного тестирования",
			Description: "Набор сценариев нагрузочного тестирования для REST API с визуализацией результатов и сравнением релизов.",
			Direction:   "qa",
			Difficulty:  "advanced",
			Duration:    "2-4 недели",
			TechStack:   "k6, Grafana, InfluxDB, Docker",
			Skills:      "Performance testing, load testing, metrics analysis, bottleneck identification",
			Features:    "Сценарии: spike, stress, soak, breakpoint\nПользовательские метрики\nGrafana дашборд в реальном времени\nСравнение результатов между релизами\nАвтоматический запуск в CI\nОтчёт с рекомендациями",
			WhyGood:     "Нагрузочное тестирование - редкий навык, который сильно повышает ценность QA инженера на рынке",
			Likes:       98,
			CompletedBy: 21,
		},

		// ===== SECURITY =====
		{
			Title:       "Менеджер паролей (CLI + Web)",
			Description: "Безопасный менеджер паролей с шифрованием AES-256, генерацией паролей и синхронизацией.",
			Direction:   "security",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "Go/Python, AES-256, bcrypt, SQLite, React",
			Skills:      "Cryptography, secure storage, key derivation, OWASP best practices",
			Features:    "Master password с PBKDF2 key derivation\nAES-256 шифрование записей\nГенератор безопасных паролей\nCLI интерфейс + Web UI\nЭкспорт/импорт (зашифрованный)\nАвтоблокировка по таймауту",
			WhyGood:     "Показывает глубокое понимание криптографии и безопасности. Отличный проект для тех, кто хочет в Security Engineering",
			Likes:       145,
			CompletedBy: 33,
		},
		{
			Title:       "Сканер уязвимостей веб-приложений",
			Description: "Инструмент для автоматического поиска типичных уязвимостей: XSS, SQL injection, CSRF, open redirects.",
			Direction:   "security",
			Difficulty:  "advanced",
			Duration:    "1-2 месяца",
			TechStack:   "Python, aiohttp, BeautifulSoup, SQLite",
			Skills:      "OWASP Top 10, web security, HTTP protocol, vulnerability assessment",
			Features:    "Сканирование URL на XSS (reflected, stored)\nОбнаружение SQL injection\nПроверка CSRF токенов\nОбнаружение open redirects\nОтчёт с severity levels\nЭтичное использование (только с разрешения)",
			WhyGood:     "Security-инструменты в портфолио показывают offensive security навыки. Высокий спрос на рынке, мало специалистов",
			Likes:       112,
			CompletedBy: 15,
		},

		// ===== FULLSTACK =====
		{
			Title:       "Платформа для обмена код-сниппетами (аналог GitHub Gist)",
			Description: "Веб-приложение для публикации, поиска и обсуждения фрагментов кода с подсветкой синтаксиса.",
			Direction:   "fullstack",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "Next.js, TypeScript, Go/Node.js, PostgreSQL, Prism.js",
			Skills:      "Full-stack development, syntax highlighting, search, authentication",
			Features:    "Создание сниппетов с подсветкой синтаксиса\nПоддержка 50+ языков\nПоиск по тегам и языкам\nFork и версии сниппетов\nКомментарии и лайки\nPublic/Private сниппеты",
			WhyGood:     "Fullstack проект, который сам по себе полезный инструмент. Можно размещать свои сниппеты, делиться с сообществом",
			Likes:       178,
			CompletedBy: 47,
		},
		{
			Title:       "Платформа онлайн-опросов (аналог Google Forms)",
			Description: "Конструктор опросов с различными типами вопросов, аналитикой ответов и экспортом данных.",
			Direction:   "fullstack",
			Difficulty:  "intermediate",
			Duration:    "1-2 месяца",
			TechStack:   "React, TypeScript, Node.js, PostgreSQL, Chart.js",
			Skills:      "Form builder, dynamic UI, data aggregation, real-time updates",
			Features:    "Конструктор форм (текст, выбор, рейтинг, шкала)\nУникальная ссылка для каждого опроса\nReal-time подсчёт ответов\nГрафики и статистика\nЭкспорт в CSV/Excel\nShare через QR-код",
			WhyGood:     "Показывает умение строить сложные UI с динамическими формами - навык, востребованный в каждой продуктовой компании",
			Likes:       156,
			CompletedBy: 39,
		},

		// ===== GAMEDEV =====
		{
			Title:       "2D платформер на Unity/Godot",
			Description: "Классический платформер с уровнями, врагами, бонусами, сохранениями и простой физикой.",
			Direction:   "gamedev",
			Difficulty:  "beginner",
			Duration:    "3-4 недели",
			TechStack:   "Unity/Godot, C#/GDScript, Aseprite",
			Skills:      "Game loop, collision detection, physics, level design, sprite animation",
			Features:    "5+ уровней с нарастающей сложностью\nЗвуковые эффекты и музыка\nСистема жизней и очков\nСохранение прогресса\nМеню: главное, пауза, game over\nТаблица рекордов",
			WhyGood:     "Классический проект для gamedev портфолио. Демонстрирует основы: game loop, физика, UI, level design",
			Likes:       167,
			CompletedBy: 73,
		},
		{
			Title:       "Мультиплеерная карточная игра",
			Description: "Онлайн карточная игра (а-ля Uno) с матчмейкингом, чатом и рейтинговой системой.",
			Direction:   "gamedev",
			Difficulty:  "advanced",
			Duration:    "2-3 месяца",
			TechStack:   "Unity, C#, Photon/Mirror, Firebase",
			Skills:      "Networking, multiplayer sync, matchmaking, game state management",
			Features:    "Онлайн мультиплеер (2-4 игрока)\nМатчмейкинг по рейтингу\nЧат в игре\nСистема рангов и рейтинга\nАнимации карт\nТурнирный режим",
			WhyGood:     "Мультиплеер - самая сложная часть gamedev. Если умеешь делать онлайн-игры, работа найдётся всегда",
			Likes:       123,
			CompletedBy: 12,
		},

		// ===== BLOCKCHAIN =====
		{
			Title:       "DeFi Dashboard: трекер криптопортфеля",
			Description: "Веб-приложение для отслеживания крипто-активов, DeFi позиций и P&L в реальном времени.",
			Direction:   "blockchain",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "React, ethers.js, CoinGecko API, TailwindCSS",
			Skills:      "Web3 integration, API aggregation, real-time data, charting",
			Features:    "Подключение MetaMask кошелька\nОтображение балансов ERC-20 токенов\nИстория транзакций\nP&L по каждому активу\nГрафики цен в реальном времени\nАлерты при изменении цены",
			WhyGood:     "Web3 навыки востребованы и хорошо оплачиваются. DeFi dashboard показывает интеграцию с блокчейном без написания смарт-контрактов",
			Likes:       134,
			CompletedBy: 28,
		},

		// ===== ML / AI =====
		{
			Title:       "AI чат-бот с RAG (Retrieval-Augmented Generation)",
			Description: "Чат-бот, который отвечает на вопросы по вашей документации, используя embeddings и векторный поиск.",
			Direction:   "ml-ai",
			Difficulty:  "intermediate",
			Duration:    "2-3 недели",
			TechStack:   "Python, LangChain, OpenAI API, ChromaDB, FastAPI",
			Skills:      "LLM integration, embeddings, vector search, prompt engineering, RAG pipeline",
			Features:    "Загрузка документов (PDF, Markdown)\nЧанкинг и создание embeddings\nВекторный поиск по ChromaDB\nГенерация ответов через LLM\nИстория диалога с контекстом\nWeb UI для чата",
			WhyGood:     "RAG - самый востребованный AI-паттерн в 2024-2025. Компании массово внедряют чат-ботов по своим данным, специалистов не хватает",
			Likes:       267,
			CompletedBy: 45,
		},
		{
			Title:       "Распознавание объектов на фото (Computer Vision)",
			Description: "Сервис, который определяет объекты на изображениях: классификация, детекция, сегментация с веб-интерфейсом.",
			Direction:   "ml-ai",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "Python, PyTorch, YOLOv8, OpenCV, Streamlit",
			Skills:      "Computer vision, transfer learning, model fine-tuning, image processing",
			Features:    "Классификация изображений (ResNet/EfficientNet)\nДетекция объектов (YOLO)\nFine-tuning на собственном датасете\nDrag-and-drop загрузка фото\nReal-time детекция через веб-камеру\nAPI для интеграции",
			WhyGood:     "Computer Vision используется в автопилотах, медицине, ритейле. Fine-tuning YOLO - навык, который сразу ставят в требования вакансий",
			Likes:       198,
			CompletedBy: 37,
		},
		{
			Title:       "Анализ тональности отзывов (NLP)",
			Description: "Сервис анализа настроений в текстах: классификация отзывов, извлечение ключевых тем и суммаризация.",
			Direction:   "ml-ai",
			Difficulty:  "beginner",
			Duration:    "2-3 недели",
			TechStack:   "Python, Hugging Face Transformers, spaCy, Streamlit",
			Skills:      "NLP, text classification, tokenization, pre-trained models, API design",
			Features:    "Классификация отзывов (позитив/негатив/нейтрал)\nИзвлечение ключевых фраз\nСуммаризация длинных текстов\nПоддержка русского и казахского\nBatch обработка CSV файлов\nВизуализация результатов",
			WhyGood:     "NLP на русском/казахском - редкий навык. Компании в ЦА ищут специалистов, которые работают с локальными языками",
			Likes:       178,
			CompletedBy: 52,
		},

		// ===== BLOCKCHAIN =====
		{
			Title:       "NFT Marketplace на Solidity",
			Description: "Децентрализованный маркетплейс для создания, покупки и продажи NFT с аукционами и роялти.",
			Direction:   "blockchain",
			Difficulty:  "advanced",
			Duration:    "1-2 месяца",
			TechStack:   "Solidity, Hardhat, React, ethers.js, IPFS, OpenZeppelin",
			Skills:      "Smart contracts, ERC-721, testing, gas optimization, IPFS, Web3 frontend",
			Features:    "Минтинг NFT с метаданными на IPFS\nERC-721 контракт с роялти (EIP-2981)\nАукцион с таймером\nПоиск и фильтрация по коллекциям\nПрофиль пользователя с кошельком\nUnit тесты контрактов (100% coverage)",
			WhyGood:     "Solidity разработчики - одни из самых высокооплачиваемых. NFT маркетплейс показывает полный цикл: smart contract + frontend + IPFS",
			Likes:       156,
			CompletedBy: 19,
		},

		// ===== EMBEDDED / IoT =====
		{
			Title:       "Умная погодная станция (IoT)",
			Description: "IoT устройство на ESP32/Raspberry Pi: датчики температуры, влажности, давления с веб-дашбордом и алертами.",
			Direction:   "embedded",
			Difficulty:  "beginner",
			Duration:    "2-3 недели",
			TechStack:   "C/MicroPython, ESP32, MQTT, InfluxDB, Grafana",
			Skills:      "Embedded programming, MQTT protocol, time-series DB, sensor integration",
			Features:    "Считывание данных с датчиков (DHT22, BMP280)\nОтправка через MQTT\nХранение в InfluxDB\nGrafana дашборд в реальном времени\nТелеграм-бот с алертами\nАвтономная работа от батареи",
			WhyGood:     "IoT проекты выделяют из толпы - это железо + софт + облако. В ЦА растёт спрос на IoT в агро и промышленности",
			Likes:       145,
			CompletedBy: 34,
		},
		{
			Title:       "Система умного дома на Raspberry Pi",
			Description: "Домашняя автоматизация: управление светом, климатом, камерами через мобильное приложение и голосовые команды.",
			Direction:   "embedded",
			Difficulty:  "intermediate",
			Duration:    "1-2 месяца",
			TechStack:   "Python, Raspberry Pi, Home Assistant, MQTT, React Native",
			Skills:      "IoT architecture, home automation, real-time control, mobile development",
			Features:    "Управление реле (свет, розетки)\nДатчики движения и температуры\nМобильное приложение с push-уведомлениями\nГолосовое управление\nРасписание и автоматические сценарии\nВеб-дашборд с историей",
			WhyGood:     "Полноценный IoT проект от железа до мобильного приложения. Показывает системное мышление и работу с реальными устройствами",
			Likes:       167,
			CompletedBy: 23,
		},

		// ===== СИСТЕМНОЕ ПРОГРАММИРОВАНИЕ =====
		{
			Title:       "Свой HTTP сервер с нуля",
			Description: "Реализация HTTP/1.1 сервера без фреймворков: парсинг запросов, роутинг, статические файлы, keep-alive.",
			Direction:   "backend",
			Difficulty:  "advanced",
			Duration:    "2-4 недели",
			TechStack:   "Go/Rust/C, TCP sockets",
			Skills:      "HTTP protocol, TCP sockets, concurrency, parsing, networking",
			Features:    "Парсинг HTTP запросов (GET, POST, PUT, DELETE)\nРоутинг с параметрами\nСтатические файлы\nKeep-alive соединения\nMiddleware поддержка\nConcurrent обработка (goroutines/threads)",
			WhyGood:     "Понимание HTTP изнутри - фундаментальное знание. Этот проект показывает, что вы понимаете, что происходит 'под капотом'",
			Likes:       189,
			CompletedBy: 25,
		},

		// ===== DATA ENGINEERING =====
		{
			Title:       "ETL Pipeline для аналитики продаж",
			Description: "Автоматический pipeline: извлечение данных из CSV/API, трансформация, загрузка в DWH и визуализация.",
			Direction:   "data-engineering",
			Difficulty:  "intermediate",
			Duration:    "2-3 недели",
			TechStack:   "Python, Apache Airflow, PostgreSQL, dbt, Metabase",
			Skills:      "ETL, data warehousing, workflow orchestration, SQL transformations",
			Features:    "Airflow DAGs для оркестрации\nИзвлечение из CSV, API, базы данных\ndbt модели для трансформации\nЗагрузка в PostgreSQL (star schema)\nMetabase дашборд\nАлерты при ошибках pipeline",
			WhyGood:     "Data Engineering - одна из самых быстрорастущих специальностей. ETL pipeline в портфолио открывает двери в data-команды",
			Likes:       156,
			CompletedBy: 22,
		},
		{
			Title:       "Real-time стриминг данных (Kafka + Flink)",
			Description: "Pipeline обработки событий в реальном времени: сбор кликстрима, агрегация и визуализация за секунды.",
			Direction:   "data-engineering",
			Difficulty:  "advanced",
			Duration:    "1-2 месяца",
			TechStack:   "Apache Kafka, Apache Flink, Python, ClickHouse, Grafana, Docker",
			Skills:      "Stream processing, event-driven architecture, OLAP databases, data pipelines",
			Features:    "Kafka producer для генерации событий\nFlink job для агрегации в реальном времени\nClickHouse для аналитических запросов\nGrafana дашборд с live-обновлением\nSchema Registry для валидации\nDocker Compose для всего стека",
			WhyGood:     "Real-time data - следующий уровень после batch ETL. Kafka + Flink в резюме = приглашение на собеседование в любой крупной компании",
			Likes:       134,
			CompletedBy: 14,
		},

		// ===== PRODUCT / UX =====
		{
			Title:       "UX-кейс: редизайн мобильного банкинга",
			Description: "Полный UX-кейс: исследование пользователей, анализ конкурентов, прототипирование и юзабилити-тестирование приложения банка.",
			Direction:   "product",
			Difficulty:  "beginner",
			Duration:    "2-3 недели",
			TechStack:   "Figma, FigJam, Maze, Google Forms, Notion",
			Skills:      "User research, competitive analysis, wireframing, prototyping, usability testing",
			Features:    "Анализ 5 конкурентов (Kaspi, Halyk, Tinkoff)\nИнтервью с 5-10 пользователями\nUser persona и Customer Journey Map\nWireframes → Hi-Fi прототип в Figma\nЮзабилити тест (5 участников)\nИтоговая презентация с метриками",
			WhyGood:     "Кейс-стади - главный формат портфолио для UX/Product дизайнера. Банки ЦА активно нанимают UX специалистов",
			Likes:       189,
			CompletedBy: 67,
		},
		{
			Title:       "Дизайн-система для стартапа",
			Description: "Создание полной дизайн-системы: токены, компоненты, документация и Storybook для команды разработки.",
			Direction:   "product",
			Difficulty:  "intermediate",
			Duration:    "3-4 недели",
			TechStack:   "Figma, Storybook, React, TailwindCSS, Chromatic",
			Skills:      "Design systems, component architecture, design tokens, documentation",
			Features:    "Design tokens (цвета, типографика, отступы)\n30+ UI компонентов в Figma\nReact компоненты с Storybook\nАвтотесты визуальных регрессий (Chromatic)\nДокументация по использованию\nТемная тема через токены",
			WhyGood:     "Дизайн-система показывает системное мышление. Это проект на стыке дизайна и разработки - уникальный навык на рынке",
			Likes:       145,
			CompletedBy: 31,
		},

		// ===== SRE / PLATFORM =====
		{
			Title:       "Observability Stack: мониторинг микросервисов",
			Description: "Полный стек наблюдаемости: метрики, логи, трейсы для микросервисного приложения с алертами и дашбордами.",
			Direction:   "devops",
			Difficulty:  "advanced",
			Duration:    "1-2 месяца",
			TechStack:   "Prometheus, Grafana, Loki, Tempo, OpenTelemetry, Docker",
			Skills:      "Observability, distributed tracing, log aggregation, alerting, SLI/SLO",
			Features:    "Prometheus метрики (RED/USE)\nGrafana дашборды с SLI/SLO\nLoki для централизованных логов\nTempo для распределённых трейсов\nOpenTelemetry инструментация\nAlertmanager + PagerDuty/Telegram алерты",
			WhyGood:     "SRE/Platform Engineering - одна из самых высокооплачиваемых IT специальностей. Observability stack в портфолио = мгновенный отклик от работодателей",
			Likes:       178,
			CompletedBy: 16,
		},
	}

	for _, idea := range ideas {
		if err := db.Create(&idea).Error; err != nil {
			return err
		}
		log.Printf("Seeded project idea: %s (%s)", idea.Title, idea.Direction)
	}

	return nil
}

// SeedStacks seeds technology stacks if they don't exist
func SeedStacks(db *gorm.DB) error {
	var count int64
	db.Model(&model.Stack{}).Count(&count)
	if count > 0 {
		log.Println("Stacks already seeded, skipping")
		return nil
	}

	stacks := []model.Stack{
		{Name: "Go", Popularity: 85},
		{Name: "Python", Popularity: 95},
		{Name: "JavaScript", Popularity: 98},
		{Name: "TypeScript", Popularity: 90},
		{Name: "React", Popularity: 92},
		{Name: "Vue.js", Popularity: 75},
		{Name: "Node.js", Popularity: 88},
		{Name: "PostgreSQL", Popularity: 87},
		{Name: "MySQL", Popularity: 80},
		{Name: "MongoDB", Popularity: 72},
		{Name: "Docker", Popularity: 89},
		{Name: "Kubernetes", Popularity: 70},
		{Name: "Flutter", Popularity: 78},
		{Name: "Kotlin", Popularity: 68},
		{Name: "Swift", Popularity: 60},
		{Name: "Java", Popularity: 82},
		{Name: "C#", Popularity: 65},
		{Name: "PHP", Popularity: 74},
		{Name: "Redis", Popularity: 76},
		{Name: "Nginx", Popularity: 71},
		{Name: "AWS", Popularity: 73},
		{Name: "Next.js", Popularity: 83},
	}

	for _, s := range stacks {
		if err := db.Create(&s).Error; err != nil {
			return err
		}
		log.Printf("Seeded stack: %s", s.Name)
	}
	return nil
}

// SeedCompanies seeds initial companies if they don't exist
func SeedCompanies(db *gorm.DB) error {
	var count int64
	db.Model(&model.Company{}).Count(&count)
	if count > 0 {
		log.Println("Companies already seeded, skipping")
		return nil
	}

	// Find region IDs
	var kazRegion, kgRegion, uzRegion model.Region
	db.Where("name ILIKE ?", "%Казахстан%").First(&kazRegion)
	db.Where("name ILIKE ?", "%Кыргызстан%").First(&kgRegion)
	db.Where("name ILIKE ?", "%Узбекистан%").First(&uzRegion)

	// Find some stacks
	var goStack, pythonStack, jsStack, tsStack, reactStack, nodeStack, pgStack, dockerStack, kotlinStack, flutterStack model.Stack
	db.Where("name = ?", "Go").First(&goStack)
	db.Where("name = ?", "Python").First(&pythonStack)
	db.Where("name = ?", "JavaScript").First(&jsStack)
	db.Where("name = ?", "TypeScript").First(&tsStack)
	db.Where("name = ?", "React").First(&reactStack)
	db.Where("name = ?", "Node.js").First(&nodeStack)
	db.Where("name = ?", "PostgreSQL").First(&pgStack)
	db.Where("name = ?", "Docker").First(&dockerStack)
	db.Where("name = ?", "Kotlin").First(&kotlinStack)
	db.Where("name = ?", "Flutter").First(&flutterStack)

	companies := []model.Company{
		{
			Name:        "Kaspi Bank",
			Description: "Крупнейший финтех Казахстана. Kaspi.kz — суперприложение с 14 млн пользователей: платежи, маркетплейс, кредиты. Активно нанимает Go, Python, React разработчиков.",
			CoverURL:    "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=800&q=80",
			Stack:       []model.Stack{goStack, pythonStack, reactStack, pgStack, dockerStack},
			Regions:     []model.Region{kazRegion},
			Widgets: model.CompanyWidgets{
				TrainingEnabled:   false,
				InternshipEnabled: true,
				VacancyEnabled:    true,
			},
			Contacts: model.ContactInfo{
				Website: "https://kaspi.kz",
			},
			Opportunities: []model.Opportunity{
				{
					Type:        "internship",
					Title:       "Backend стажёр (Go)",
					Description: "Разработка микросервисов на Go. Работа с PostgreSQL, Kafka, Docker. Наставник-ментор от команды.",
					Level:       "intern",
					ApplyURL:    "https://kaspi.kz/careers",
				},
				{
					Type:        "vacancy",
					Title:       "Frontend разработчик (React)",
					Description: "Разработка веб-интерфейсов Kaspi.kz. TypeScript, React, Next.js.",
					Level:       "junior",
					ApplyURL:    "https://kaspi.kz/careers",
				},
			},
		},
		{
			Name:        "Kolesa Group",
			Description: "IT-компания, создающая ведущие маркетплейсы Казахстана: Kolesa.kz, Krisha.kz, Market.kz. Одна из лучших продуктовых IT-компаний страны. Go, PHP, Flutter.",
			CoverURL:    "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
			Stack:       []model.Stack{goStack, flutterStack, pgStack, dockerStack},
			Regions:     []model.Region{kazRegion},
			Widgets: model.CompanyWidgets{
				TrainingEnabled:   false,
				InternshipEnabled: true,
				VacancyEnabled:    true,
			},
			Contacts: model.ContactInfo{
				Website: "https://kolesa-group.kz",
			},
			Opportunities: []model.Opportunity{
				{
					Type:        "internship",
					Title:       "iOS/Android стажёр (Flutter)",
					Description: "Разработка мобильных приложений Kolesa.kz и Krisha.kz на Flutter. Реальные задачи с первого дня.",
					Level:       "intern",
					ApplyURL:    "https://kolesa-group.kz/careers",
				},
				{
					Type:        "vacancy",
					Title:       "Go Backend разработчик",
					Description: "Разработка высоконагруженных сервисов для маркетплейсов. Go, PostgreSQL, Kafka.",
					Level:       "middle",
					ApplyURL:    "https://kolesa-group.kz/careers",
				},
			},
		},
		{
			Name:        "Chocofamily",
			Description: "Холдинг Казахстана: Chocofood, Chocolife, Chocotravel. E-commerce и food delivery с миллионами пользователей. Нанимают React, Node.js, Python разработчиков.",
			CoverURL:    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
			Stack:       []model.Stack{jsStack, tsStack, reactStack, nodeStack, pgStack},
			Regions:     []model.Region{kazRegion},
			Widgets: model.CompanyWidgets{
				TrainingEnabled:   false,
				InternshipEnabled: true,
				VacancyEnabled:    true,
			},
			Contacts: model.ContactInfo{
				Website: "https://chocofamily.kz",
			},
			Opportunities: []model.Opportunity{
				{
					Type:        "internship",
					Title:       "Frontend стажёр (React)",
					Description: "Разработка интерфейсов Chocofood и Chocolife. React, TypeScript, работа в продуктовой команде.",
					Level:       "intern",
					ApplyURL:    "https://chocofamily.kz/careers",
				},
			},
		},
		{
			Name:        "Jusan Bank",
			Description: "Один из быстрорастущих цифровых банков Казахстана. Активно развивает IT-команду и финтех-продукты. Kotlin, Swift, Go.",
			CoverURL:    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80",
			Stack:       []model.Stack{kotlinStack, goStack, pgStack, dockerStack},
			Regions:     []model.Region{kazRegion},
			Widgets: model.CompanyWidgets{
				TrainingEnabled:   false,
				InternshipEnabled: true,
				VacancyEnabled:    true,
			},
			Contacts: model.ContactInfo{
				Website: "https://jusan.kz",
			},
			Opportunities: []model.Opportunity{
				{
					Type:        "vacancy",
					Title:       "Android разработчик (Kotlin)",
					Description: "Разработка мобильного банкинга Jusan. Kotlin, Jetpack Compose, REST API.",
					Level:       "junior",
					ApplyURL:    "https://jusan.kz/careers",
				},
			},
		},
		{
			Name:        "EPAM Kazakhstan",
			Description: "Международная IT-компания с офисом в Алматы. Проекты для глобальных клиентов из Fortune 500. Хорошая точка входа в международные проекты.",
			CoverURL:    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
			Stack:       []model.Stack{jsStack, tsStack, reactStack, pythonStack, pgStack},
			Regions:     []model.Region{kazRegion},
			Widgets: model.CompanyWidgets{
				TrainingEnabled:   true,
				InternshipEnabled: true,
				VacancyEnabled:    true,
			},
			Contacts: model.ContactInfo{
				Website: "https://epam.com/careers",
			},
			Opportunities: []model.Opportunity{
				{
					Type:        "internship",
					Title:       "Junior JavaScript Developer",
					Description: "Программа EPAM University для студентов. Обучение + проект с командой. Возможность получить оффер.",
					Level:       "intern",
					ApplyURL:    "https://epam.com/careers",
				},
				{
					Type:        "vacancy",
					Title:       "Python Developer",
					Description: "Разработка backend сервисов для международных клиентов. Python, Django/FastAPI, PostgreSQL.",
					Level:       "middle",
					ApplyURL:    "https://epam.com/careers",
				},
			},
		},
		{
			Name:        "Uzum (Uzbekistan)",
			Description: "Крупнейший маркетплейс Узбекистана от Человекфактор. Быстро растущая IT-компания с сотнями вакансий. Go, Python, React.",
			CoverURL:    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80",
			Stack:       []model.Stack{goStack, pythonStack, reactStack, pgStack, dockerStack},
			Regions:     []model.Region{uzRegion},
			Widgets: model.CompanyWidgets{
				TrainingEnabled:   false,
				InternshipEnabled: true,
				VacancyEnabled:    true,
			},
			Contacts: model.ContactInfo{
				Website: "https://uzum.uz",
			},
			Opportunities: []model.Opportunity{
				{
					Type:        "vacancy",
					Title:       "Backend разработчик (Go)",
					Description: "Разработка высоконагруженных сервисов маркетплейса. Go, gRPC, PostgreSQL, Redis.",
					Level:       "junior",
					ApplyURL:    "https://uzum.uz/careers",
				},
			},
		},
	}

	for _, company := range companies {
		if err := db.Create(&company).Error; err != nil {
			return err
		}
		log.Printf("Seeded company: %s", company.Name)
	}
	return nil
}

// SeedSchools seeds initial schools if they don't exist
func SeedSchools(db *gorm.DB) error {
	var count int64
	db.Model(&model.School{}).Count(&count)
	if count > 0 {
		log.Println("Schools already seeded, skipping")
		return nil
	}

	schools := []model.School{
		{
			Name:        "Alem School",
			Description: "Бесплатная школа программирования от Beeline Казахстан. Принимают без опыта, без оплаты. Учат через проекты и peer-to-peer обучение. Более 500 выпускников устроились в IT.",
			Courses: []model.Course{
				{
					Title:       "Основы программирования (C)",
					Description: "Базовый курс на языке C. Алгоритмы, структуры данных, Unix. Входной отбор через онлайн-тест.",
					ExternalURL: "https://alem.school",
				},
				{
					Title:       "Web разработка",
					Description: "HTML, CSS, JavaScript, React. Fullstack проекты в командах.",
					ExternalURL: "https://alem.school",
				},
			},
		},
		{
			Name:        "IT Step Academy",
			Description: "Международная сеть IT-школ с офисами в Алматы, Астане, Бишкеке и Ташкенте. Программы от 6 месяцев до 2 лет. Трудоустройство через партнёров.",
			Courses: []model.Course{
				{
					Title:       "Web разработчик Full Stack",
					Description: "HTML/CSS, JavaScript, React, Node.js, PostgreSQL. 12 месяцев. Диплом государственного образца.",
					ExternalURL: "https://itstep.org",
				},
				{
					Title:       "Мобильная разработка (Android + iOS)",
					Description: "Kotlin для Android, Swift для iOS, Flutter для кроссплатформы. 10 месяцев.",
					ExternalURL: "https://itstep.org",
				},
				{
					Title:       "Data Science & ML",
					Description: "Python, Pandas, Sklearn, нейросети. 12 месяцев для начинающих.",
					ExternalURL: "https://itstep.org",
				},
			},
		},
		{
			Name:        "Geeks (Bishkek)",
			Description: "Ведущая IT-школа Кыргызстана. Практические курсы по веб-разработке, дизайну и аналитике. Партнёр крупных IT-компаний страны.",
			Courses: []model.Course{
				{
					Title:       "Frontend разработчик",
					Description: "React, TypeScript, CSS. 6 месяцев. Собственные проекты в портфолио.",
					ExternalURL: "https://geeks.kg",
				},
				{
					Title:       "Backend разработчик (Python/Django)",
					Description: "Python, Django, REST API, PostgreSQL. 8 месяцев.",
					ExternalURL: "https://geeks.kg",
				},
				{
					Title:       "UI/UX дизайн",
					Description: "Figma, прототипирование, исследование пользователей. 4 месяца.",
					ExternalURL: "https://geeks.kg",
				},
			},
		},
		{
			Name:        "QazCode",
			Description: "Онлайн-платформа для изучения программирования на казахском и русском языках. Курсы для школьников и студентов. Поддержка правительства Казахстана.",
			Courses: []model.Course{
				{
					Title:       "Python для начинающих",
					Description: "Первый курс программирования на Python. Алгоритмы, структуры данных. Бесплатно для школьников.",
					ExternalURL: "https://qazcode.kz",
				},
				{
					Title:       "Web разработка с нуля",
					Description: "HTML, CSS, JavaScript. Создай свой первый сайт за 2 месяца.",
					ExternalURL: "https://qazcode.kz",
				},
			},
		},
		{
			Name:        "Najot Ta'lim (Tashkent)",
			Description: "Крупнейшая IT-школа Узбекистана. 10 000+ выпускников. Курсы по всем направлениям IT. Гарантия трудоустройства для лучших студентов.",
			Courses: []model.Course{
				{
					Title:       "Flutter разработчик",
					Description: "Dart, Flutter, Firebase, публикация в App Store и Google Play. 6 месяцев.",
					ExternalURL: "https://najottalim.uz",
				},
				{
					Title:       "Backend (Java/Spring)",
					Description: "Java, Spring Boot, PostgreSQL, микросервисы. 8 месяцев.",
					ExternalURL: "https://najottalim.uz",
				},
				{
					Title:       "Data Science",
					Description: "Python, ML, Deep Learning, Computer Vision. 10 месяцев.",
					ExternalURL: "https://najottalim.uz",
				},
			},
		},
	}

	for _, school := range schools {
		if err := db.Create(&school).Error; err != nil {
			return err
		}
		log.Printf("Seeded school: %s", school.Name)
	}
	return nil
}

// SeedRegions seeds regions if they don't exist
func SeedRegions(db *gorm.DB) error {
	var count int64
	db.Model(&model.Region{}).Count(&count)
	if count > 0 {
		log.Println("Regions already seeded, skipping")
		return nil
	}

	regions := []model.Region{
		{Code: "KZ", Name: "Казахстан"},
		{Code: "KG", Name: "Кыргызстан"},
		{Code: "UZ", Name: "Узбекистан"},
		{Code: "EMEA", Name: "EMEA"},
	}

	for _, r := range regions {
		if err := db.Create(&r).Error; err != nil {
			return err
		}
		log.Printf("Seeded region: %s", r.Name)
	}
	return nil
}

// Seed runs all seeders (skips if data already exists)
func Seed(db *gorm.DB) error {
	log.Println("Starting database seeding...")

	if err := SeedRegions(db); err != nil {
		log.Printf("Error seeding regions: %v", err)
		return err
	}

	if err := SeedStacks(db); err != nil {
		log.Printf("Error seeding stacks: %v", err)
		return err
	}

	if err := SeedCompanies(db); err != nil {
		log.Printf("Error seeding companies: %v", err)
		return err
	}

	if err := SeedSchools(db); err != nil {
		log.Printf("Error seeding schools: %v", err)
		return err
	}

	if err := SeedCareerPaths(db); err != nil {
		log.Printf("Error seeding career paths: %v", err)
		return err
	}

	if err := SeedPathStages(db); err != nil {
		log.Printf("Error seeding path stages: %v", err)
		return err
	}

	if err := SeedInterviewQuestions(db); err != nil {
		log.Printf("Error seeding interview questions: %v", err)
		return err
	}

	if err := SeedProjectIdeas(db); err != nil {
		log.Printf("Error seeding project ideas: %v", err)
		return err
	}

	if err := SeedMoreCompanies(db); err != nil {
		log.Printf("Error seeding more companies: %v", err)
		return err
	}

	if err := SeedMoreSchools(db); err != nil {
		log.Printf("Error seeding more schools: %v", err)
		return err
	}

	if err := SeedInterviewQuestionsByTopic(db); err != nil {
		log.Printf("Error seeding interview questions by topic: %v", err)
		return err
	}

	if err := SeedAllPathStages(db); err != nil {
		log.Printf("Error seeding all path stages: %v", err)
		return err
	}

	if err := SeedHackathons(db); err != nil {
		log.Printf("Error seeding hackathons: %v", err)
		return err
	}

	if err := SeedInternshipsFromOSS(db); err != nil {
		log.Printf("Error seeding OSS internships: %v", err)
		return err
	}

	if err := SeedNewInternships(db); err != nil {
		log.Printf("Error seeding new internships: %v", err)
		return err
	}

	log.Println("Database seeding completed successfully!")
	return nil
}
