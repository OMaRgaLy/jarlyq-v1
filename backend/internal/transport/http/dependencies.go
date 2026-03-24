package http

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/config"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/service"
	"github.com/OMaRgaLy/jarlyq-v1/backend/pkg/logger"
)

// Handler holds HTTP handlers.
type Handler struct {
	Services *service.Services
	Config   *config.Config
	Logger   logger.Logger
}

// NewRepositories builds repository set.
func NewRepositories(db *gorm.DB) *service.Repositories {
	return &service.Repositories{
		Users:        repository.NewUserRepository(db),
		Companies:    repository.NewCompanyRepository(db),
		Schools:      repository.NewSchoolRepository(db),
		Courses:      repository.NewCourseRepository(db),
		Stacks:       repository.NewStackRepository(db),
		Certificates: repository.NewCertificateRepository(db),
		Passwords:    repository.NewPasswordTokenRepository(db),
		CareerPaths:  repository.NewCareerPathRepository(db),
		Questions:    repository.NewInterviewQuestionRepository(db),
		Progress:     repository.NewUserProgressRepository(db),
		DB:           db,
	}
}

// NewServices returns services container.
func NewServices(repos *service.Repositories, cfg *config.Config, log logger.Logger) *service.Services {
	return service.NewServices(repos, cfg, log)
}

// NewHandler constructs handler.
func NewHandler(services *service.Services, cfg *config.Config, log logger.Logger) *Handler {
	return &Handler{Services: services, Config: cfg, Logger: log}
}

// RegisterRoutes sets up endpoints.
func RegisterRoutes(router gin.IRouter, handler *Handler, jwt auth.Manager, authRateLimiter gin.HandlerFunc) {
	v1 := router.Group("/v1")
	newAuthRoutes(v1.Group("/auth"), handler, jwt, authRateLimiter)
	newUserRoutes(v1.Group("/users"), handler, jwt)
	newCompanyRoutes(v1.Group("/companies"), handler)
	newSchoolRoutes(v1.Group("/schools"), handler)
	newStackRoutes(v1.Group("/stacks"), handler)
	newCertificateRoutes(v1.Group("/certificates"), handler)
	newCareerPathRoutes(v1.Group("/career-paths"), handler)
	newInterviewRoutes(v1.Group("/interview-questions"), handler)
	newJobRoutes(v1.Group("/jobs"), handler)
	newCompanyProfileRoutes(v1.Group("/companies-profile"), handler)
	newProjectIdeaRoutes(v1.Group("/project-ideas"), handler)
	newSuggestionRoutes(v1.Group("/suggestions"), handler)
	newAdminRoutes(v1.Group("/admin"), handler, jwt)
}
