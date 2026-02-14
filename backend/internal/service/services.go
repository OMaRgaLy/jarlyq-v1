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
	User        UserService
	Companies   CompanyService
	Education   EducationService
	Stacks      StackService
	Certificate CertificateService
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

	return &Services{
		User:        userSvc,
		Companies:   NewCompanyService(repos.Companies),
		Education:   NewEducationService(repos.Schools),
		Stacks:      NewStackService(repos.Stacks),
		Certificate: NewCertificateService(repos.Certificates),
	}
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
	DB           *gorm.DB
}
