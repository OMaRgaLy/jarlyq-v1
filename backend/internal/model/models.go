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
	// Role-based access: "user", "company_owner", "school_owner", "partner", "admin"
	Role      string `gorm:"size:30;default:'user'"`
	CompanyID *uint  `gorm:"index"` // set when role=company_owner
	SchoolID  *uint  `gorm:"index"` // set when role=school_owner
	// Preferred stacks for personalized recommendations
	PreferredStacks []Stack `gorm:"many2many:user_preferred_stacks"`
	Achievements    []Achievement
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
	Country       string          `gorm:"size:10;index" json:"country,omitempty"` // ISO: "KZ","TR","UZ"
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
	Opportunities []Opportunity     `json:"opportunities"`
	Offices       []CompanyOffice   `json:"offices,omitempty"`
	Photos        []CompanyPhoto    `json:"photos,omitempty"`
	Showcase      []CompanyShowcase `json:"showcase,omitempty"`
	IsVerified    bool              `json:"isVerified"`
	IsActive      bool              `gorm:"default:true;index" json:"isActive"`
	Source        string            `gorm:"size:50;default:'admin'" json:"source,omitempty"` // "admin"|"hh"|"parser"
	ExternalID    string            `gorm:"size:255;index" json:"externalID,omitempty"`      // "hh:employer:12345"
	Reviews       []CompanyReview   `json:"reviews,omitempty"`
	HRContacts    []HRContact       `json:"hrContacts,omitempty"`
	HRContent     []HRContent       `json:"hrContent,omitempty"`
	Badges        []EntityBadge     `gorm:"-" json:"badges,omitempty"` // loaded separately
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
	Type           string     `gorm:"size:20;index" json:"type"`
	Title          string     `gorm:"size:255" json:"title"`
	Description    string     `gorm:"type:text" json:"description,omitempty"`
	Requirements   string     `gorm:"type:text" json:"-"`
	ApplyURL       string     `gorm:"size:512" json:"applyURL,omitempty"`
	SourceURL      string     `gorm:"size:512" json:"-"`                        // оригинальная страница вакансии
	Level          string     `gorm:"size:50" json:"level"`
	SalaryMin      int        `json:"salaryMin,omitempty"`
	SalaryMax      int        `json:"salaryMax,omitempty"`
	SalaryCurrency string     `gorm:"size:10" json:"salaryCurrency,omitempty"`
	WorkFormat     string     `gorm:"size:20;index" json:"workFormat,omitempty"` // remote|office|hybrid
	City           string     `gorm:"size:100" json:"city,omitempty"`
	Country        string     `gorm:"size:10;index" json:"country,omitempty"`    // ISO: "KZ","TR","UZ"
	Deadline       *time.Time `json:"deadline,omitempty"`
	IsYearRound    bool       `json:"isYearRound"`
	Source         string     `gorm:"size:100;index" json:"source,omitempty"`    // "admin"|"hh"|"telegram"|"kariyer"
	ExternalID     string     `gorm:"size:255;index" json:"externalID,omitempty"` // "hh:123456"
	IsVerified     bool       `json:"isVerified"`
	IsActive       bool       `gorm:"default:true;index" json:"isActive"`
	NeedsReview    bool       `gorm:"default:false;index" json:"needsReview"` // AI не уверен — нужна ручная проверка
	// Education requirements
	// EducationLevel: "none" | "schoolkid" | "student_1_2" | "student_3_4" | "bachelor" | "any"
	EducationLevel          string `gorm:"size:30;default:'any'" json:"educationLevel,omitempty"`
	AcceptsCareerSwitchers  bool   `gorm:"default:false" json:"acceptsCareerSwitchers"`
	SuitableForSchoolkids   bool   `gorm:"default:false" json:"suitableForSchoolkids"`
	LastCheckedAt  *time.Time `json:"-"`
	ParsedAt       *time.Time `json:"-"`
	StartDate      *time.Time `json:"-"`
	EndDate        *time.Time `json:"-"`
	Stack          []Stack    `gorm:"many2many:opportunity_stacks" json:"-"`
	Regions        []Region   `gorm:"many2many:opportunity_regions" json:"-"`
}

