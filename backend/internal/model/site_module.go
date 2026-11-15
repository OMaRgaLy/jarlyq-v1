package model

import (
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Module states. A module is one big section of the site (companies catalog,
// schools, roadmaps, ...). The admin switches it between three states:
//
//	on   — works normally, shown in navigation
//	soon — shown in navigation with a "soon" badge; its page shows a teaser
//	off  — hidden everywhere, its page shows "not available"
//
// NOTE: modules control the *interface* only. Public API endpoints keep
// answering — a hidden section is not a security boundary.
const (
	ModuleOn   = "on"
	ModuleSoon = "soon"
	ModuleOff  = "off"
)

// IsValidModuleState reports whether s is one of the three known states.
func IsValidModuleState(s string) bool {
	return s == ModuleOn || s == ModuleSoon || s == ModuleOff
}

// SiteModule is one switchable section of the site.
type SiteModule struct {
	ID          uint      `gorm:"primaryKey" json:"-"`
	CreatedAt   time.Time `json:"-"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Key         string    `gorm:"size:50;uniqueIndex;not null" json:"key"`
	Label       string    `gorm:"size:100;not null" json:"label"`
	Description string    `gorm:"type:text" json:"description"` // teaser text for the "soon" page
	State       string    `gorm:"size:10;not null;default:'on'" json:"state"`
	SortOrder   int       `gorm:"default:0" json:"sortOrder"`
}

// DefaultSiteModules is the catalog of known modules. Everything starts as
// "on", so deploying this feature does not change how the live site behaves.
// To add a section: add it here and wire its route on the frontend.
func DefaultSiteModules() []SiteModule {
	return []SiteModule{
		{Key: "companies", Label: "Каталог компаний", SortOrder: 10,
			Description: "Профили IT-компаний: команды, стек, процессы найма и условия."},
		{Key: "internships", Label: "Стажировки", SortOrder: 20,
			Description: "Стажировки в IT-компаниях региона и мира с дедлайнами и условиями."},
		{Key: "jobs", Label: "Вакансии", SortOrder: 30,
			Description: "Вакансии для джуниоров и специалистов с фильтрами по стеку и формату."},
		{Key: "schools", Label: "Школы и курсы", SortOrder: 40,
			Description: "Каталог школ и курсов с практикой и помощью в трудоустройстве."},
		{Key: "masters", Label: "ВУЗы и магистратура", SortOrder: 50,
			Description: "Университеты мира, доступные гражданам СНГ, и материалы для поступления."},
		{Key: "career-paths", Label: "Роадмапы", SortOrder: 60,
			Description: "Пошаговые карьерные пути: что учить и в каком порядке."},
		{Key: "interview", Label: "Вопросы с собеседований", SortOrder: 70,
			Description: "База вопросов и задач с реальных собеседований."},
		{Key: "hackathons", Label: "Хакатоны", SortOrder: 80,
			Description: "Хакатоны и конкурсы, где можно показать себя."},
		{Key: "project-ideas", Label: "Идеи пет-проектов", SortOrder: 90,
			Description: "Идеи проектов для портфолио по направлениям."},
		{Key: "resources", Label: "Ресурсы", SortOrder: 100,
			Description: "Подборка курсов, статей, книг и видео."},
		{Key: "auth", Label: "Регистрация и вход", SortOrder: 110,
			Description: "Личный кабинет, избранное и персональные рекомендации."},
	}
}

// ModulePresets are one-click configurations for the admin panel.
// A preset describes the whole site: any module it does not list is turned
// "off" (except the "all" preset, which turns everything "on").
// See ApplyModulePreset.
var ModulePresets = map[string]map[string]string{
	// Показ MVP: работают только компании, стажировки и вакансии + регистрация.
	// Остальные разделы видны как «скоро», кроме пет-проектов — они скрыты.
	"mvp": {
		"companies":     ModuleOn,
		"internships":   ModuleOn,
		"jobs":          ModuleOn,
		"auth":          ModuleOn,
		"schools":       ModuleSoon,
		"masters":       ModuleSoon,
		"career-paths":  ModuleSoon,
		"interview":     ModuleSoon,
		"hackathons":    ModuleSoon,
		"resources":     ModuleSoon,
		"project-ideas": ModuleOff,
	},
	// Всё включено.
	"all": {},
}

// EnsureSiteModules inserts any default module that is missing. It never
// touches existing rows, so admin edits (state, label, description) survive
// restarts and upgrades.
func EnsureSiteModules(db *gorm.DB) error {
	for _, m := range DefaultSiteModules() {
		m.State = ModuleOn
		res := db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "key"}}, DoNothing: true}).Create(&m)
		if res.Error != nil {
			return fmt.Errorf("ensure module %q: %w", m.Key, res.Error)
		}
	}
	return nil
}

// ApplyModulePreset sets every known module's state according to the preset.
// For "all" every module becomes "on". For other presets, a module the preset
// does not mention becomes "off" — a preset describes the whole site, not a diff.
func ApplyModulePreset(db *gorm.DB, name string) error {
	preset, ok := ModulePresets[name]
	if !ok {
		return fmt.Errorf("unknown preset %q", name)
	}
	return db.Transaction(func(tx *gorm.DB) error {
		var modules []SiteModule
		if err := tx.Find(&modules).Error; err != nil {
			return err
		}
		for _, m := range modules {
			state := ModuleOff
			switch {
			case name == "all":
				state = ModuleOn
			default:
				if s, listed := preset[m.Key]; listed {
					state = s
				}
			}
			if m.State == state {
				continue
			}
			if err := tx.Model(&SiteModule{}).Where("id = ?", m.ID).Update("state", state).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
