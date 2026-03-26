package seed

import (
	"log"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

// SeedStateProgramsAndUniversities adds state-funded programs and universities.
func SeedStateProgramsAndUniversities(db *gorm.DB) error {
	schools := []model.School{
		{
			Name:          "TechOrda",
			Type:          "state_program",
			IsStateFunded: true,
			Description:   "Государственная программа цифровизации Казахстана. Бесплатные курсы по IT для граждан Казахстана — от основ программирования до веб-разработки и Data Science. Финансируется из бюджета, сертификаты государственного образца.",
			Contacts:      model.ContactInfo{Website: "https://astanahub.com/en/techorda"},
			Courses: []model.Course{
				{
					Title:       "Основы программирования (Python)",
					Description: "Введение в алгоритмы, Python, базовые структуры данных. Для начинающих без опыта.",
					ExternalURL: "https://astanahub.com/en/techorda/course/",
					Price:       0, HasEmployment: false, Format: "online",
				},
				{
					Title:       "Web разработка",
					Description: "HTML, CSS, JavaScript, React. Полный цикл от верстки до фронтенд-приложения.",
					ExternalURL: "https://astanahub.com/en/techorda/course/",
					Price:       0, HasEmployment: false, Format: "online",
				},
				{
					Title:       "Data Science & Machine Learning",
					Description: "Python, Pandas, Sklearn, основы нейросетей. Практические проекты.",
					ExternalURL: "https://astanahub.com/en/techorda/course/",
					Price:       0, HasEmployment: false, Format: "online",
				},
			},
		},
		{
			Name:          "Tomorrow AI School",
			Type:          "state_program",
			IsStateFunded: true,
			Description:   "Бесплатная государственная школа AI и Data Science в Казахстане. Практическое обучение машинному обучению и искусственному интеллекту. Поддерживается правительством Казахстана в рамках Digital Kazakhstan.",
			Contacts:      model.ContactInfo{Website: "https://tomorrowai.school"},
			Courses: []model.Course{
				{
					Title:       "AI & Machine Learning",
					Description: "Supervised/Unsupervised learning, нейросети, Computer Vision, NLP. 6 месяцев, бесплатно.",
					ExternalURL: "https://tomorrowai.school",
					Price:       0, HasEmployment: true, Format: "hybrid",
				},
				{
					Title:       "Data Engineering",
					Description: "SQL, Python, Apache Spark, ETL-пайплайны, облачные платформы.",
					ExternalURL: "https://tomorrowai.school",
					Price:       0, HasEmployment: true, Format: "hybrid",
				},
			},
		},
		{
			Name:          "TUMO",
			Type:          "state_program",
			IsStateFunded: true,
			Description:   "TUMO — бесплатный центр творческих технологий для подростков 12–18 лет. Армянская программа, работает в Ереване, Париже и других городах. В Казахстане планируется открытие. Учат программированию, дизайну, анимации, робототехнике — в игровом формате без обязательных уроков.",
			Contacts:      model.ContactInfo{Website: "https://tumo.org"},
			Courses: []model.Course{
				{
					Title:       "Программирование (для школьников)",
					Description: "Scratch, Python, веб-разработка. Возраст 12–18 лет. Полностью бесплатно.",
					ExternalURL: "https://tumo.org",
					Price:       0, HasEmployment: false, Format: "offline",
				},
				{
					Title:       "Дизайн и анимация",
					Description: "Figma, Adobe, 3D-моделирование, game design. Для подростков.",
					ExternalURL: "https://tumo.org",
					Price:       0, HasEmployment: false, Format: "offline",
				},
				{
					Title:       "Робототехника и IoT",
					Description: "Arduino, Raspberry Pi, электроника, 3D-печать.",
					ExternalURL: "https://tumo.org",
					Price:       0, HasEmployment: false, Format: "offline",
				},
			},
		},
		{
			Name:          "IITU (Международный IT-университет)",
			Type:          "university",
			IsStateFunded: false,
			Description:   "Ведущий IT-университет Казахстана в Алматы. Программы бакалавриата и магистратуры по Computer Science, Software Engineering, Artificial Intelligence. Партнёры: Google, Microsoft, Kaspi.",
			CoverURL:      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
			Contacts:      model.ContactInfo{Website: "https://iitu.edu.kz", Telegram: "https://t.me/iitu_official"},
			Courses: []model.Course{
				{
					Title:        "Software Engineering (BSc)",
					Description:  "4-летняя программа: алгоритмы, ООП, веб-разработка, мобильные приложения, AI. Диплом государственного образца.",
					ExternalURL:  "https://iitu.edu.kz/programs",
					DurationWeeks: 208, Format: "offline", HasEmployment: true,
				},
				{
					Title:        "Artificial Intelligence (MSc)",
					Description:  "2-летняя магистратура: ML, Deep Learning, Computer Vision, NLP.",
					ExternalURL:  "https://iitu.edu.kz/master",
					DurationWeeks: 104, Format: "offline", HasEmployment: true,
				},
			},
		},
		{
			Name:          "SDU University",
			Type:          "university",
			IsStateFunded: false,
			Description:   "Suleyman Demirel University — международный университет в Каскелене (Алматы). Сильные программы по IT и инженерии, партнёрства с турецкими и европейскими вузами. Обучение на английском.",
			Contacts:      model.ContactInfo{Website: "https://sdu.edu.kz"},
			Courses: []model.Course{
				{
					Title:        "Computer Science (BSc)",
					Description:  "Программирование, алгоритмы, сети, базы данных. Обучение на английском. 4 года.",
					ExternalURL:  "https://sdu.edu.kz/en/faculties",
					DurationWeeks: 208, Format: "offline", HasEmployment: true,
				},
			},
		},
		{
			Name:          "Yandex Practicum",
			Type:          "bootcamp",
			IsStateFunded: false,
			Description:   "Онлайн-школа Яндекса с практическими курсами по разработке, аналитике и дизайну. Менторы — практикующие специалисты Яндекса. Помощь с трудоустройством для выпускников.",
			Contacts:      model.ContactInfo{Website: "https://practicum.yandex.ru"},
			Courses: []model.Course{
				{
					Title:        "Backend-разработчик (Python)",
					Description:  "Python, Django, PostgreSQL, Redis, Docker, CI/CD. 10 месяцев. Гарантия возврата денег если не устроишься.",
					ExternalURL:  "https://practicum.yandex.ru/backend-developer",
					Price: 350000, PriceCurrency: "₸", DurationWeeks: 40, Format: "online", HasEmployment: true,
				},
				{
					Title:        "Frontend-разработчик",
					Description:  "HTML/CSS, JavaScript, React, TypeScript. 10 месяцев.",
					ExternalURL:  "https://practicum.yandex.ru/frontend-developer",
					Price: 350000, PriceCurrency: "₸", DurationWeeks: 40, Format: "online", HasEmployment: true,
				},
				{
					Title:        "Data Scientist",
					Description:  "Python, ML, Deep Learning, A/B-тесты. 14 месяцев.",
					ExternalURL:  "https://practicum.yandex.ru/data-scientist",
					Price: 420000, PriceCurrency: "₸", DurationWeeks: 56, Format: "online", HasEmployment: true,
				},
			},
		},
	}

	for _, s := range schools {
		seedSchoolByName(db, s)
	}
	log.Println("SeedStateProgramsAndUniversities: done")
	return nil
}