// School represents education providers.
// Type: "bootcamp" | "center" | "state_program" | "peer_learning"   ← частные школы (дают навык → работу)
//       "university" | "university_abroad"                           ← высшее образование (дают диплом)
//       "language_school"                                            ← языковые курсы (IELTS, TOEFL, разговорный)
//       "test_prep"                                                  ← подготовка к экзаменам (ЕНТ, ОГЭ, ОРТ, SAT)
//       "admissions"                                                 ← консультанты по поступлению в вуз
type School struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time   `json:"-"`
	UpdatedAt     time.Time   `json:"-"`
	Name          string      `gorm:"size:255" json:"name"`
	Type          string      `gorm:"size:40;default:'bootcamp'" json:"type"`
	Country       string      `gorm:"size:10;index" json:"country,omitempty"` // ISO: "KZ","TR"
	City          string      `gorm:"size:100" json:"city,omitempty"`
	LogoURL       string      `gorm:"size:512" json:"logoURL,omitempty"`
	CoverURL      string      `gorm:"size:512" json:"coverURL,omitempty"`
	Description   string      `gorm:"type:text" json:"description,omitempty"`
	About         string      `gorm:"type:text" json:"about,omitempty"`
	AgeRange      string      `gorm:"size:50" json:"ageRange,omitempty"`
	Audience      string      `gorm:"size:255" json:"audience,omitempty"`
	IsStateFunded bool          `json:"isStateFunded"`
	IsVerified    bool          `json:"isVerified"`
	IsActive      bool          `gorm:"default:true;index" json:"isActive"`
	Source        string        `gorm:"size:50;default:'admin'" json:"source,omitempty"` // "admin"|"parser"
	ExternalID    string        `gorm:"size:255;index" json:"externalID,omitempty"`
	Contacts      ContactInfo   `gorm:"embedded;embeddedPrefix:contact_" json:"contacts,omitempty"`
	Courses       []Course      `json:"courses"`
	Badges        []EntityBadge `gorm:"-" json:"badges,omitempty"` // loaded separately
}

// Course describes training programs.
// Level: "bachelor"|"master"|"phd"|"course"|"bootcamp"
type Course struct {
	ID                   uint      `gorm:"primaryKey" json:"id"`
	CreatedAt            time.Time `json:"-"`
	UpdatedAt            time.Time `json:"-"`
	SchoolID             uint      `gorm:"index" json:"-"`
	Title                string    `gorm:"size:255" json:"title"`
	Description          string    `gorm:"type:text" json:"description,omitempty"`
	Program              string    `gorm:"type:text" json:"-"`
	ExternalURL          string    `gorm:"size:512" json:"externalURL,omitempty"`
	Price                int       `json:"price,omitempty"`
	PriceCurrency        string    `gorm:"size:10" json:"priceCurrency,omitempty"`
	DurationWeeks        int       `json:"durationWeeks,omitempty"`
	Format               string    `gorm:"size:20" json:"format,omitempty"` // online|offline|hybrid
	HasEmployment        bool      `json:"hasEmployment"`
	Level                string    `gorm:"size:30;index" json:"level,omitempty"`
	Language             string    `gorm:"size:10" json:"language,omitempty"` // en|ru|de|fr|kk|tr
	ScholarshipAvailable bool      `json:"scholarshipAvailable"`
	ApplicationDeadline  string    `gorm:"size:100" json:"applicationDeadline,omitempty"`
	IsActive             bool      `gorm:"default:true;index" json:"isActive"`
	ExternalID           string    `gorm:"size:255;index" json:"externalID,omitempty"`
	Stack                []Stack   `gorm:"many2many:course_stacks" json:"-"`
	Regions              []Region  `gorm:"many2many:course_regions" json:"-"`
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
	WorkFormat       string    `gorm:"size:100;index" json:"workFormat"`
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
	ID          uint      `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"-"`
	CompanyID   uint      `gorm:"index" json:"companyId"`
	UserID      uint      `gorm:"index" json:"-"`
	// Status: pending | approved | rejected
	Status      string    `gorm:"size:20;default:'pending'" json:"status"`
	IsAnonymous bool      `json:"isAnonymous"`
	// Author name shown on card (populated at query time, not stored)
	AuthorName  string    `gorm:"-" json:"authorName,omitempty"`

	Rating          float32 `json:"rating"` // 1-5
	Title           string  `gorm:"size:255" json:"title"`
	ReviewText      string  `gorm:"type:text" json:"reviewText"`
	HelpfulCount    int     `json:"helpfulCount"`

	// Sub-ratings 1-5
	WorkLifeBalance int `json:"workLifeBalance"`
	SalaryRating    int `json:"salaryRating"`
	GrowthRating    int `json:"growthRating"`
	CultureRating   int `json:"cultureRating"`

	// Employee context
	EmploymentType string `gorm:"size:50" json:"employmentType,omitempty"` // current|former
	Position       string `gorm:"size:120" json:"position,omitempty"`
	YearsWorked    int    `json:"yearsWorked,omitempty"`
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

// UserFavorite represents a bookmarked entity (company, opportunity, school).
type UserFavorite struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UserID     uint      `gorm:"uniqueIndex:udx_user_fav" json:"-"`
	EntityType string    `gorm:"size:30;uniqueIndex:udx_user_fav" json:"entityType"` // "company", "opportunity", "school"
	EntityID   uint      `gorm:"uniqueIndex:udx_user_fav" json:"entityId"`
}

