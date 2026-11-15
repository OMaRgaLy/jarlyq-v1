package seed

import (
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

type techTag struct {
	Name string
	Cat  string
	Pop  uint
}

// techCatalog is what companies and schools can be tagged with and searched by: it covers
// every IT profession (developers, QA, design, data, product, security, business), not only
// programming languages, plus the working methodologies.
var techCatalog = []techTag{
	// Языки
	{"JavaScript", model.StackLanguage, 98}, {"Python", model.StackLanguage, 95}, {"TypeScript", model.StackLanguage, 90},
	{"Java", model.StackLanguage, 85}, {"Go", model.StackLanguage, 85}, {"C#", model.StackLanguage, 80}, {"Kotlin", model.StackLanguage, 70},
	{"Swift", model.StackLanguage, 65}, {"PHP", model.StackLanguage, 70}, {"C++", model.StackLanguage, 70}, {"SQL", model.StackLanguage, 90},
	{"Ruby", model.StackLanguage, 45}, {"Rust", model.StackLanguage, 55}, {"Dart", model.StackLanguage, 50}, {"Scala", model.StackLanguage, 35},
	// Фреймворки и платформы
	{"React", model.StackFramework, 92}, {"Next.js", model.StackFramework, 75}, {"Vue.js", model.StackFramework, 75}, {"Angular", model.StackFramework, 65},
	{"Node.js", model.StackFramework, 88}, {"NestJS", model.StackFramework, 55}, {"Django", model.StackFramework, 70}, {"FastAPI", model.StackFramework, 60},
	{"Spring", model.StackFramework, 70}, {".NET", model.StackFramework, 70}, {"Laravel", model.StackFramework, 55}, {"1C", model.StackFramework, 60},
	{"SAP", model.StackFramework, 40},
	// Мобильная разработка
	{"Android", model.StackMobile, 70}, {"iOS", model.StackMobile, 65}, {"Flutter", model.StackMobile, 70}, {"React Native", model.StackMobile, 60},
	// Базы данных и очереди
	{"PostgreSQL", model.StackDatabase, 87}, {"MySQL", model.StackDatabase, 80}, {"MongoDB", model.StackDatabase, 72}, {"Redis", model.StackDatabase, 75},
	{"ClickHouse", model.StackDatabase, 50}, {"Elasticsearch", model.StackDatabase, 50}, {"Kafka", model.StackDatabase, 55}, {"RabbitMQ", model.StackDatabase, 45},
	// DevOps и инфраструктура
	{"Docker", model.StackDevOps, 89}, {"Kubernetes", model.StackDevOps, 70}, {"AWS", model.StackDevOps, 75}, {"Azure", model.StackDevOps, 55},
	{"Google Cloud", model.StackDevOps, 50}, {"Linux", model.StackDevOps, 80}, {"Nginx", model.StackDevOps, 60}, {"Git", model.StackDevOps, 90},
	{"CI/CD", model.StackDevOps, 75}, {"Terraform", model.StackDevOps, 50}, {"Ansible", model.StackDevOps, 40}, {"Системное администрирование", model.StackDevOps, 55},
	// Данные и ИИ
	{"Machine Learning", model.StackData, 80}, {"Data Science", model.StackData, 75}, {"Аналитика данных", model.StackData, 80}, {"Power BI", model.StackData, 55},
	{"Tableau", model.StackData, 40}, {"Excel", model.StackData, 70}, {"Pandas", model.StackData, 60}, {"PyTorch", model.StackData, 55},
	{"TensorFlow", model.StackData, 50}, {"LLM / GenAI", model.StackData, 70}, {"Data Engineering", model.StackData, 60}, {"Airflow", model.StackData, 40},
	// Тестирование
	{"Ручное тестирование", model.StackQA, 70}, {"Автотесты", model.StackQA, 70}, {"Selenium", model.StackQA, 55}, {"Cypress", model.StackQA, 45},
	{"Playwright", model.StackQA, 45}, {"Postman", model.StackQA, 55}, {"JMeter", model.StackQA, 35},
	// Дизайн
	{"Figma", model.StackDesign, 80}, {"UI/UX дизайн", model.StackDesign, 80}, {"UX-исследования", model.StackDesign, 50}, {"Прототипирование", model.StackDesign, 50},
	{"Дизайн-системы", model.StackDesign, 40}, {"Motion-дизайн", model.StackDesign, 35}, {"Photoshop", model.StackDesign, 50}, {"3D", model.StackDesign, 30},
	// Продукт и управление
	{"Product Management", model.StackManagement, 75}, {"Project Management", model.StackManagement, 70}, {"Бизнес-анализ", model.StackManagement, 70},
	{"Системный анализ", model.StackManagement, 65}, {"Jira", model.StackManagement, 70}, {"Продуктовая аналитика", model.StackManagement, 55},
	{"Технический писатель", model.StackManagement, 35},
	// Методологии
	{"Scrum", model.StackMethodology, 85}, {"Kanban", model.StackMethodology, 70}, {"Agile", model.StackMethodology, 90}, {"Waterfall", model.StackMethodology, 40},
	{"DevOps", model.StackMethodology, 75}, {"TDD", model.StackMethodology, 45}, {"Lean", model.StackMethodology, 35}, {"SAFe", model.StackMethodology, 30},
	// Безопасность
	{"Кибербезопасность", model.StackSecurity, 70}, {"Пентест", model.StackSecurity, 45}, {"SOC / SIEM", model.StackSecurity, 40}, {"Сетевая безопасность", model.StackSecurity, 45},
	{"Сети", model.StackSecurity, 50},
	// Бизнес, маркетинг и люди
	{"Digital-маркетинг", model.StackBusiness, 65}, {"SEO", model.StackBusiness, 55}, {"SMM", model.StackBusiness, 55}, {"Продажи в IT", model.StackBusiness, 50},
	{"HR / рекрутинг", model.StackBusiness, 55}, {"Поддержка клиентов", model.StackBusiness, 45}, {"DevRel", model.StackBusiness, 25}, {"Финтех", model.StackBusiness, 60},
}

// EnsureTechCatalog adds missing tags and sets categories. It never renames or deletes,
// and never touches popularity of tags that already exist, so it is safe on every start.
func EnsureTechCatalog(db *gorm.DB) error {
	for _, t := range techCatalog {
		tag := model.Stack{Name: t.Name, Category: t.Cat, Popularity: t.Pop}
		// New tag: insert. Existing one: only fill an empty category.
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoNothing: true,
		}).Create(&tag).Error; err != nil {
			return err
		}
		if err := db.Model(&model.Stack{}).Where("name = ? AND (category = '' OR category IS NULL)", t.Name).
			Update("category", t.Cat).Error; err != nil {
			return err
		}
	}
	log.Printf("Tech catalog ensured (%d tags)", len(techCatalog))
	return nil
}
