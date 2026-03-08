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

// CareerPath represents a structured learning path from student to junior specialist.
type CareerPath struct {
	ID          uint   `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Title       string `gorm:"size:255"` // e.g., "Backend Developer"
	Description string `gorm:"type:text"`
	Icon        string `gorm:"size:50"`  // emoji or icon name
	Duration    int    // in months
	Difficulty  string `gorm:"size:20"`  // beginner, intermediate, advanced
	CompletedBy uint   // how many students completed it
	Stages      []PathStage
	Courses     []Course `gorm:"many2many:career_path_courses"`
	Stack       []Stack  `gorm:"many2many:career_path_stacks"`
}

// PathStage represents a single stage in a career path (2-3 months of learning).
type PathStage struct {
	ID            uint   `gorm:"primaryKey"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	CareerPathID  uint   `gorm:"index"`
	Order         int    `gorm:"index"` // 1, 2, 3, ...
	Title         string `gorm:"size:255"`
	Description   string `gorm:"type:text"`
	DurationDays  int
	Milestone     string `gorm:"type:text"` // what student should achieve
	Badge         string `gorm:"size:100"`  // badge name earned after completion
	Courses       []Course `gorm:"many2many:path_stage_courses"`
	Questions     []InterviewQuestion `gorm:"many2many:path_stage_questions"`
}

// InterviewQuestion represents a question that might be asked during interviews.
type InterviewQuestion struct {
	ID               uint   `gorm:"primaryKey"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
	Question         string `gorm:"type:text;index"` // searchable question text
	Answer           string `gorm:"type:text"`       // detailed answer
	Explanation      string `gorm:"type:text"`       // extra context
	Level            string `gorm:"size:20"` // easy, medium, hard
	Topic            string `gorm:"size:100;index"`  // Python, SQL, Design Patterns, etc.
	TimesAsked       int    // how many times this question appeared on interviews
	SuccessRate      int    // percentage of people who answer correctly (0-100)
	Difficulty       int    // 1-5 scale
	Paths            []CareerPath `gorm:"many2many:interview_question_paths"`
	Stack            []Stack `gorm:"many2many:interview_question_stacks"`
}

// UserProgress tracks which path the student is taking and their progress.
type UserProgress struct {
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	UserID      uint `gorm:"index;uniqueIndex:udx_user_path"`
	CareerPathID uint `gorm:"index;uniqueIndex:udx_user_path"`
	StartedAt   time.Time
	CompletedAt *time.Time
	CurrentStage int
	Progress    int // percentage 0-100
}

// UserInterviewProgress tracks which interview questions user has reviewed.
type UserInterviewProgress struct {
	ID                  uint `gorm:"primaryKey"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
	UserID              uint `gorm:"index"`
	InterviewQuestionID uint `gorm:"index"`
	Status              string `gorm:"size:20"` // "learned", "studying", "mastered"
}

// ========== NEW: Job Search Platform Models ==========

// CompanyProfile extends Company with hiring/marketplace info
type CompanyProfile struct {
	ID              uint   `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	CompanyID       uint   `gorm:"uniqueIndex"`
	LogoURL         string `gorm:"size:512"`
	HeadquartersCity string `gorm:"size:120"`
	EmployeeCount   string `gorm:"size:50"` // "50-100", "100-500", etc
	FoundedYear     int
	Industry        string `gorm:"size:100"` // SaaS, Fintech, etc
	Website         string `gorm:"size:512"`
	LinkedinURL     string `gorm:"size:512"`
	GitHubURL       string `gorm:"size:512"`
	HiringNow       bool
	Description     string `gorm:"type:text"`

	// Relations
	Jobs            []Job
	InterviewQs     []JobInterviewQuestion
	Reviews         []CompanyReview
	HRAdvices       []HRAdvice
}

// Job represents a job posting/vacancy from a company
type Job struct {
	ID                uint   `gorm:"primaryKey"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
	CompanyID         uint   `gorm:"index"`
	Title             string `gorm:"size:255;index"`
	Description       string `gorm:"type:text"`
	Level             string `gorm:"size:50;index"` // intern, junior, middle, senior, lead
	JobType           string `gorm:"size:50"` // full-time, part-time, contract, internship
	Location          string `gorm:"size:255"` // "Remote", "Almaty", etc
	Countries         string `gorm:"size:255"` // "KZ,KG,UZ" - comma separated
	SalaryMin         int    // in USD
	SalaryMax         int    // in USD
	SalaryCurrency    string `gorm:"size:10"` // USD, KZT, etc
	WorkFormat        string `gorm:"size:100"` // "Remote", "Office", "Hybrid"

	// Requirements
	YearsExperience   int
	Requirements      string `gorm:"type:text"` // JSON array of strings
	NiceToHave        string `gorm:"type:text"` // JSON array
	SoftSkills        string `gorm:"type:text"` // JSON array: Communication, Leadership, etc

	// Tech stack
	Stacks            []Stack `gorm:"many2many:job_stacks"`

	// Application
	ApplicationURL    string `gorm:"size:512"`
	ApplicationEmail  string `gorm:"size:255"`

	// Metadata
	Views             int    // how many users viewed
	Applications      int    // how many applied
	InterviewQs       []JobInterviewQuestion
	Reviews           []JobReview
}

