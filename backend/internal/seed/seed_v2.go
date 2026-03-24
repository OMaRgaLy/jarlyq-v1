package seed

import (
	"log"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

// seedCompanyByName inserts company only if name doesn't exist yet
func seedCompanyByName(db *gorm.DB, c model.Company) {
	var existing model.Company
	if db.Where("name = ?", c.Name).First(&existing).Error == nil {
		return
	}
	if err := db.Create(&c).Error; err != nil {
		log.Printf("Error seeding company %s: %v", c.Name, err)
		return
	}
	log.Printf("Seeded company: %s", c.Name)
}

// seedSchoolByName inserts school only if name doesn't exist yet
func seedSchoolByName(db *gorm.DB, s model.School) {
	var existing model.School
	if db.Where("name = ?", s.Name).First(&existing).Error == nil {
		return
	}
	if err := db.Create(&s).Error; err != nil {
		log.Printf("Error seeding school %s: %v", s.Name, err)
		return
	}
	log.Printf("Seeded school: %s", s.Name)
}

// seedQuestionByText inserts question only if text doesn't exist yet
func seedQuestionByText(db *gorm.DB, q model.InterviewQuestion) {
	var existing model.InterviewQuestion
	if db.Where("question = ?", q.Question).First(&existing).Error == nil {
		return
	}
	if err := db.Create(&q).Error; err != nil {
		log.Printf("Error seeding question: %v", err)
		return
	}
}

// SeedMoreCompanies adds real IT companies from Central Asia
func SeedMoreCompanies(db *gorm.DB) error {
	var kz, uz model.Region
	db.Where("code = ?", "KZ").First(&kz)
	db.Where("code = ?", "UZ").First(&uz)

	var goStack, reactStack, pythonStack, jsStack, tsStack, dockerStack, k8sStack, pgStack, phpStack, flutterStack model.Stack
	db.Where("name = ?", "Go").First(&goStack)
	db.Where("name = ?", "React").First(&reactStack)
	db.Where("name = ?", "Python").First(&pythonStack)
	db.Where("name = ?", "JavaScript").First(&jsStack)
	db.Where("name = ?", "TypeScript").First(&tsStack)
	db.Where("name = ?", "Docker").First(&dockerStack)
	db.Where("name = ?", "Kubernetes").First(&k8sStack)
	db.Where("name = ?", "PostgreSQL").First(&pgStack)
	db.Where("name = ?", "PHP").First(&phpStack)
	db.Where("name = ?", "Flutter").First(&flutterStack)

	companies := []model.Company{
		{
			Name:        "Halyk Bank",
			Description: "Крупнейший банк Казахстана по активам. IT-команда занимается разработкой мобильного банкинга Halyk Home Bank, платёжных систем и внутренних сервисов. Более 500 IT-специалистов.",
			CoverURL:    "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: true, VacancyEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://halykbank.kz", Telegram: "https://t.me/halykbank"},
			Regions:     []model.Region{kz},
			Stack:       []model.Stack{goStack, reactStack, pgStack, dockerStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "Go Backend разработчик", Level: "middle", ApplyURL: "https://halykbank.kz/careers", Description: "Разработка микросервисов для системы платежей. Go, PostgreSQL, Kafka."},
				{Type: "internship", Title: "Junior iOS разработчик", Level: "intern", ApplyURL: "https://halykbank.kz/careers", Description: "Разработка мобильного банкинга. Swift, UIKit."},
			},
		},
		{
			Name:        "Freedom Finance",
			Description: "Крупнейший брокер и финтех-холдинг Казахстана и СНГ. Развивает Freedom Bank, Freedom Telecom, суперприложение. Активно нанимает Python, Go, React разработчиков.",
			CoverURL:    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: true, VacancyEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://ffin.kz", Telegram: "https://t.me/freedomfinancekz"},
			Regions:     []model.Region{kz},
			Stack:       []model.Stack{pythonStack, reactStack, pgStack, dockerStack, k8sStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "Python Backend Developer", Level: "junior", ApplyURL: "https://hh.kz/employer/9999", Description: "Разработка торговых систем и API. Python, FastAPI, PostgreSQL."},
				{Type: "vacancy", Title: "React Frontend Developer", Level: "middle", ApplyURL: "https://hh.kz/employer/9999", Description: "Разработка трейдинговых интерфейсов. React, TypeScript, WebSocket."},
			},
		},
		{
			Name:        "BTS Digital",
			Description: "Один из крупнейших IT-интеграторов Казахстана. Разрабатывает цифровые решения для государственных органов, банков и крупных предприятий. Партнёр Microsoft и Oracle.",
			CoverURL:    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: true, VacancyEnabled: true, TrainingEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://btsdigital.kz"},
			Regions:     []model.Region{kz},
			Stack:       []model.Stack{jsStack, reactStack, pgStack, dockerStack},
			Opportunities: []model.Opportunity{
				{Type: "internship", Title: "Full-stack стажёр", Level: "intern", ApplyURL: "https://btsdigital.kz/career", Description: "Разработка веб-приложений под руководством ментора. React, Node.js."},
				{Type: "vacancy", Title: "Java/Spring Backend разработчик", Level: "middle", ApplyURL: "https://btsdigital.kz/career", Description: "Интеграционные решения для enterprise клиентов."},
			},
		},
		{
			Name:        "DAR Technologies",
			Description: "Казахстанская IT-компания, создающая продукты для e-commerce, логистики и цифрового образования. Разработали популярные платформы для казахстанского рынка.",
			CoverURL:    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: true, VacancyEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://dar.io"},
			Regions:     []model.Region{kz},
			Stack:       []model.Stack{goStack, reactStack, tsStack, pgStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "Go разработчик", Level: "junior", ApplyURL: "https://dar.io/careers", Description: "Разработка высоконагруженных сервисов. Go, gRPC, PostgreSQL."},
			},
		},
		{
			Name:        "Beeline Kazakhstan",
			Description: "Один из крупнейших телеком-операторов Казахстана с сильной IT-командой. Разрабатывает B2C/B2B продукты, биллинговые системы и цифровые сервисы для 9 млн абонентов.",
			CoverURL:    "https://images.unsplash.com/photo-1528901166007-3784c7dd3653?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: true, VacancyEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://beeline.kz", Telegram: "https://t.me/beeline_kz"},
			Regions:     []model.Region{kz},
			Stack:       []model.Stack{pythonStack, reactStack, pgStack, dockerStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "Data Engineer", Level: "middle", ApplyURL: "https://beeline.kz/career", Description: "Обработка данных 9 млн пользователей. Python, Spark, Hadoop."},
				{Type: "internship", Title: "DevOps стажёр", Level: "intern", ApplyURL: "https://beeline.kz/career", Description: "CI/CD, мониторинг, облачная инфраструктура."},
			},
		},
		{
			Name:        "Smartbank (ForteBank)",
			Description: "Цифровой банк ForteBank — один из самых технологичных банков Казахстана. Команда разработки строит финтех-продукты с нуля, используя современный стек.",
			CoverURL:    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: false, VacancyEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://smartbank.kz"},
			Regions:     []model.Region{kz},
			Stack:       []model.Stack{goStack, reactStack, flutterStack, pgStack, k8sStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "iOS/Android разработчик (Flutter)", Level: "middle", ApplyURL: "https://smartbank.kz/careers", Description: "Разработка мобильного банка. Flutter, Dart, REST API."},
			},
		},
		{
			Name:        "2GIS Казахстан",
			Description: "Международная картографическая компания с офисом в Алматы. Разрабатывает продукты для навигации, городской инфраструктуры и бизнес-аналитики. Отличная инженерная культура.",
			CoverURL:    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: true, VacancyEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://2gis.kz"},
			Regions:     []model.Region{kz},
			Stack:       []model.Stack{pythonStack, reactStack, tsStack, pgStack, dockerStack, k8sStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "Python разработчик", Level: "middle", ApplyURL: "https://2gis.ru/company/jobs", Description: "Разработка геосервисов и API. Python, PostGIS, PostgreSQL."},
				{Type: "internship", Title: "Frontend стажёр", Level: "intern", ApplyURL: "https://2gis.ru/company/jobs", Description: "Разработка картографических веб-интерфейсов. React, TypeScript."},
			},
		},
		{
			Name:        "Payme",
			Description: "Крупнейший платёжный сервис Узбекистана. Миллионы транзакций ежедневно. IT-команда строит платёжную инфраструктуру, мобильные приложения и API для бизнеса.",
			CoverURL:    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: true, VacancyEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://payme.uz", Telegram: "https://t.me/paymeuz"},
			Regions:     []model.Region{uz},
			Stack:       []model.Stack{goStack, pythonStack, reactStack, pgStack, dockerStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "Go Backend разработчик", Level: "junior", ApplyURL: "https://payme.uz/careers", Description: "Разработка платёжных микросервисов. Go, PostgreSQL, Redis."},
				{Type: "internship", Title: "Mobile стажёр (Flutter)", Level: "intern", ApplyURL: "https://payme.uz/careers", Description: "Разработка мобильного приложения. Flutter, Dart."},
			},
		},
		{
			Name:        "Click",
			Description: "Один из первых и самых популярных платёжных сервисов Узбекистана. Обрабатывает коммунальные платежи, переводы и онлайн-оплаты для миллионов пользователей.",
			CoverURL:    "https://images.unsplash.com/photo-1620714223084-8fcacc2df34d?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: false, VacancyEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://click.uz", Telegram: "https://t.me/clickuz"},
			Regions:     []model.Region{uz},
			Stack:       []model.Stack{phpStack, reactStack, pgStack, dockerStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "PHP/Laravel разработчик", Level: "junior", ApplyURL: "https://click.uz/careers", Description: "Разработка платёжного API и личного кабинета. PHP, Laravel, MySQL."},
			},
		},
		{
			Name:        "Humans.uz",
			Description: "Крупный IT-холдинг Узбекистана — объединяет телеком, финтех и e-commerce. Строит цифровую экосистему страны. Команда 1000+ человек, активно растёт.",
			CoverURL:    "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80",
			Widgets:     model.CompanyWidgets{InternshipEnabled: true, VacancyEnabled: true, TrainingEnabled: true},
			Contacts:    model.ContactInfo{Website: "https://humans.uz"},
			Regions:     []model.Region{uz},
			Stack:       []model.Stack{goStack, reactStack, flutterStack, pgStack, k8sStack},
			Opportunities: []model.Opportunity{
				{Type: "vacancy", Title: "Frontend разработчик (React)", Level: "junior", ApplyURL: "https://humans.uz/careers", Description: "Разработка веб-продуктов экосистемы. React, TypeScript, Next.js."},
				{Type: "internship", Title: "Backend стажёр (Go)", Level: "intern", ApplyURL: "https://humans.uz/careers", Description: "Стажировка с наставником в команде бэкенда. Go, PostgreSQL."},
			},
		},
	}

	for _, c := range companies {
		seedCompanyByName(db, c)
	}
	return nil
}

