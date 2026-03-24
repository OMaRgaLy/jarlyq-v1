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
	TermsAccepted bool
	Achievements  []Achievement
	Privacy       PrivacySettings    `gorm:"embedded;embeddedPrefix:privacy_"`
	Profile       *UserExtProfile    `gorm:"foreignKey:UserID"`
	Experiences   []UserExperience   `gorm:"foreignKey:UserID"`
	Skills        []UserSkill        `gorm:"foreignKey:UserID"`
}

// PrivacySettings defines what information is private.
type PrivacySettings struct {
	PhonePrivate    bool
	TelegramPrivate bool
	EmailPrivate    bool
	ProfilePublic   bool // true = visible to everyone, false = private
}

// UserExtProfile stores extended public profile info.
type UserExtProfile struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"uniqueIndex" json:"userId"`
	AvatarURL   string    `gorm:"size:512" json:"avatarURL,omitempty"`
	City        string    `gorm:"size:100" json:"city,omitempty"`
	GithubURL   string    `gorm:"size:512" json:"githubURL,omitempty"`
	LinkedinURL string    `gorm:"size:512" json:"linkedinURL,omitempty"`
	InstagramURL string   `gorm:"size:512" json:"instagramURL,omitempty"`
	UpdatedAt   time.Time `json:"-"`
}

// UserExperience represents work/internship history.
type UserExperience struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      uint       `gorm:"index" json:"-"`
	CompanyName string     `gorm:"size:255" json:"companyName"`
	Position    string     `gorm:"size:255" json:"position"`
	StartDate   time.Time  `json:"startDate"`
	EndDate     *time.Time `json:"endDate,omitempty"`
	IsCurrent   bool       `json:"isCurrent"`
	Description string     `gorm:"type:text" json:"description,omitempty"`
	CreatedAt   time.Time  `json:"-"`
}

// UserSkill links a user to a technology stack with proficiency level.
type UserSkill struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index" json:"-"`
	StackID   uint      `json:"stackId"`
	Stack     Stack     `json:"stack"`
	Level     string    `gorm:"size:20" json:"level"` // beginner|intermediate|expert
	CreatedAt time.Time `json:"-"`
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

// CompanyOffice represents a physical office location.
type CompanyOffice struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	CompanyID uint   `gorm:"index" json:"-"`
	City      string `gorm:"size:100" json:"city"`
	Country   string `gorm:"size:100" json:"country"`
	Address   string `gorm:"size:255" json:"address,omitempty"`
	IsHQ      bool   `json:"isHQ"`
}

// CompanyPhoto represents a gallery photo for a company.
type CompanyPhoto struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	CompanyID uint   `gorm:"index" json:"-"`
	URL       string `gorm:"size:512" json:"url"`
	Caption   string `gorm:"size:255" json:"caption,omitempty"`
	SortOrder int    `json:"sortOrder"`
}

// CompanyShowcase is a pinned highlight on the company page (internship, event, news, etc.).
type CompanyShowcase struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	CompanyID   uint   `gorm:"index" json:"-"`
	Type        string `gorm:"size:50" json:"type"` // "internship" | "event" | "vacancy" | "news"
	Title       string `gorm:"size:255" json:"title"`
	Description string `gorm:"type:text" json:"description,omitempty"`
	ImageURL    string `gorm:"size:512" json:"imageURL,omitempty"`
	LinkURL     string `gorm:"size:512" json:"linkURL,omitempty"`
	SortOrder   int    `json:"sortOrder"`
}