// JobInterviewQuestion represents actual questions asked for a specific job
type JobInterviewQuestion struct {
	ID              uint   `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	JobID           uint   `gorm:"index"`
	CompanyID       uint   `gorm:"index"`
	Question        string `gorm:"type:text;index"`
	AnswerTips      string `gorm:"type:text"`
	Category        string `gorm:"size:100"` // "Technical", "Behavioral", "System Design"
	Difficulty      int    // 1-5
	TimesAsked      int    // how many times reported
	SuccessRate     int    // 0-100%
	InterviewerName string `gorm:"size:255"`
	InterviewerRole string `gorm:"size:100"`

	// Link to generic question if exists
	GenericQuestionID *uint
}

// CompanyReview - отзывы о компании как работодателе
type CompanyReview struct {
	ID              uint   `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	CompanyID       uint   `gorm:"index"`
	UserID          uint   `gorm:"index"`
	Rating          float32 // 1-5
	Title           string `gorm:"size:255"`
	ReviewText      string `gorm:"type:text"`

	// Details
	WorkLifeBalance int    // 1-5
	SalaryRating    int    // 1-5
	GrowthRating    int    // 1-5
	CultureRating   int    // 1-5
	BenefitsRating  int    // 1-5

	// Employee status
	EmploymentType  string `gorm:"size:50"` // current, former
	Department      string `gorm:"size:120"`
	Position        string `gorm:"size:120"`
	YearsWorked     int
}

// JobReview - отзывы о конкретной вакансии/интервью процессе
type JobReview struct {
	ID                  uint   `gorm:"primaryKey"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
	JobID               uint   `gorm:"index"`
	CompanyID           uint   `gorm:"index"`
	UserID              uint   `gorm:"index"`
	InterviewRating     float32 // 1-5
	DifficultyLevel     int     // 1-5
	InterviewDuration   int     // in minutes
	RoundsCount         int     // how many interview rounds

	Review              string `gorm:"type:text"`
	Tips                string `gorm:"type:text"` // What to prepare
	WasHired            bool

	// Timeline
	AppliedAt           time.Time
	FirstInterviewAt    *time.Time
	FinalDecisionAt     *time.Time
}

// HRAdvice - советы от HR компаний о найме
type HRAdvice struct {
	ID              uint   `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	CompanyID       uint   `gorm:"index"`
	Title           string `gorm:"size:255"`
	Content         string `gorm:"type:text"`
	Category        string `gorm:"size:100"` // "Resume", "Interview", "Culture", "Growth"
	HRName          string `gorm:"size:255"`
	HRRole          string `gorm:"size:120"`

	// Metadata
	Views           int
	Helpful         int // like count
}

// TechStackPopularity - tracks which stacks are in demand
type TechStackPopularity struct {
	ID              uint   `gorm:"primaryKey"`
	StackID         uint   `gorm:"uniqueIndex:idx_stack_month"`
	Month           time.Time `gorm:"uniqueIndex:idx_stack_month"` // First day of month

	// Metrics
	JobsCount       int    // How many jobs require this stack
	CompaniesCount  int    // How many companies use this
	TrendScore      int    // 0-100 (growth indicator)
	AverageSalary   int    // in USD
}

// ConferenceEvent - conferences, meetups where people can network
type ConferenceEvent struct {
	ID              uint   `gorm:"primaryKey"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	Title           string `gorm:"size:255;index"`
	Description     string `gorm:"type:text"`
	EventType       string `gorm:"size:50"` // "Conference", "Meetup", "Webinar", "Hackathon"
	Location        string `gorm:"size:255"`
	Online          bool

	StartDate       time.Time
	EndDate         *time.Time

	Website         string `gorm:"size:512"`
	TicketURL       string `gorm:"size:512"`

	Topics          string `gorm:"size:500"` // "Backend,DevOps,Career"
	Companies       []Company `gorm:"many2many:conference_companies"`
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
		&CareerPath{},
		&PathStage{},
		&InterviewQuestion{},
		&UserProgress{},
		&UserInterviewProgress{},
		// New: Job Search Platform Models
		&CompanyProfile{},
		&Job{},
		&JobInterviewQuestion{},
		&CompanyReview{},
		&JobReview{},
		&HRAdvice{},
		&TechStackPopularity{},
		&ConferenceEvent{},
	)
}