// SeedMoreSchools adds real IT schools from Central Asia
func SeedMoreSchools(db *gorm.DB) error {
	schools := []model.School{
		{
			Name:        "Elbrus Bootcamp",
			Description: "Интенсивный буткемп по веб-разработке. 4 месяца интенсивного обучения с гарантией трудоустройства. Выпускники работают в Kaspi, Kolesa, EPAM.",
			CoverURL:    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
			Contacts:    model.ContactInfo{Website: "https://elbrusboot.camp", Telegram: "https://t.me/elbrus_kz"},
			Courses: []model.Course{
				{Title: "Fullstack JavaScript", Description: "HTML/CSS, JavaScript, React, Node.js, PostgreSQL. 4 месяца, с 0 до junior.", ExternalURL: "https://elbrusboot.camp/javascript"},
				{Title: "Python разработчик", Description: "Python, Django, PostgreSQL, Docker. От основ до junior за 4 месяца.", ExternalURL: "https://elbrusboot.camp/python"},
			},
		},
		{
			Name:        "SkillFactory",
			Description: "Онлайн-школа с фокусом на Data Science, аналитику и разработку. Курсы с практическими проектами и обратной связью от менторов.",
			CoverURL:    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80",
			Contacts:    model.ContactInfo{Website: "https://skillfactory.ru", Telegram: "https://t.me/skillfactory"},
			Courses: []model.Course{
				{Title: "Data Science Professional", Description: "Python, ML, Deep Learning, SQL, Tableau. 12 месяцев с проектами для портфолио.", ExternalURL: "https://skillfactory.ru/data-scientist"},
				{Title: "Python-разработчик", Description: "Django, DRF, PostgreSQL, Docker, CI/CD. 9 месяцев.", ExternalURL: "https://skillfactory.ru/python"},
				{Title: "Аналитик данных", Description: "SQL, Python, Excel, Tableau, Power BI. 8 месяцев.", ExternalURL: "https://skillfactory.ru/analyst"},
			},
		},
		{
			Name:        "IITU (Международный IT-университет)",
			Description: "Ведущий IT-университет Казахстана в Алматы. Программы бакалавриата и магистратуры по CS, SE, AI. Курсы для профессионального развития и корпоративное обучение.",
			CoverURL:    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
			Contacts:    model.ContactInfo{Website: "https://iitu.edu.kz", Telegram: "https://t.me/iitu_official"},
			Courses: []model.Course{
				{Title: "Software Engineering (BSc)", Description: "4-летняя программа: алгоритмы, ООП, веб-разработка, мобильные приложения, AI.", ExternalURL: "https://iitu.edu.kz/programs"},
				{Title: "Artificial Intelligence (MSc)", Description: "2-летняя магистратура: ML, Deep Learning, Computer Vision, NLP.", ExternalURL: "https://iitu.edu.kz/master"},
				{Title: "Курсы Python + ML", Description: "3-месячные вечерние курсы для работающих специалистов.", ExternalURL: "https://iitu.edu.kz/courses"},
			},
		},
		{
			Name:        "Netology",
			Description: "Онлайн-университет профессий цифрового мира. Курсы по веб-разработке, дизайну, маркетингу и аналитике с практикой на реальных проектах.",
			CoverURL:    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
			Contacts:    model.ContactInfo{Website: "https://netology.ru", Telegram: "https://t.me/netologyru"},
			Courses: []model.Course{
				{Title: "Frontend-разработчик", Description: "HTML, CSS, JavaScript, React, TypeScript. 10 месяцев, помощь с трудоустройством.", ExternalURL: "https://netology.ru/programs/frontend"},
				{Title: "Python-разработчик", Description: "Python, Django, PostgreSQL, Docker. 10 месяцев.", ExternalURL: "https://netology.ru/programs/python"},
				{Title: "UX/UI дизайнер", Description: "Figma, дизайн-системы, прототипирование. 9 месяцев.", ExternalURL: "https://netology.ru/programs/ux"},
			},
		},
		{
			Name:        "Softclub Academy",
			Description: "IT-академия при крупнейшей IT-компании Узбекистана Softclub. Обучение Java, Python, Mobile разработке с последующим трудоустройством в партнёрские компании.",
			CoverURL:    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
			Contacts:    model.ContactInfo{Website: "https://softclub.uz", Telegram: "https://t.me/softclub_academy"},
			Courses: []model.Course{
				{Title: "Java Developer", Description: "Java Core, Spring Boot, Hibernate, PostgreSQL. 6 месяцев, оффлайн в Ташкенте.", ExternalURL: "https://softclub.uz/courses/java"},
				{Title: "Mobile Developer (Flutter)", Description: "Dart, Flutter, Firebase, REST API. 4 месяца.", ExternalURL: "https://softclub.uz/courses/flutter"},
				{Title: "Frontend Developer", Description: "HTML, CSS, JavaScript, React. 4 месяца.", ExternalURL: "https://softclub.uz/courses/frontend"},
			},
		},
		{
			Name:        "Bilim Land",
			Description: "Казахстанская образовательная платформа для школьников и студентов. Контент на казахском и русском языках. IT-курсы для начинающих и подготовка к ЕНТ.",
			CoverURL:    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
			Contacts:    model.ContactInfo{Website: "https://bilimland.kz", Telegram: "https://t.me/bilimland"},
			Courses: []model.Course{
				{Title: "Основы программирования (Scratch/Python)", Description: "Для школьников 10-16 лет. Введение в алгоритмическое мышление.", ExternalURL: "https://bilimland.kz/courses/programming"},
				{Title: "Web-разработка для начинающих", Description: "HTML, CSS, JavaScript. Курс для старшеклассников и студентов 1-2 курса.", ExternalURL: "https://bilimland.kz/courses/web"},
			},
		},
	}

	for _, s := range schools {
		seedSchoolByName(db, s)
	}
	return nil
}