// OwnerRequest represents a request from a user to become a company/school/partner owner.
type OwnerRequest struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"-"`
	UserID     uint      `gorm:"index" json:"userId"`
	EntityType string    `gorm:"size:30" json:"entityType"` // "company", "school", "partner"
	EntityID   uint      `json:"entityId"`
	Message    string    `gorm:"type:text" json:"message,omitempty"` // e.g. "Я HR в Kaspi"
	Status     string    `gorm:"size:20;default:'pending'" json:"status"` // pending|approved|rejected
	AdminNotes string    `gorm:"type:text" json:"adminNotes,omitempty"`
	// Populated at query time
	UserEmail  string `gorm:"-" json:"userEmail,omitempty"`
	UserName   string `gorm:"-" json:"userName,omitempty"`
	EntityName string `gorm:"-" json:"entityName,omitempty"`
}

// AuditLog records admin/owner actions for accountability.
type AuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UserID    uint      `gorm:"index" json:"user_id"`
	UserEmail string    `gorm:"size:255" json:"user_email"`
	Action    string    `gorm:"size:50" json:"action"`  // create, update, delete, approve, reject
	Entity    string    `gorm:"size:50" json:"entity"`  // company, school, opportunity, course, user, owner_request
	EntityID  uint      `json:"entity_id"`
	Details   string    `gorm:"type:text" json:"details,omitempty"`
	IP        string    `gorm:"size:45" json:"ip,omitempty"`
}

// ParseLog records each parser run for monitoring and debugging.
type ParseLog struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time `json:"createdAt"`
	Source        string    `gorm:"size:100;index" json:"source"`        // "hh"|"telegram"|"kariyer"
	EntityType    string    `gorm:"size:50" json:"entityType"`           // "opportunity"|"company"|"school"
	TotalFound    int       `json:"totalFound"`
	TotalNew      int       `json:"totalNew"`
	TotalUpdated  int       `json:"totalUpdated"`
	TotalArchived int       `json:"totalArchived"`
	Error         string    `gorm:"type:text" json:"error,omitempty"`
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
		&OwnerRequest{},
		&UserFavorite{},
		&AuditLog{},
		// CMS: Badges & Themes
		&EntityBadge{},
		&EntityTheme{},
		// Security: refresh token store
		&RefreshToken{},
		// Parser infrastructure
		&ParseLog{},
		// Curated resources directory
		&Resource{},
	)
}

// RefreshToken stores issued refresh tokens so they can be invalidated on use (rotation).
// On each /auth/refresh the old token is deleted and a new one is inserted.
// On logout all tokens for the user are deleted.
type RefreshToken struct {
	ID        uint      `gorm:"primaryKey" json:"-"`
	UserID    uint      `gorm:"index;not null" json:"-"`
	TokenHash string    `gorm:"size:64;uniqueIndex;not null" json:"-"` // SHA-256 hex of the raw token
	ExpiresAt time.Time `gorm:"index;not null" json:"-"`
	CreatedAt time.Time `json:"-"`
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

// Resource represents a curated external link in the /resources directory.
// Category: "courses" | "scholarships" | "test_prep" | "languages" |
//           "certifications" | "security" | "communities" | "career" | "other"
type Resource struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CreatedAt    time.Time `json:"-"`
	UpdatedAt    time.Time `json:"-"`
	Title        string    `gorm:"size:255;not null" json:"title"`
	URL          string    `gorm:"size:512;not null" json:"url"`
	Description  string    `gorm:"type:text" json:"description,omitempty"`
	Category     string    `gorm:"size:50;index;not null" json:"category"`
	Subcategory  string    `gorm:"size:100" json:"subcategory,omitempty"` // e.g. "Python", "SOC", "IELTS"
	IsFree       bool      `gorm:"default:true" json:"isFree"`
	Language     string    `gorm:"size:10;default:'ru'" json:"language"`         // ru|en|kk
	Difficulty   string    `gorm:"size:20" json:"difficulty,omitempty"`          // beginner|intermediate|advanced
	CountryFocus string    `gorm:"size:10" json:"countryFocus,omitempty"`        // KZ|KG|UZ|* (empty = global)
	IsActive     bool      `gorm:"default:true;index" json:"isActive"`
	SortOrder    int       `gorm:"default:0" json:"sortOrder"`
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

// ─── CMS: Badges & Themes ─────────────────────────────────────────────────────

// EntityBadge represents a visual label/badge displayed on a company, school, or partner profile.
// Supports dual-theme colors (light and dark mode variants).
// Predefined icon slugs: verified, top, partner, government, trending, new, hiring, scholarship
// Custom: set Icon to an emoji or short string.
type EntityBadge struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"-"`
	EntityType string    `gorm:"size:30;index:idx_badge_entity" json:"entityType"` // "company" | "school" | "partner"
	EntityID   uint      `gorm:"index:idx_badge_entity" json:"entityId"`
	Icon       string    `gorm:"size:50" json:"icon"`         // predefined slug OR emoji
	Label      string    `gorm:"size:80" json:"label"`        // displayed text, e.g. "Топ работодатель"
	ColorLight string    `gorm:"size:20" json:"colorLight"`   // hex for light mode, e.g. "#2563eb"
	ColorDark  string    `gorm:"size:20" json:"colorDark"`    // hex for dark mode, e.g. "#3b82f6"
	SortOrder  int       `gorm:"default:0" json:"sortOrder"`
}

// EntityTheme stores custom accent colors and visual style for a profile page.
// One record per entity (enforced by unique index).
type EntityTheme struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UpdatedAt     time.Time `json:"updatedAt"`
	EntityType    string    `gorm:"size:30;uniqueIndex:idx_entity_theme" json:"entityType"` // "company" | "school"
	EntityID      uint      `gorm:"uniqueIndex:idx_entity_theme" json:"entityId"`
	AccentLight   string    `gorm:"size:20" json:"accentLight"`   // hex, e.g. "#2563eb"
	AccentDark    string    `gorm:"size:20" json:"accentDark"`    // hex for dark mode
	CoverGradient string    `gorm:"size:20;default:'none'" json:"coverGradient"` // "none" | "top" | "overlay" | "blur"
}