// Company represents companies on platform.
type Company struct {
	ID            uint            `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time       `json:"-"`
	UpdatedAt     time.Time       `json:"-"`
	Name          string          `gorm:"size:255" json:"name"`
	CoverURL      string          `gorm:"size:512" json:"coverURL,omitempty"`
	LogoURL       string          `gorm:"size:512" json:"logoURL,omitempty"`
	Description   string          `gorm:"type:text" json:"description,omitempty"`
	About         string          `gorm:"type:text" json:"about,omitempty"`
	FoundedYear   int             `json:"foundedYear,omitempty"`
	EmployeeCount string          `gorm:"size:50" json:"employeeCount,omitempty"`
	Industry      string          `gorm:"size:100" json:"industry,omitempty"`
	Stack         []Stack         `gorm:"many2many:company_stacks" json:"stack,omitempty"`
	Tools         string          `gorm:"size:255" json:"-"`
	Widgets       CompanyWidgets  `gorm:"embedded;embeddedPrefix:widget_" json:"widgets"`
	Contacts      ContactInfo     `gorm:"embedded;embeddedPrefix:contact_" json:"contacts,omitempty"`
	Regions       []Region        `gorm:"many2many:company_regions" json:"regions,omitempty"`
	Opportunities []Opportunity   `json:"opportunities"`
	Offices       []CompanyOffice   `json:"offices,omitempty"`
	Photos        []CompanyPhoto    `json:"photos,omitempty"`
	Showcase      []CompanyShowcase `json:"showcase,omitempty"`
}

// CompanyWidgets indicates sections enabled for company profile.
type CompanyWidgets struct {
	TrainingEnabled   bool `json:"trainingEnabled"`
	InternshipEnabled bool `json:"internshipEnabled"`
	VacancyEnabled    bool `json:"vacancyEnabled"`
}

// ContactInfo stores contact details.
type ContactInfo struct {
	Email    string `gorm:"size:255" json:"email,omitempty"`
	Phone    string `gorm:"size:100" json:"phone,omitempty"`
	Telegram string `gorm:"size:100" json:"telegram,omitempty"`
	Website  string `gorm:"size:255" json:"website,omitempty"`
}

// Opportunity groups internships and vacancies.
type Opportunity struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time  `json:"-"`
	UpdatedAt      time.Time  `json:"-"`
	CompanyID      uint       `gorm:"index" json:"-"`
	Type           string     `gorm:"size:20" json:"type"`
	Title          string     `gorm:"size:255" json:"title"`
	Description    string     `gorm:"type:text" json:"description,omitempty"`
	Requirements   string     `gorm:"type:text" json:"-"`
	ApplyURL       string     `gorm:"size:512" json:"applyURL,omitempty"`
	Level          string     `gorm:"size:50" json:"level"`
	SalaryMin      int        `json:"salaryMin,omitempty"`
	SalaryMax      int        `json:"salaryMax,omitempty"`
	SalaryCurrency string     `gorm:"size:10" json:"salaryCurrency,omitempty"`
	WorkFormat     string     `gorm:"size:20" json:"workFormat,omitempty"` // remote|office|hybrid
	City           string     `gorm:"size:100" json:"city,omitempty"`
	Deadline       *time.Time `json:"deadline,omitempty"`
	IsYearRound    bool       `json:"isYearRound"`
	Source         string     `gorm:"size:100" json:"source,omitempty"`  // "admin"|"oss-data"|"partner"
	IsVerified     bool       `json:"isVerified"`
	StartDate      *time.Time `json:"-"`
	EndDate        *time.Time `json:"-"`
	Stack          []Stack    `gorm:"many2many:opportunity_stacks" json:"-"`
	Regions        []Region   `gorm:"many2many:opportunity_regions" json:"-"`
}

// School represents education providers.
type School struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time   `json:"-"`
	UpdatedAt   time.Time   `json:"-"`
	Name        string      `gorm:"size:255" json:"name"`
	CoverURL    string      `gorm:"size:512" json:"coverURL,omitempty"`
	Description string      `gorm:"type:text" json:"description,omitempty"`
	Contacts    ContactInfo `gorm:"embedded;embeddedPrefix:contact_" json:"contacts,omitempty"`
	Courses     []Course    `json:"courses"`
}

// Course describes training programs.
type Course struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time `json:"-"`
	UpdatedAt      time.Time `json:"-"`
	SchoolID       uint      `gorm:"index" json:"-"`
	Title          string    `gorm:"size:255" json:"title"`
	Description    string    `gorm:"type:text" json:"description,omitempty"`
	Program        string    `gorm:"type:text" json:"-"`
	ExternalURL    string    `gorm:"size:512" json:"externalURL,omitempty"`
	Price          int       `json:"price,omitempty"`
	PriceCurrency  string    `gorm:"size:10" json:"priceCurrency,omitempty"`
	DurationWeeks  int       `json:"durationWeeks,omitempty"`
	Format         string    `gorm:"size:20" json:"format,omitempty"` // online|offline|hybrid
	HasEmployment  bool      `json:"hasEmployment"`
	Stack          []Stack   `gorm:"many2many:course_stacks" json:"-"`
	Regions        []Region  `gorm:"many2many:course_regions" json:"-"`
}

// Stack describes technology stacks.
type Stack struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"-"`
	UpdatedAt  time.Time `json:"-"`
	Name       string    `gorm:"size:120;uniqueIndex" json:"name"`
	Popularity uint      `json:"popularity"`
	IsTrending bool      `json:"isTrending"`
}