// SeedInterviewQuestionsByTopic adds questions categorized by specialty
func SeedInterviewQuestionsByTopic(db *gorm.DB) error {
	questions := []model.InterviewQuestion{
		// ===== BACKEND =====
		{
			Question:    "Что такое ACID в базах данных?",
			Answer:      "ACID — четыре свойства транзакций: Atomicity (атомарность — всё или ничего), Consistency (согласованность — БД остаётся в корректном состоянии), Isolation (изоляция — транзакции не мешают друг другу), Durability (долговечность — изменения сохраняются после commit).",
			Explanation: "Пример: перевод денег между счетами. Atomicity гарантирует, что деньги не исчезнут если транзакция прервётся. Durability — данные сохранятся даже при сбое сервера.",
			Level:       "medium",
			Topic:       "Backend",
			TimesAsked:  93,
			SuccessRate: 71,
			Difficulty:  3,
		},
		{
			Question:    "В чём разница между SQL и NoSQL базами данных?",
			Answer:      "SQL (реляционные): строгая схема, таблицы с отношениями, ACID, подходит для структурированных данных (MySQL, PostgreSQL). NoSQL: гибкая схема, горизонтальное масштабирование, eventual consistency, подходит для больших объёмов неструктурированных данных (MongoDB, Redis, Cassandra).",
			Explanation: "Когда использовать SQL: банки, финансы, ERP. NoSQL: социальные сети, кэш, очереди событий, каталоги товаров.",
			Level:       "medium",
			Topic:       "Backend",
			TimesAsked:  88,
			SuccessRate: 74,
			Difficulty:  2,
		},
		{
			Question:    "Что такое N+1 проблема в ORM?",
			Answer:      "N+1 — антипаттерн, когда для загрузки N объектов выполняется N+1 SQL запрос (1 для списка + по 1 на каждый объект для связанных данных). Решение: eager loading (prefetch_related в Django, Preload в GORM, include в Rails).",
			Explanation: "Пример: загрузка 100 постов с авторами. Без оптимизации: 1 запрос для постов + 100 запросов для авторов = 101 запрос. С eager loading: 2 запроса.",
			Level:       "medium",
			Topic:       "Backend",
			TimesAsked:  76,
			SuccessRate: 62,
			Difficulty:  3,
		},
		{
			Question:    "Объясни разницу между аутентификацией и авторизацией",
			Answer:      "Аутентификация (Authentication) — проверка личности пользователя: 'Кто ты?' (логин/пароль, OAuth, JWT). Авторизация (Authorization) — проверка прав: 'Что тебе можно делать?' (роли, permissions, ACL).",
			Explanation: "Сначала аутентификация, потом авторизация. Пример: войти в систему (auth) → получить доступ только к своим данным (authz).",
			Level:       "easy",
			Topic:       "Backend",
			TimesAsked:  105,
			SuccessRate: 82,
			Difficulty:  1,
		},
		{
			Question:    "Что такое горутины в Go и чем они отличаются от потоков?",
			Answer:      "Горутины — лёгкие потоки выполнения Go, управляемые Go runtime (не ОС). Занимают 2-8 КБ против 1-2 МБ у OS-потоков. Можно запустить миллионы горутин. Общаются через каналы (channels). Планировщик Go распределяет горутины по OS-потокам (M:N модель).",
			Explanation: "go func() { ... }() — запуск горутины. channel := make(chan int) — создание канала для связи. sync.WaitGroup для ожидания завершения.",
			Level:       "medium",
			Topic:       "Go",
			TimesAsked:  67,
			SuccessRate: 68,
			Difficulty:  3,
		},
		{
			Question:    "Что такое race condition и как избежать?",
			Answer:      "Race condition — ситуация, когда результат программы зависит от порядка выполнения потоков/горутин. Возникает при одновременном чтении и записи общих данных. Решения: мьютексы (sync.Mutex), атомарные операции (sync/atomic), каналы в Go.",
			Explanation: "Обнаружение в Go: go run -race main.go. Пример: два потока одновременно увеличивают счётчик — результат непредсказуем.",
			Level:       "hard",
			Topic:       "Go",
			TimesAsked:  54,
			SuccessRate: 55,
			Difficulty:  4,
		},
		// ===== FRONTEND =====
		{
			Question:    "Что такое Virtual DOM в React?",
			Answer:      "Virtual DOM — лёгкая JavaScript-копия реального DOM. React сначала обновляет Virtual DOM, затем сравнивает с предыдущей версией (reconciliation/diffing), и применяет только необходимые изменения к реальному DOM. Это быстрее прямой работы с DOM.",
			Explanation: "Процесс: setState() → перерендер компонента → обновление Virtual DOM → diff → patch реального DOM. Fiber — новый алгоритм reconciliation в React 16+.",
			Level:       "medium",
			Topic:       "Frontend",
			TimesAsked:  112,
			SuccessRate: 73,
			Difficulty:  2,
		},
		{
			Question:    "Объясни хуки useState и useEffect",
			Answer:      "useState — хук для локального состояния компонента: const [count, setCount] = useState(0). useEffect — хук для side effects (запросы к API, подписки, таймеры): useEffect(() => { ... }, [deps]). Пустой массив deps — выполняется один раз при монтировании. С зависимостями — при изменении deps.",
			Explanation: "Cleanup в useEffect: return () => { clearInterval(timer) } — вызывается при размонтировании или перед следующим эффектом.",
			Level:       "medium",
			Topic:       "Frontend",
			TimesAsked:  134,
			SuccessRate: 79,
			Difficulty:  2,
		},
		{
			Question:    "Что такое замыкание (closure) в JavaScript?",
			Answer:      "Замыкание — функция, которая сохраняет доступ к переменным из внешней области видимости даже после того, как внешняя функция завершила выполнение.",
			Explanation: "function counter() { let count = 0; return function() { return ++count; } } const inc = counter(); inc(); // 1, inc(); // 2 — функция 'закрывает' переменную count.",
			Level:       "medium",
			Topic:       "JavaScript",
			TimesAsked:  98,
			SuccessRate: 69,
			Difficulty:  3,
		},
		{
			Question:    "В чём разница между == и === в JavaScript?",
			Answer:      "== (нестрогое равенство) — сравнивает значения с приведением типов: '5' == 5 → true. === (строгое равенство) — сравнивает значения И типы без приведения: '5' === 5 → false. Всегда используй === чтобы избежать неожиданных результатов.",
			Explanation: "Ловушки ==: null == undefined → true, 0 == false → true, '' == false → true. С === все эти сравнения дадут false.",
			Level:       "easy",
			Topic:       "JavaScript",
			TimesAsked:  87,
			SuccessRate: 91,
			Difficulty:  1,
		},
		{
			Question:    "Что такое event delegation?",
			Answer:      "Event delegation — паттерн, при котором один обработчик событий ставится на родительский элемент вместо каждого дочернего. Используется всплытие событий (event bubbling). Эффективно для динамических списков.",
			Explanation: "document.getElementById('list').addEventListener('click', (e) => { if (e.target.tagName === 'LI') { console.log(e.target.textContent) } }) — один обработчик для всех <li>.",
			Level:       "medium",
			Topic:       "Frontend",
			TimesAsked:  65,
			SuccessRate: 67,
			Difficulty:  2,
		},
		{
			Question:    "Что такое CSS специфичность (specificity)?",
			Answer:      "Специфичность определяет какое CSS правило применяется при конфликте. Порядок приоритета (от низкого к высокому): элементы (0,0,1) → классы/атрибуты (0,1,0) → ID (1,0,0) → inline стили → !important.",
			Explanation: "div p { } — (0,0,2). .class p { } — (0,1,1). #id p { } — (1,0,1). Чем выше число — тем выше приоритет.",
			Level:       "medium",
			Topic:       "Frontend",
			TimesAsked:  71,
			SuccessRate: 65,
			Difficulty:  2,
		},
		// ===== DEVOPS =====
		{
			Question:    "Что такое Docker и зачем он нужен?",
			Answer:      "Docker — платформа контейнеризации. Контейнер — изолированная среда с приложением и всеми зависимостями. Преимущества: 'работает на моей машине' исчезает, лёгкое масштабирование, быстрый деплой, изоляция сервисов.",
			Explanation: "Dockerfile → docker build → docker image. docker run → docker container. docker-compose — для запуска нескольких сервисов. Отличие от VM: контейнеры делят ядро ОС, гораздо легче.",
			Level:       "easy",
			Topic:       "DevOps",
			TimesAsked:  145,
			SuccessRate: 83,
			Difficulty:  1,
		},
		{
			Question:    "Объясни CI/CD и зачем это нужно",
			Answer:      "CI (Continuous Integration) — автоматическая сборка и тестирование при каждом коммите. CD (Continuous Delivery/Deployment) — автоматическая доставка протестированного кода в prod. Цель: быстрые и надёжные релизы, раннее обнаружение ошибок.",
			Explanation: "Типичный pipeline: git push → автотесты → сборка Docker-образа → деплой на staging → (если ок) деплой на prod. Инструменты: GitHub Actions, GitLab CI, Jenkins.",
			Level:       "medium",
			Topic:       "DevOps",
			TimesAsked:  98,
			SuccessRate: 76,
			Difficulty:  2,
		},
		{
			Question:    "В чём разница между контейнером и виртуальной машиной?",
			Answer:      "VM: полная изоляция с собственным ядром ОС, тяжёлая (гигабайты), медленный старт (минуты). Контейнер: делит ядро хост-ОС, лёгкий (мегабайты), быстрый старт (секунды). VM безопаснее (полная изоляция), контейнеры быстрее и экономят ресурсы.",
			Explanation: "Hypervisor (VMware, VirtualBox) для VM. Docker Engine для контейнеров. На практике: используй контейнеры для микросервисов, VM — для изоляции ненадёжного кода.",
			Level:       "easy",
			Topic:       "DevOps",
			TimesAsked:  89,
			SuccessRate: 85,
			Difficulty:  1,
		},
		{
			Question:    "Что такое Kubernetes и когда его использовать?",
			Answer:      "Kubernetes (K8s) — система оркестрации контейнеров. Автоматизирует деплой, масштабирование и управление контейнерами. Основные концепции: Pod (группа контейнеров), Deployment (управление репликами), Service (сетевой доступ), Ingress (внешний доступ).",
			Explanation: "Когда нужен K8s: много микросервисов, нужно auto-scaling, высокая доступность (HA). Когда не нужен: небольшой проект, docker-compose достаточно.",
			Level:       "hard",
			Topic:       "DevOps",
			TimesAsked:  67,
			SuccessRate: 58,
			Difficulty:  4,
		},
		// ===== DATA SCIENCE =====
		{
			Question:    "Что такое переобучение (overfitting) модели?",
			Answer:      "Переобучение — когда модель слишком хорошо подстраивается под тренировочные данные, но плохо работает на новых. Признак: высокая точность на train, низкая на test. Методы борьбы: больше данных, dropout, L1/L2 регуляризация, cross-validation, уменьшение сложности модели.",
			Explanation: "Аналогия: студент заучил ответы к конкретным задачам, но не понял принципов — провалится на новых задачах.",
			Level:       "easy",
			Topic:       "Data Science",
			TimesAsked:  102,
			SuccessRate: 84,
			Difficulty:  1,
		},
		{
			Question:    "Объясни разницу между supervised и unsupervised learning",
			Answer:      "Supervised (обучение с учителем): модель учится на размеченных данных (вход + правильный ответ). Примеры: классификация, регрессия. Unsupervised (без учителя): модель ищет паттерны в неразмеченных данных. Примеры: кластеризация (k-means), снижение размерности (PCA).",
			Explanation: "Supervised: спам-фильтр (есть метки 'спам/не спам'). Unsupervised: сегментация клиентов без заданных категорий.",
			Level:       "easy",
			Topic:       "Data Science",
			TimesAsked:  94,
			SuccessRate: 87,
			Difficulty:  1,
		},
		{
			Question:    "Что такое precision и recall, когда важнее каждый из них?",
			Answer:      "Precision = TP/(TP+FP) — из всех предсказанных положительных, сколько реально положительных. Recall = TP/(TP+FN) — из всех реальных положительных, сколько мы нашли. Precision важна когда дорого ложное срабатывание (спам-фильтр). Recall важен когда дорого пропустить (диагностика рака).",
			Explanation: "F1 = 2*P*R/(P+R) — баланс между precision и recall. AUC-ROC — общая оценка качества классификатора.",
			Level:       "medium",
			Topic:       "Data Science",
			TimesAsked:  78,
			SuccessRate: 66,
			Difficulty:  3,
		},
		{
			Question:    "Что такое градиентный спуск?",
			Answer:      "Градиентный спуск — алгоритм оптимизации для минимизации функции потерь. На каждом шаге вычисляем градиент (направление наибольшего роста) и делаем шаг в противоположном направлении. Learning rate — размер шага. SGD — стохастический (по одному примеру), Mini-batch — по небольшим батчам.",
			Explanation: "Аналогия: спускаешься с горы в тумане — делаешь шаг в направлении наибольшего уклона вниз. Adam, RMSprop — адаптивные варианты.",
			Level:       "medium",
			Topic:       "Data Science",
			TimesAsked:  71,
			SuccessRate: 63,
			Difficulty:  3,
		},
		// ===== PRODUCT / PM =====
		{
			Question:    "Что такое PRD и зачем он нужен?",
			Answer:      "PRD (Product Requirements Document) — документ, описывающий что должен делать продукт и зачем. Содержит: цели, аудиторию, user stories, acceptance criteria, метрики успеха. Нужен чтобы команда понимала что строить и почему.",
			Explanation: "Структура PRD: проблема → целевые пользователи → решение → user stories → метрики → out of scope. В agile заменяется Product Backlog + Epic descriptions.",
			Level:       "easy",
			Topic:       "Product",
			TimesAsked:  45,
			SuccessRate: 78,
			Difficulty:  1,
		},
		{
			Question:    "Как приоритизировать фичи в бэклоге?",
			Answer:      "Популярные фреймворки: RICE (Reach × Impact × Confidence / Effort), MoSCoW (Must/Should/Could/Won't), Value vs Effort матрица, Kano модель (базовые/ожидаемые/восхитительные). Главное — связывать фичи с бизнес-метриками и OKR.",
			Explanation: "RICE пример: уведомления (Reach=1000, Impact=3, Confidence=80%, Effort=2 недели) → RICE score = 1000*3*0.8/2 = 1200. Чем выше — тем приоритетнее.",
			Level:       "medium",
			Topic:       "Product",
			TimesAsked:  62,
			SuccessRate: 71,
			Difficulty:  2,
		},
		{
			Question:    "Что такое A/B тестирование?",
			Answer:      "A/B тест — контролируемый эксперимент, где пользователи делятся на группы (A — контроль, B — вариант) и сравниваются метрики. Статистическая значимость p < 0.05. Используется для проверки гипотез о продукте без интуитивных решений.",
			Explanation: "Пример: тестируем зелёную vs красную кнопку CTA. Делим трафик 50/50, смотрим на конверсию 2 недели. Важно: одна переменная за раз, достаточная выборка.",
			Level:       "easy",
			Topic:       "Product",
			TimesAsked:  58,
			SuccessRate: 85,
			Difficulty:  1,
		},
	}

	for _, q := range questions {
		seedQuestionByText(db, q)
	}
	log.Println("Seeded interview questions by topic")
	return nil
}

