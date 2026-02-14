package server

import (
	"context"
	"fmt"
	gohttp "net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	limiter "github.com/ulule/limiter/v3"
	ginlimiter "github.com/ulule/limiter/v3/drivers/middleware/gin"
	memory "github.com/ulule/limiter/v3/drivers/store/memory"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/example/jarlyq/internal/auth"
	"github.com/example/jarlyq/internal/config"
	"github.com/example/jarlyq/internal/middleware"
	"github.com/example/jarlyq/internal/model"
	httptransport "github.com/example/jarlyq/internal/transport/http"
	"github.com/example/jarlyq/pkg/logger"
)

// Server wraps HTTP server dependencies.
type Server struct {
	engine *gin.Engine
	cfg    *config.Config
	db     *gorm.DB
	log    logger.Logger
}

// New creates the API server.
func New(cfg *config.Config) (*Server, error) {
	log := logger.New(cfg.AppEnv)

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("connect db: %w", err)
	}

	if err := model.AutoMigrate(db); err != nil {
		return nil, fmt.Errorf("auto migrate: %w", err)
	}

	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()
	engine.Use(gin.Recovery(), middleware.RequestLogger(log))

	corsCfg := cors.DefaultConfig()
	if len(cfg.CORSOrigins) > 0 {
		corsCfg.AllowOrigins = cfg.CORSOrigins
		corsCfg.AllowCredentials = true
	} else if cfg.AppEnv == "production" {
		return nil, fmt.Errorf("CORS_ORIGINS must be set in production")
	} else {
		corsCfg.AllowAllOrigins = true
	}
	corsCfg.AllowHeaders = []string{"Authorization", "Content-Type", "X-CSRF-Token"}
	engine.Use(cors.New(corsCfg))

	// Global rate limiter
	globalRate := limiter.Rate{Period: time.Minute, Limit: int64(cfg.RateLimitPerMin)}
	store := memory.NewStore()
	engine.Use(ginlimiter.NewMiddleware(limiter.New(store, globalRate)))

	// Stricter rate limiter for auth endpoints (5 requests per minute)
	authRate := limiter.Rate{Period: time.Minute, Limit: 5}
	authStore := memory.NewStore()
	authLimiter := ginlimiter.NewMiddleware(limiter.New(authStore, authRate))

	csrfMiddleware := middleware.NewCSRFMiddleware(cfg)

	repoSet := httptransport.NewRepositories(db)
	services := httptransport.NewServices(repoSet, cfg, log)
	handler := httptransport.NewHandler(services, cfg, log)

	api := engine.Group("/api")
	httptransport.RegisterRoutes(api, handler, auth.NewJWTManager(cfg), authLimiter)

	engine.Use(csrfMiddleware)

	if cfg.SwaggerEnabled {
		engine.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	return &Server{engine: engine, cfg: cfg, db: db, log: log}, nil
}

// Run starts HTTP server.
func (s *Server) Run() error {
	srv := &gohttp.Server{
		Addr:              ":" + s.cfg.HTTPPort,
		Handler:           s.engine,
		ReadTimeout:       15 * time.Second,
		ReadHeaderTimeout: 15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	s.log.Infof("HTTP server listening on %s", s.cfg.HTTPPort)

	return srv.ListenAndServe()
}

// Shutdown gracefully closes resources.
func (s *Server) Shutdown(ctx context.Context) error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
