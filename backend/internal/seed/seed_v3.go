package seed

import (
	"log"
	"time"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

// SeedHackathons seeds initial hackathons if none exist.
func SeedHackathons(db *gorm.DB) error {
	var count int64
	db.Model(&model.Hackathon{}).Count(&count)
	if count > 0 {
		log.Println("Hackathons already seeded, skipping")
		return nil
	}

	regDeadline26 := time.Date(2026, 3, 26, 23, 59, 0, 0, time.UTC)
	startApril := time.Date(2026, 4, 1, 0, 0, 0, 0, time.UTC)

	hackathons := []model.Hackathon{
		{
			Title:                "Decentrathon 5",
			Description:          "Международный хакатон по Web3 и блокчейн-технологиям для разработчиков из Центральной Азии. Задача — создать децентрализованное приложение, решающее реальные проблемы региона.",
			Organizer:            "Astana Hub",
			Location:             "Астана, Казахстан",
			IsOnline:             false,
			PrizePool:            "$10 000+",
			RegisterURL:          "https://decentrathon.com",
			WebsiteURL:           "https://decentrathon.com",
			TechStack:            "Blockchain,Solidity,Web3,React,TypeScript",
			RegistrationDeadline: &regDeadline26,
			StartDate:            &startApril,
			IsActive:             true,
		},
		{
			Title:                "TerriconValley Hackathon",
			Description:          "Хакатон для стартапов и разработчиков, сфокусированный на технологиях для горнодобывающей и промышленной отрасли. Участники решают реальные кейсы крупных компаний.",
			Organizer:            "TerriconValley",
			Location:             "Алматы, Казахстан",
			IsOnline:             false,
			PrizePool:            "₸3 000 000",
			RegisterURL:          "https://terriconvalley.kz",
			WebsiteURL:           "https://terriconvalley.kz",
			TechStack:            "Python,ML,IoT,Go,React",
			RegistrationDeadline: &regDeadline26,
			StartDate:            &startApril,
			IsActive:             true,
		},
	}

	for i := range hackathons {
		if err := db.Create(&hackathons[i]).Error; err != nil {
			log.Printf("Failed to seed hackathon %s: %v", hackathons[i].Title, err)
		}
	}

	log.Printf("Seeded %d hackathons", len(hackathons))
	return nil
}

// SeedInternshipsFromOSS seeds companies and internship opportunities from
// open-source Kazakhstan IT internships data (github.com/danabeknar/kazakhstan-it-internships).
// All entries are marked source="oss-data" and is_verified=false.
func SeedInternshipsFromOSS(db *gorm.DB) error {
	var count int64
	db.Model(&model.Opportunity{}).Where("source = ?", "oss-data").Count(&count)
	if count > 0 {
		log.Println("OSS internship data already seeded, skipping")
		return nil
	}

	type companyEntry struct {
		Name        string
		Description string
		Website     string
		Industry    string
		Stacks      []string
		City        string
		ApplyURL    string
		IsYearRound bool
		IsPaid      string // "Да"|"Нет"|"Неизвестно"
		Level       string
	}

	companies := []companyEntry{
		{Name: "Kolesa Group", Description: "Крупнейший маркетплейс авто и недвижимости в Казахстане. Работает с Go, Kotlin, PHP.", Website: "https://kolesa.kz", Industry: "Marketplace", Stacks: []string{"Go", "Kotlin", "PHP", "PostgreSQL"}, City: "Алматы", ApplyURL: "https://hr.kolesa.kz", IsYearRound: true, IsPaid: "Да", Level: "intern"},
		{Name: "Kaspi.kz", Description: "Ведущий финтех-суперапп Казахстана: банкинг, eCommerce, платежи.", Website: "https://kaspi.kz", Industry: "Fintech", Stacks: []string{"Java", "Kotlin", "React", "Python"}, City: "Алматы", ApplyURL: "https://job.kaspi.kz", IsYearRound: true, IsPaid: "Да", Level: "intern"},
		{Name: "Kcell", Description: "Крупнейший оператор мобильной связи Казахстана, активно развивает IT-направление.", Website: "https://kcell.kz", Industry: "Telecom", Stacks: []string{"Java", "Python", "AWS"}, City: "Алматы", ApplyURL: "https://kcell.kz/ru/career", IsYearRound: false, IsPaid: "Да", Level: "intern"},
		{Name: "DataArt", Description: "Международная IT-компания, разрабатывающая ПО для финтех, медиа и туризма.", Website: "https://dataart.com", Industry: "IT Services", Stacks: []string{"C#", ".NET", "React", "TypeScript", "Python"}, City: "Алматы", ApplyURL: "https://dataart.com/career", IsYearRound: true, IsPaid: "Да", Level: "intern"},
		{Name: "One Technologies", Description: "Казахстанский системный интегратор и разработчик корпоративных решений.", Website: "https://one.kz", Industry: "IT Services", Stacks: []string{"Java", "Oracle", "React"}, City: "Алматы", ApplyURL: "https://one.kz/career", IsYearRound: false, IsPaid: "Да", Level: "intern"},
		{Name: "Technodom", Description: "Крупнейший ритейлер электроники в Казахстане с развитой IT-командой.", Website: "https://technodom.kz", Industry: "eCommerce", Stacks: []string{"Python", "React", "PostgreSQL"}, City: "Алматы", ApplyURL: "https://technodom.kz/company/career", IsYearRound: false, IsPaid: "Неизвестно", Level: "intern"},
		{Name: "PS&T", Description: "Крупная IT-компания Казахстана, специализирующаяся на разработке государственных и корпоративных систем.", Website: "https://pst.kz", Industry: "GovTech", Stacks: []string{"Java", ".NET", "Oracle"}, City: "Астана", ApplyURL: "https://pst.kz/career", IsYearRound: false, IsPaid: "Неизвестно", Level: "intern"},
		{Name: "DAR", Description: "Технологическая компания, создающая инновационные продукты для государства и бизнеса Казахстана.", Website: "https://dar.io", Industry: "GovTech / SaaS", Stacks: []string{"Go", "React", "Kubernetes", "PostgreSQL"}, City: "Астана", ApplyURL: "https://dar.io/career", IsYearRound: true, IsPaid: "Да", Level: "intern"},
		{Name: "Beeline Kazakhstan", Description: "Телекоммуникационная компания с активной digital-трансформацией.", Website: "https://beeline.kz", Industry: "Telecom", Stacks: []string{"Java", "Python", "React", "Kafka"}, City: "Алматы", ApplyURL: "https://beeline.kz/ru/help/about-beeline/career.html", IsYearRound: false, IsPaid: "Да", Level: "intern"},
		{Name: "Halyk Bank", Description: "Крупнейший банк Казахстана, активно развивающий digital-банкинг и fintech-продукты.", Website: "https://halykbank.kz", Industry: "Fintech / Banking", Stacks: []string{"Java", "Python", "React", "Oracle"}, City: "Алматы", ApplyURL: "https://jobs.smartrecruiters.com/HalykBank", IsYearRound: false, IsPaid: "Да", Level: "intern"},
		{Name: "Chocofamily", Description: "Экосистема онлайн-сервисов: Chocotravel, Chocolife, Chocofood.", Website: "https://choco.kz", Industry: "eCommerce / Travel", Stacks: []string{"PHP", "Python", "React", "Go"}, City: "Алматы", ApplyURL: "https://choco.kz/about/career", IsYearRound: false, IsPaid: "Да", Level: "intern"},
		{Name: "Aviata.kz", Description: "Крупнейший сервис покупки авиабилетов в Казахстане и Центральной Азии.", Website: "https://aviata.kz", Industry: "Travel Tech", Stacks: []string{"Python", "React", "PostgreSQL", "Redis"}, City: "Алматы", ApplyURL: "https://aviata.kz/jobs", IsYearRound: false, IsPaid: "Да", Level: "intern"},
		{Name: "EPAM Systems", Description: "Глобальная компания по разработке ПО, один из крупнейших работодателей для IT-специалистов СНГ.", Website: "https://epam.com", Industry: "IT Services", Stacks: []string{"Java", "Python", "React", ".NET", "AWS"}, City: "Алматы", ApplyURL: "https://www.epam.com/careers/job-listings?country=Kazakhstan", IsYearRound: true, IsPaid: "Да", Level: "intern"},
		{Name: "Jusan Bank", Description: "Цифровой банк с фокусом на технологии и молодую аудиторию.", Website: "https://jusan.kz", Industry: "Fintech / Banking", Stacks: []string{"Java", "Kotlin", "React", "Kubernetes"}, City: "Алматы", ApplyURL: "https://jusan.kz/ru/career", IsYearRound: false, IsPaid: "Да", Level: "intern"},
		{Name: "Freedom Finance", Description: "Инвестиционная группа компаний, активно развивающая fintech-экосистему.", Website: "https://ffin.kz", Industry: "Fintech", Stacks: []string{"Python", "React", "Go", "Java"}, City: "Алматы", ApplyURL: "https://hr.ffin.kz", IsYearRound: false, IsPaid: "Да", Level: "intern"},
		{Name: "Senim Mobile", Description: "Разработка мобильных решений для банков и финтех-компаний.", Website: "https://senim.kz", Industry: "Fintech", Stacks: []string{"Swift", "Kotlin", "React Native"}, City: "Алматы", ApplyURL: "https://senim.kz/career", IsYearRound: false, IsPaid: "Неизвестно", Level: "intern"},
	}

	for _, entry := range companies {
		// Find or create company by name
		var company model.Company
		if err := db.Where("name = ?", entry.Name).First(&company).Error; err != nil {
			company = model.Company{
				Name:        entry.Name,
				Description: entry.Description,
				Industry:    entry.Industry,
				Widgets: model.CompanyWidgets{
					InternshipEnabled: true,
					VacancyEnabled:    true,
				},
				Contacts: model.ContactInfo{
					Website: entry.Website,
				},
			}
			if err2 := db.Create(&company).Error; err2 != nil {
				log.Printf("Failed to create company %s: %v", entry.Name, err2)
				continue
			}
		}

		// Associate stacks
		for _, sName := range entry.Stacks {
			var stack model.Stack
			if err := db.FirstOrCreate(&stack, model.Stack{Name: sName}).Error; err == nil {
				db.Model(&company).Association("Stack").Append(&stack)
			}
		}

		// Create internship opportunity
		now := time.Now()
		deadline := now.AddDate(0, 3, 0) // 3 months from now as placeholder
		opp := model.Opportunity{
			CompanyID:   company.ID,
			Type:        "internship",
			Title:       "Стажировка в " + entry.Name,
			Level:       entry.Level,
			City:        entry.City,
			ApplyURL:    entry.ApplyURL,
			IsYearRound: entry.IsYearRound,
			Source:      "oss-data",
			IsVerified:  false,
		}
		if !entry.IsYearRound {
			opp.Deadline = &deadline
		}
		if entry.IsPaid == "Да" {
			opp.SalaryCurrency = "₸"
		}

		if err := db.Create(&opp).Error; err != nil {
			log.Printf("Failed to create opportunity for %s: %v", entry.Name, err)
		}
	}

	log.Printf("Seeded OSS internship data for %d companies", len(companies))
	return nil
}

// SeedNewInternships seeds specific known current internships (Avito, Yandex).
func SeedNewInternships(db *gorm.DB) error {
	var count int64
	db.Model(&model.Opportunity{}).Where("source = ?", "admin").
		Where("company_id IN (SELECT id FROM companies WHERE name IN ('Avito', 'Яндекс'))").
		Count(&count)
	if count > 0 {
		log.Println("Avito/Yandex internships already seeded, skipping")
		return nil
	}

	deadline := time.Date(2026, 3, 27, 23, 59, 0, 0, time.UTC)

	internships := []struct {
		CompanyName  string
		Description  string
		Website      string
		Industry     string
		ApplyURL     string
		Stacks       []string
		OpTitle      string
		OpDesc       string
		SalaryMin    int
		SalaryMax    int
		WorkFormat   string
		City         string
	}{
		{
			CompanyName: "Avito",
			Description: "Крупнейшая платформа объявлений в России и СНГ с мощной IT-командой. Офисы в Москве, Алматы и других городах.",
			Website:     "https://www.avito.ru",
			Industry:    "Marketplace",
			ApplyURL:    "https://internship.avito.ru",
			Stacks:      []string{"Go", "Python", "React", "TypeScript", "Kafka", "Kubernetes"},
			OpTitle:     "Summer Internship 2026 — Backend/Frontend/ML",
			OpDesc:      "Летняя стажировка в одной из крупнейших tech-компаний. Направления: Backend (Go), Frontend (React/TypeScript), ML/Data. Реальные задачи, ментор, оффер по итогам.",
			SalaryMin:   120000,
			SalaryMax:   180000,
			WorkFormat:  "hybrid",
			City:        "Москва / Удалённо",
		},
		{
			CompanyName: "Яндекс",
			Description: "Ведущая технологическая компания с продуктами от поиска до беспилотных автомобилей. Стажировки открыты для студентов всего СНГ.",
			Website:     "https://yandex.ru",
			Industry:    "Big Tech",
			ApplyURL:    "https://yandex.ru/jobs/pages/students",
			Stacks:      []string{"Python", "C++", "Go", "Java", "React", "MapReduce"},
			OpTitle:     "Стажировка Яндекса 2026",
			OpDesc:      "Стажировка в Яндексе — шанс поработать с реальными продуктами: Поиск, Браузер, YDB, ML-инфраструктура. Набор весна/лето 2026.",
			SalaryMin:   100000,
			SalaryMax:   160000,
			WorkFormat:  "hybrid",
			City:        "Москва / Санкт-Петербург / Удалённо",
		},
	}

	for _, entry := range internships {
		var company model.Company
		if err := db.Where("name = ?", entry.CompanyName).First(&company).Error; err != nil {
			company = model.Company{
				Name:        entry.CompanyName,
				Description: entry.Description,
				Industry:    entry.Industry,
				Widgets: model.CompanyWidgets{
					InternshipEnabled: true,
					VacancyEnabled:    true,
				},
				Contacts: model.ContactInfo{Website: entry.Website},
			}
			if err2 := db.Create(&company).Error; err2 != nil {
				log.Printf("Failed to create company %s: %v", entry.CompanyName, err2)
				continue
			}
		}

		for _, sName := range entry.Stacks {
			var stack model.Stack
			if err := db.FirstOrCreate(&stack, model.Stack{Name: sName}).Error; err == nil {
				db.Model(&company).Association("Stack").Append(&stack)
			}
		}

		opp := model.Opportunity{
			CompanyID:      company.ID,
			Type:           "internship",
			Title:          entry.OpTitle,
			Description:    entry.OpDesc,
			Level:          "intern",
			ApplyURL:       entry.ApplyURL,
			SalaryMin:      entry.SalaryMin,
			SalaryMax:      entry.SalaryMax,
			SalaryCurrency: "₽",
			WorkFormat:     entry.WorkFormat,
			City:           entry.City,
			Deadline:       &deadline,
			IsYearRound:    false,
			Source:         "admin",
			IsVerified:     true,
		}

		if err := db.Create(&opp).Error; err != nil {
			log.Printf("Failed to create opportunity for %s: %v", entry.CompanyName, err)
		}
	}

	log.Println("Seeded Avito/Yandex internships")
	return nil
}
