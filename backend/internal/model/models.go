package model

import (
	"time"

	"gorm.io/gorm"
)

// User represents platform user.
type User struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	Email         string `gorm:"uniqueIndex;size:255"`
	PasswordHash  string `gorm:"size:255"`
	FirstName     string `gorm:"size:120"`
	LastName      string `gorm:"size:120"`
	BirthDate     *time.Time
	Phone         string `gorm:"size:50"`
	Telegram      string `gorm:"size:100"`
	Bio           string `gorm:"size:255"`
	Theme         string `gorm:"size:20"`
	EmailVerified bool
	Achievements  []Achievement
	Privacy       PrivacySettings `gorm:"embedded;embeddedPrefix:privacy_"`
}

// PrivacySettings defines what information is private.
type PrivacySettings struct {
	PhonePrivate    bool
	TelegramPrivate bool
	EmailPrivate    bool
}

// Achievement represents user achievements.
type Achievement struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	UserID      uint   `gorm:"index"`
	Badge       string `gorm:"size:100"`
	Description string `gorm:"size:255"`
}

// Company represents companies on platform.
type Company struct {
	ID            uint `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	Name          string         `gorm:"size:255"`
	CoverURL      string         `gorm:"size:512"`
	Description   string         `gorm:"type:text"`
	Stack         []Stack        `gorm:"many2many:company_stacks"`
	Tools         string         `gorm:"size:255"`
	Widgets       CompanyWidgets `gorm:"embedded;embeddedPrefix:widget_"`
	Contacts      ContactInfo    `gorm:"embedded;embeddedPrefix:contact_"`
	Regions       []Region       `gorm:"many2many:company_regions"`
	Opportunities []Opportunity
}

// CompanyWidgets indicates sections enabled for company profile.
type CompanyWidgets struct {
	TrainingEnabled   bool
	InternshipEnabled bool
	VacancyEnabled    bool
}

// ContactInfo stores contact details.
type ContactInfo struct {
	Email    string `gorm:"size:255"`
	Phone    string `gorm:"size:100"`
	Telegram string `gorm:"size:100"`
	Website  string `gorm:"size:255"`
}

// Opportunity groups internships and vacancies.
type Opportunity struct {
	ID           uint `gorm:"primaryKey"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	CompanyID    uint   `gorm:"index"`
	Type         string `gorm:"size:20"`
	Title        string `gorm:"size:255"`
	Description  string `gorm:"type:text"`
	Requirements string `gorm:"type:text"`
	ApplyURL     string `gorm:"size:512"`
	Level        string `gorm:"size:50"`
	StartDate    *time.Time
	EndDate      *time.Time
	Stack        []Stack  `gorm:"many2many:opportunity_stacks"`
	Regions      []Region `gorm:"many2many:opportunity_regions"`
}

// School represents education providers.
type School struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Name        string      `gorm:"size:255"`
	CoverURL    string      `gorm:"size:512"`
	Description string      `gorm:"type:text"`
	Contacts    ContactInfo `gorm:"embedded;embeddedPrefix:contact_"`
	Courses     []Course
}

// Course describes training programs.
type Course struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	SchoolID    uint     `gorm:"index"`
	Title       string   `gorm:"size:255"`
	Description string   `gorm:"type:text"`
	Program     string   `gorm:"type:text"`
	ExternalURL string   `gorm:"size:512"`
	Stack       []Stack  `gorm:"many2many:course_stacks"`
	Regions     []Region `gorm:"many2many:course_regions"`
}

// Stack describes technology stacks.
type Stack struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	Name       string `gorm:"size:120;uniqueIndex"`
	Popularity uint
}

// Region enumerates geographies.
type Region struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	Code      string `gorm:"size:20;uniqueIndex"`
	Name      string `gorm:"size:120"`
}

// Certificate for validation.
type Certificate struct {
	ID         uint `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	Code       string `gorm:"size:64;uniqueIndex"`
	Type       string `gorm:"size:20"`
	IssuerType string `gorm:"size:50"`
	IssuerName string `gorm:"size:255"`
	Recipient  string `gorm:"size:255"`
	IssuedDate time.Time
	ExpiryDate *time.Time
	Metadata   string `gorm:"type:text"`
}

// PasswordResetToken stores password reset tokens.
type PasswordResetToken struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	Token     string `gorm:"size:255;uniqueIndex"`
	UserID    uint   `gorm:"index"`
	ExpiresAt time.Time
}

// AutoMigrate runs database migrations using GORM.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Achievement{},
		&Company{},
		&Opportunity{},
		&School{},
		&Course{},
		&Stack{},
		&Region{},
		&Certificate{},
		&PasswordResetToken{},
	)
}