// Region enumerates geographies.
type Region struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"-"`
	UpdatedAt time.Time `json:"-"`
	Code      string    `gorm:"size:20;uniqueIndex" json:"code"`
	Name      string    `gorm:"size:120" json:"name"`
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
	ID          uint        `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time   `json:"-"`
	UpdatedAt   time.Time   `json:"-"`
	Title       string      `gorm:"size:255" json:"title"`
	Description string      `gorm:"type:text" json:"description"`
	Icon        string      `gorm:"size:50" json:"icon"`
	Duration    int         `json:"duration"`
	Difficulty  string      `gorm:"size:20" json:"difficulty"`
	CompletedBy uint        `json:"completedBy"`
	Stages      []PathStage `json:"stages,omitempty"`
	Courses     []Course    `gorm:"many2many:career_path_courses" json:"-"`
	Stack       []Stack     `gorm:"many2many:career_path_stacks" json:"-"`
}

// PathStage represents a single stage in a career path (2-3 months of learning).
type PathStage struct {
	ID           uint                `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time           `json:"-"`
	UpdatedAt    time.Time           `json:"-"`
	CareerPathID uint                `gorm:"index" json:"careerPathId"`
	Order        int                 `gorm:"index" json:"order"`
	Title        string              `gorm:"size:255" json:"title"`
	Description  string              `gorm:"type:text" json:"description"`
	DurationDays int                 `json:"durationDays"`
	Milestone    string              `gorm:"type:text" json:"milestone"`
	Badge        string              `gorm:"size:100" json:"badge"`
	Courses      []Course            `gorm:"many2many:path_stage_courses" json:"-"`
	Questions    []InterviewQuestion `gorm:"many2many:path_stage_questions" json:"-"`
}

// InterviewQuestion represents a question that might be asked during interviews.
type InterviewQuestion struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time    `json:"-"`
	UpdatedAt   time.Time    `json:"-"`
	Question    string       `gorm:"type:text;index" json:"question"`
	Answer      string       `gorm:"type:text" json:"answer"`
	Explanation string       `gorm:"type:text" json:"explanation"`
	Level       string       `gorm:"size:20" json:"level"`
	Topic       string       `gorm:"size:100;index" json:"topic"`
	TimesAsked  int          `json:"timesAsked"`
	SuccessRate int          `json:"successRate"`
	Difficulty  int          `json:"difficulty"`
	Paths       []CareerPath `gorm:"many2many:interview_question_paths" json:"-"`
	Stack       []Stack      `gorm:"many2many:interview_question_stacks" json:"-"`
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
	Jobs            []Job                 `gorm:"foreignKey:CompanyID"`
	InterviewQs     []JobInterviewQuestion `gorm:"foreignKey:CompanyID"`
	Reviews         []CompanyReview        `gorm:"foreignKey:CompanyID"`
	HRAdvices       []HRAdvice             `gorm:"foreignKey:CompanyID"`
}

// Job represents a job posting/vacancy from a company
type Job struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	CreatedAt        time.Time `json:"-"`
	UpdatedAt        time.Time `json:"-"`
	CompanyID        uint      `gorm:"index" json:"companyId"`
	Title            string    `gorm:"size:255;index" json:"title"`
	Description      string    `gorm:"type:text" json:"description"`
	Level            string    `gorm:"size:50;index" json:"level"`
	JobType          string    `gorm:"size:50" json:"jobType"`
	Location         string    `gorm:"size:255" json:"location"`
	Countries        string    `gorm:"size:255" json:"countries"`
	SalaryMin        int       `json:"salaryMin"`
	SalaryMax        int       `json:"salaryMax"`
	SalaryCurrency   string    `gorm:"size:10" json:"salaryCurrency"`
	WorkFormat       string    `gorm:"size:100" json:"workFormat"`
	YearsExperience  int       `json:"yearsExperience"`
	Requirements     string    `gorm:"type:text" json:"requirements"`
	NiceToHave       string    `gorm:"type:text" json:"-"`
	SoftSkills       string    `gorm:"type:text" json:"-"`
	Stacks           []Stack   `gorm:"many2many:job_stacks" json:"-"`
	ApplicationURL   string    `gorm:"size:512" json:"applicationURL,omitempty"`
	ApplicationEmail string    `gorm:"size:255" json:"applicationEmail,omitempty"`
	Views            int       `json:"views"`
	Applications     int       `json:"applications"`
	InterviewQs      []JobInterviewQuestion `json:"-"`
	Reviews          []JobReview            `json:"-"`
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

// ProjectIdea represents a pet-project idea for portfolio building.
type ProjectIdea struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"-"`
	UpdatedAt   time.Time `json:"-"`
	Title       string    `gorm:"size:255" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Direction   string    `gorm:"size:50;index" json:"direction"`
	Difficulty  string    `gorm:"size:20;index" json:"difficulty"`
	Duration    string    `gorm:"size:50" json:"duration"`
	TechStack   string    `gorm:"type:text" json:"techStack"`
	Skills      string    `gorm:"type:text" json:"skills"`
	Features    string    `gorm:"type:text" json:"features"`
	WhyGood     string    `gorm:"type:text" json:"whyGood"`
	ExampleURL  string    `gorm:"size:512" json:"exampleURL,omitempty"`
	Likes       int       `json:"likes"`
	CompletedBy int       `json:"completedBy"`
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
		&ProjectIdea{},
		&Suggestion{},
		&CompanyOffice{},
		&CompanyPhoto{},
		&CompanyShowcase{},
		&HRContact{},
		&HRContent{},
		&Hackathon{},
		&UserExtProfile{},
		&UserExperience{},
		&UserSkill{},
	)
}

// HRContact represents a public HR contact from a company.
type HRContact struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"-"`
	UpdatedAt time.Time `json:"-"`
	CompanyID uint      `gorm:"index" json:"companyId"`
	Name      string    `gorm:"size:255" json:"name"`
	Position  string    `gorm:"size:255" json:"position,omitempty"`
	Telegram  string    `gorm:"size:100" json:"telegram,omitempty"`
	LinkedIn  string    `gorm:"size:512" json:"linkedin,omitempty"`
	Note      string    `gorm:"size:512" json:"note,omitempty"` // e.g. "рад общению со студентами"
}

