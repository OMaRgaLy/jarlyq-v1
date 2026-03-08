package service

import (
	"github.com/example/jarlyq/internal/auth"
	"github.com/example/jarlyq/internal/config"
	"github.com/example/jarlyq/internal/repository"
	"github.com/example/jarlyq/pkg/logger"
	"github.com/example/jarlyq/pkg/mailer"
	"gorm.io/gorm"
)

// Services bundles all services.
type Services struct {
	User           UserService
	Companies      CompanyService
	Education      EducationService
	Stacks         StackService
	Certificate    CertificateService
	CareerPath     CareerPathService
	Interview      InterviewService
	UserProgress   UserProgressService
	Job            JobService
	CompanyProfile CompanyProfileService
}

// NewServices wires dependencies.
func NewServices(repos *Repositories, cfg *config.Config, log logger.Logger) *Services {
	mail := mailer.NewSMTPMailer(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPFrom)
	jwt := auth.NewJWTManager(cfg)
	verifier := NewGoogleVerifier(cfg.GoogleClientID)
	var passwordTokens PasswordTokenRepository
	if repos.Passwords != nil {
		passwordTokens = repos.Passwords
	} else if repos.DB != nil {
		passwordTokens = repository.NewPasswordTokenRepository(repos.DB)
	}

	userSvc := NewUserService(repos.Users, jwt, mail, verifier, passwordTokens, cfg, log)

	// Initialize new repositories if not provided
	var careerPathRepo repository.CareerPathRepository
	var questionRepo repository.InterviewQuestionRepository
	var progressRepo repository.UserProgressRepository

	if repos.CareerPaths != nil {
		careerPathRepo = repos.CareerPaths
	} else if repos.DB != nil {
		careerPathRepo = repository.NewCareerPathRepository(repos.DB)
	}

	if repos.Questions != nil {
		questionRepo = repos.Questions
	} else if repos.DB != nil {
		questionRepo = repository.NewInterviewQuestionRepository(repos.DB)
	}

	if repos.Progress != nil {
		progressRepo = repos.Progress
	} else if repos.DB != nil {
		progressRepo = repository.NewUserProgressRepository(repos.DB)
	}

	// Initialize job search platform repositories
	var jobRepo repository.JobRepository
	var companyProfileRepo repository.CompanyProfileRepository
	var jobInterviewRepo repository.JobInterviewRepository
	var jobReviewRepo repository.JobReviewRepository

	if repos.DB != nil {
		jobRepo = repository.NewJobRepository(repos.DB)
		companyProfileRepo = repository.NewCompanyProfileRepository(repos.DB)
		jobInterviewRepo = repository.NewJobInterviewRepository(repos.DB)
		jobReviewRepo = repository.NewJobReviewRepository(repos.DB)
	}

	return &Services{
		User:           userSvc,
		Companies:      NewCompanyService(repos.Companies),
		Education:      NewEducationService(repos.Schools),
		Stacks:         NewStackService(repos.Stacks),
		Certificate:    NewCertificateService(repos.Certificates),
		CareerPath:     NewCareerPathService(careerPathRepo),
		Interview:      NewInterviewService(questionRepo),
		Job:            NewJobService(jobRepo),
		CompanyProfile: NewCompanyProfileService(companyProfileRepo),
	}
}

// UserProgressService interface for user progress operations.
type UserProgressService interface {
	GetCurrentPath(userID uint) (*repository.UserProgress, error)
	StartPath(userID, pathID uint) (*repository.UserProgress, error)
	UpdateProgress(userID, pathID uint, stage, progress int) error
	CompletePath(userID, pathID uint) error
	TrackQuestion(userID, questionID uint, status string) error
}

// Repositories aggregates repository layer.
type Repositories struct {
	Users        repository.UserRepository
	Companies    repository.CompanyRepository
	Schools      repository.SchoolRepository
	Courses      repository.CourseRepository
	Stacks       repository.StackRepository
	Certificates repository.CertificateRepository
	Passwords    PasswordTokenRepository
	CareerPaths  repository.CareerPathRepository
	Questions    repository.InterviewQuestionRepository
	Progress     repository.UserProgressRepository
	// Job search platform
	Jobs           repository.JobRepository
	CompanyProfile repository.CompanyProfileRepository
	JobInterview   repository.JobInterviewRepository
	JobReview      repository.JobReviewRepository
	DB           *gorm.DB
}
