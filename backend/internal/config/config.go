package config

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds application configuration values.
type Config struct {
	AppEnv             string
	HTTPPort           string
	DatabaseURL        string
	AppBaseURL         string
	JWTAccessSecret    string
	JWTRefreshSecret   string
	SMTPHost           string
	SMTPPort           int
	SMTPUser           string
	SMTPPassword       string
	SMTPFrom           string
	GoogleClientID     string
	GoogleClientSecret string
	RateLimitPerMin    int
	CORSOrigins        []string
	CSRFCookieName     string
	CSRFCookieDomain   string
	SwaggerEnabled     bool
	AdminEmail          string
	TelegramBotToken    string
	TelegramWebhookSecret string // optional header check
}

// Load reads environment variables from .env (if present) and returns config.
func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		AppEnv:             getString("APP_ENV", "development"),
		HTTPPort:           getString("HTTP_PORT", "8080"),
		DatabaseURL:        mustString("DATABASE_URL"),
		AppBaseURL:         getString("APP_BASE_URL", "http://localhost:3000"),
		JWTAccessSecret:    mustString("JWT_ACCESS_SECRET"),
		JWTRefreshSecret:   mustString("JWT_REFRESH_SECRET"),
		SMTPHost:           getString("SMTP_HOST", ""),
		SMTPPort:           getInt("SMTP_PORT", 587),
		SMTPUser:           getString("SMTP_USER", ""),
		SMTPPassword:       getString("SMTP_PASSWORD", ""),
		SMTPFrom:           getString("SMTP_FROM", ""),
		GoogleClientID:     getString("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getString("GOOGLE_CLIENT_SECRET", ""),
		RateLimitPerMin:    getInt("RATE_LIMIT_PER_MIN", 120),
		CORSOrigins:        getStringSlice("CORS_ORIGINS", ","),
		CSRFCookieName:     getString("CSRF_COOKIE_NAME", "csrf_token"),
		CSRFCookieDomain:   getString("CSRF_COOKIE_DOMAIN", ""),
		SwaggerEnabled:     getBool("SWAGGER_ENABLED", getString("APP_ENV", "development") != "production"),
		AdminEmail:            getString("ADMIN_EMAIL", ""),
		TelegramBotToken:      getString("TELEGRAM_BOT_TOKEN", ""),
		TelegramWebhookSecret: getString("TELEGRAM_WEBHOOK_SECRET", ""),
	}

	return cfg, nil
}

func mustString(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("missing required env: %s", key)
	}
	return value
}

func getString(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		switch strings.ToLower(value) {
		case "true", "1", "yes":
			return true
		case "false", "0", "no":
			return false
		default:
			log.Fatalf("invalid boolean value for %s", key)
		}
	}
	return fallback
}

func getInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		var parsed int
		_, err := fmt.Sscanf(value, "%d", &parsed)
		if err != nil {
			log.Fatalf("invalid integer value for %s", key)
		}
		return parsed
	}
	return fallback
}

func getStringSlice(key, sep string) []string {
	value := os.Getenv(key)
	if value == "" {
		return nil
	}
	raw := strings.Split(value, sep)
	result := make([]string, 0, len(raw))
	for _, part := range raw {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// DurationFromEnv returns time.Duration from integer seconds.
func DurationFromEnv(key string, fallback time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		var seconds int
		_, err := fmt.Sscanf(value, "%d", &seconds)
		if err != nil {
			log.Fatalf("invalid duration for %s", key)
		}
		return time.Duration(seconds) * time.Second
	}
	return fallback
}