// SeedAllPathStages adds stages for Frontend, Data Science, Mobile, DevOps paths
func SeedAllPathStages(db *gorm.DB) error {
	paths := map[string][]model.PathStage{
		"Frontend разработчик": {
			{Order: 1, Title: "HTML & CSS основы", Description: "Разметка страниц, блочная модель, flexbox, grid, адаптивная вёрстка.", DurationDays: 45, Milestone: "Вёрстка лендинга по макету", Badge: "Верстальщик"},
			{Order: 2, Title: "JavaScript основы", Description: "Типы данных, функции, массивы, объекты, DOM, события, fetch.", DurationDays: 60, Milestone: "To-do приложение на чистом JS", Badge: "JS Джуниор"},
			{Order: 3, Title: "TypeScript", Description: "Типизация, интерфейсы, дженерики, enum, утилитарные типы.", DurationDays: 30, Milestone: "Рефакторинг JS-проекта на TypeScript", Badge: "TS Разработчик"},
			{Order: 4, Title: "React", Description: "Компоненты, хуки, state management, React Query, маршрутизация.", DurationDays: 75, Milestone: "SPA с авторизацией и API", Badge: "React Разработчик"},
			{Order: 5, Title: "Тестирование и производительность", Description: "Jest, React Testing Library, Lighthouse, Web Vitals, lazy loading.", DurationDays: 30, Milestone: "100% покрытие тестами компонентов", Badge: "Качество Кода"},
			{Order: 6, Title: "Инструменты и деплой", Description: "Git, Webpack/Vite, CI/CD, Vercel/Netlify, npm пакеты.", DurationDays: 30, Milestone: "Задеплоить проект с автодеплоем", Badge: "Full Cycle"},
		},
		"Data Scientist": {
			{Order: 1, Title: "Python для анализа данных", Description: "Python, NumPy, Pandas, Matplotlib, Seaborn.", DurationDays: 60, Milestone: "Анализ реального датасета с визуализацией", Badge: "Аналитик"},
			{Order: 2, Title: "Статистика и математика", Description: "Вероятность, статистические тесты, линейная алгебра, матанализ.", DurationDays: 45, Milestone: "A/B тест на реальных данных", Badge: "Статистик"},
			{Order: 3, Title: "SQL для Data Science", Description: "Сложные запросы, оконные функции, агрегации, работа с большими таблицами.", DurationDays: 30, Milestone: "Аналитический отчёт только на SQL", Badge: "SQL Мастер"},
			{Order: 4, Title: "Машинное обучение", Description: "scikit-learn, регрессия, классификация, кластеризация, feature engineering.", DurationDays: 90, Milestone: "ML модель с точностью 85%+ на Kaggle", Badge: "ML Инженер"},
			{Order: 5, Title: "Deep Learning основы", Description: "PyTorch/TensorFlow, нейронные сети, CNN, RNN, трансформеры.", DurationDays: 90, Milestone: "Классификация изображений с CNN", Badge: "DL Разработчик"},
			{Order: 6, Title: "MLOps и деплой", Description: "Docker, FastAPI для ML, мониторинг моделей, MLflow.", DurationDays: 45, Milestone: "Задеплоить ML API в продакшн", Badge: "MLOps Инженер"},
		},
		"Mobile разработчик (Flutter)": {
			{Order: 1, Title: "Dart основы", Description: "Синтаксис Dart, ООП, асинхронность (Future, async/await), Streams.", DurationDays: 30, Milestone: "CLI приложение на Dart", Badge: "Dart Разработчик"},
			{Order: 2, Title: "Flutter UI", Description: "Widgets, layouts, Material Design, навигация, темы.", DurationDays: 45, Milestone: "Многоэкранное приложение с навигацией", Badge: "Flutter UI"},
			{Order: 3, Title: "State Management", Description: "Provider, Riverpod или Bloc — управление состоянием приложения.", DurationDays: 30, Milestone: "To-do приложение с state management", Badge: "State Master"},
			{Order: 4, Title: "Работа с API и данными", Description: "HTTP запросы (dio), JSON сериализация, локальное хранилище (Hive/SQLite).", DurationDays: 45, Milestone: "Приложение с авторизацией и REST API", Badge: "API Интегратор"},
			{Order: 5, Title: "Firebase и Push-уведомления", Description: "Firebase Auth, Firestore, Storage, FCM уведомления.", DurationDays: 30, Milestone: "Чат-приложение с Firebase", Badge: "Firebase Pro"},
			{Order: 6, Title: "Публикация и тестирование", Description: "Unit и widget тесты, публикация в App Store и Google Play.", DurationDays: 30, Milestone: "Приложение в Google Play", Badge: "Published Dev"},
		},
		"DevOps инженер": {
			{Order: 1, Title: "Linux и командная строка", Description: "Bash, файловая система, процессы, сети, SSH, vim/nano.", DurationDays: 30, Milestone: "Администрирование VPS сервера", Badge: "Linux Admin"},
			{Order: 2, Title: "Docker и контейнеризация", Description: "Dockerfile, docker-compose, сети, тома, docker registry.", DurationDays: 45, Milestone: "Контейнеризация multi-service приложения", Badge: "Docker Master"},
			{Order: 3, Title: "CI/CD пайплайны", Description: "GitHub Actions или GitLab CI: автотесты, сборка образов, деплой.", DurationDays: 30, Milestone: "Полный CI/CD pipeline с деплоем", Badge: "CI/CD Engineer"},
			{Order: 4, Title: "Kubernetes", Description: "Pods, Deployments, Services, Ingress, Helm, управление кластером.", DurationDays: 60, Milestone: "Деплой приложения в K8s кластер", Badge: "K8s Engineer"},
			{Order: 5, Title: "Мониторинг и логирование", Description: "Prometheus, Grafana, ELK stack, alerting, SLO/SLA.", DurationDays: 30, Milestone: "Дашборд мониторинга с алертами", Badge: "SRE Junior"},
			{Order: 6, Title: "Облачные платформы", Description: "AWS или GCP: EC2, S3, RDS, IAM, Terraform для IaC.", DurationDays: 60, Milestone: "Инфраструктура через Terraform", Badge: "Cloud Engineer"},
		},
	}

	for pathTitle, stages := range paths {
		var path model.CareerPath
		if err := db.Where("title = ?", pathTitle).First(&path).Error; err != nil {
			log.Printf("Career path not found: %s", pathTitle)
			continue
		}
		for _, stage := range stages {
			var existing model.PathStage
			if db.Where("career_path_id = ? AND \"order\" = ?", path.ID, stage.Order).First(&existing).Error == nil {
				continue
			}
			stage.CareerPathID = path.ID
			if err := db.Create(&stage).Error; err != nil {
				log.Printf("Error seeding stage %s: %v", stage.Title, err)
				continue
			}
			log.Printf("Seeded stage: %s → %s", pathTitle, stage.Title)
		}
	}
	return nil
}