// HRContent represents articles, tips, speeches by HR reps.
type HRContent struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"-"`
	UpdatedAt   time.Time `json:"-"`
	CompanyID   uint      `gorm:"index" json:"companyId"`
	AuthorName  string    `gorm:"size:255" json:"authorName"`
	AuthorPos   string    `gorm:"size:255" json:"authorPos,omitempty"`
	Type        string    `gorm:"size:20" json:"type"` // article|tip|speech|video
	Title       string    `gorm:"size:512" json:"title"`
	URL         string    `gorm:"size:512" json:"url,omitempty"`
	Description string    `gorm:"type:text" json:"description,omitempty"`
	PublishedAt *time.Time `json:"publishedAt,omitempty"`
}

// Hackathon represents a hackathon or competition event.
type Hackathon struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time  `json:"-"`
	UpdatedAt    time.Time  `json:"-"`
	Title        string     `gorm:"size:255" json:"title"`
	Description  string     `gorm:"type:text" json:"description,omitempty"`
	Organizer    string     `gorm:"size:255" json:"organizer,omitempty"`
	Location     string     `gorm:"size:255" json:"location,omitempty"` // city or "Online"
	IsOnline     bool       `json:"isOnline"`
	PrizePool    string     `gorm:"size:255" json:"prizePool,omitempty"`
	RegisterURL  string     `gorm:"size:512" json:"registerURL,omitempty"`
	WebsiteURL   string     `gorm:"size:512" json:"websiteURL,omitempty"`
	TechStack    string     `gorm:"size:512" json:"techStack,omitempty"` // comma-separated tags
	RegistrationDeadline *time.Time `json:"registrationDeadline,omitempty"`
	StartDate    *time.Time `json:"startDate,omitempty"`
	EndDate      *time.Time `json:"endDate,omitempty"`
	IsActive     bool       `gorm:"default:true" json:"isActive"`
}

// Suggestion — user-submitted request to add a company or school.
type Suggestion struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time `json:"createdAt"`
	Type         string    `gorm:"size:20" json:"type"`         // "company" | "school"
	Name         string    `gorm:"size:255" json:"name"`
	Description  string    `gorm:"type:text" json:"description"`
	Website      string    `gorm:"size:500" json:"website"`
	Telegram     string    `gorm:"size:255" json:"telegram"`
	Email        string    `gorm:"size:255" json:"email"`
	ContactName  string    `gorm:"size:255" json:"contactName"`
	ContactEmail string    `gorm:"size:255" json:"contactEmail"`
	Status       string    `gorm:"size:20;default:'pending'" json:"status"` // pending | approved | rejected
	AdminNotes   string    `gorm:"type:text" json:"adminNotes,omitempty"`
}
