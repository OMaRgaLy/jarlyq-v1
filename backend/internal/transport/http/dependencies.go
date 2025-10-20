package http

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/example/jarlyq/internal/auth"
	"github.com/example/jarlyq/internal/config"
	"github.com/example/jarlyq/internal/repository"
	"github.com/example/jarlyq/internal/service"
	"github.com/example/jarlyq/pkg/logger"
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
func RegisterRoutes(router gin.IRouter, handler *Handler, jwt auth.Manager) {
	v1 := router.Group("/v1")
	newAuthRoutes(v1.Group("/auth"), handler, jwt)
	newUserRoutes(v1.Group("/users"), handler, jwt)
	newCompanyRoutes(v1.Group("/companies"), handler)
	newSchoolRoutes(v1.Group("/schools"), handler)
	newStackRoutes(v1.Group("/stacks"), handler)
	newCertificateRoutes(v1.Group("/certificates"), handler)
}
