package service

import (
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/config"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
	"github.com/OMaRgaLy/jarlyq-v1/backend/pkg/logger"
	"github.com/OMaRgaLy/jarlyq-v1/backend/pkg/mailer"
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
	ProjectIdea    ProjectIdeaService
	Suggestion     SuggestionService
	DB             *gorm.DB
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

	// Initialize job search platform repositories
	var jobRepo repository.JobRepository
	var companyProfileRepo repository.CompanyProfileRepository

	var projectIdeaRepo repository.ProjectIdeaRepository

	if repos.DB != nil {
		jobRepo = repository.NewJobRepository(repos.DB)
		companyProfileRepo = repository.NewCompanyProfileRepository(repos.DB)
		projectIdeaRepo = repository.NewProjectIdeaRepository(repos.DB)
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
		ProjectIdea:    NewProjectIdeaService(projectIdeaRepo),
		Suggestion:     NewSuggestionService(repository.NewSuggestionRepository(repos.DB)),
		DB:             repos.DB,
	}
}

// UserProgressService interface for user progress operations.
type UserProgressService interface {
	GetCurrentPath(userID uint) (*model.UserProgress, error)
	StartPath(userID, pathID uint) (*model.UserProgress, error)
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
