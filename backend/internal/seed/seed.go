package seed

import (
	"log"

	"github.com/example/jarlyq/internal/model"
	"gorm.io/gorm"
)

// SeedCareerPaths seeds initial career paths
func SeedCareerPaths(db *gorm.DB) error {
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

// SeedPathStages seeds stages for career paths
func SeedPathStages(db *gorm.DB) error {
	// Fetch first path (Backend) to add stages
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

// SeedInterviewQuestions seeds interview questions
func SeedInterviewQuestions(db *gorm.DB) error {
	questions := []model.InterviewQuestion{
		{
			Question:     "Чем отличается List от Tuple в Python?",
			Answer:       "List - это изменяемая коллекция (можно добавлять, удалять, изменять элементы), Tuple - неизменяемая (immutable). List медленнее, но гибче. Tuple можно использовать как ключи в словарях.",
			Explanation:  "Примеры: list = [1, 2, 3], tuple = (1, 2, 3). После создания tuple нельзя изменить.",
			Level:        "easy",
			Topic:        "Python",
			TimesAsked:   47,
			SuccessRate:  85,
			Difficulty:   1,
		},
		{
			Question:     "Объясни что такое REST API",
			Answer:       "REST (Representational State Transfer) - архитектурный стиль для создания веб-сервисов. Использует HTTP методы (GET, POST, PUT, DELETE) для операций с ресурсами. Каждый ресурс имеет уникальный URL.",
			Explanation:  "GET /users - получить список пользователей, POST /users - создать нового пользователя, PUT /users/1 - обновить пользователя с ID 1, DELETE /users/1 - удалить пользователя.",
			Level:        "medium",
			Topic:        "Web Development",
			TimesAsked:   89,
			SuccessRate:  78,
			Difficulty:   2,
		},
		{
			Question:     "Что такое индекс в базе данных?",
			Answer:       "Индекс - это структура данных, которая ускоряет поиск информации в таблице БД. Вместо сканирования всех строк, БД использует индекс для быстрого поиска.",
			Explanation:  "Индексы замедляют INSERT/UPDATE/DELETE, но ускоряют SELECT. Индекс на уникальном столбце (PRIMARY KEY, UNIQUE) гарантирует уникальность значений.",
			Level:        "medium",
			Topic:        "SQL",
			TimesAsked:   76,
			SuccessRate:  72,
			Difficulty:   2,
		},
		{
			Question:     "Что такое виртуальное окружение в Python?",
			Answer:       "Виртуальное окружение (venv) - это изолированная среда Python, где можно установить пакеты без влияния на системный Python. Каждый проект имеет свое окружение с нужными версиями пакетов.",
			Explanation:  "Создание: python -m venv myenv, Активация: source myenv/bin/activate (Linux/Mac) или myenv\\Scripts\\activate (Windows).",
			Level:        "easy",
			Topic:        "Python",
			TimesAsked:   54,
			SuccessRate:  88,
			Difficulty:   1,
		},
		{
			Question:     "Объясни что такое ORM (Object-Relational Mapping)",
			Answer:       "ORM - инструмент, который преобразует объекты программы в записи БД и наоборот. Позволяет работать с БД используя объекты вместо SQL запросов.",
			Explanation:  "Примеры: Django ORM, SQLAlchemy, Prisma. Преимущества: меньше SQL кода, автоматическая миграция. Недостатки: сложность, медленнее чем чистый SQL.",
			Level:        "medium",
			Topic:        "Web Development",
			TimesAsked:   68,
			SuccessRate:  76,
			Difficulty:   2,
		},
		{
			Question:     "Напиши алгоритм поиска в глубину (DFS)",
			Answer:       "DFS - рекурсивный алгоритм обхода графа в глубину. Посещает узел, отмечает как посещенный, затем рекурсивно посещает всех соседей.",
			Explanation:  "def dfs(node, visited, graph):\\n  visited.add(node)\\n  for neighbor in graph[node]:\\n    if neighbor not in visited:\\n      dfs(neighbor, visited, graph)",
			Level:        "medium",
			Topic:        "Algorithms",
			TimesAsked:   92,
			SuccessRate:  65,
			Difficulty:   3,
		},
		{
			Question:     "Что такое HTTP статус код 404?",
			Answer:       "404 Not Found - статус код, указывающий что запрашиваемый ресурс не найден на сервере. Это ошибка клиента (4xx), а не ошибка сервера.",
			Explanation:  "Примеры других 4xx: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500+ - ошибки сервера.",
			Level:        "easy",
			Topic:        "Web Development",
			TimesAsked:   73,
			SuccessRate:  95,
			Difficulty:   1,
		},
		{
			Question:     "Объясни концепцию SOLID принципов",
			Answer:       "SOLID - пять принципов хорошего дизайна ПО: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.",
			Explanation:  "Single Responsibility - класс должен отвечать за одно. Open/Closed - открыт для расширения, закрыт для изменения.",
			Level:        "hard",
			Topic:        "Design Patterns",
			TimesAsked:   45,
			SuccessRate:  58,
			Difficulty:   4,
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

// Seed runs all seeders
func Seed(db *gorm.DB) error {
	log.Println("Starting database seeding...")

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

	log.Println("Database seeding completed successfully!")
	return nil
}
