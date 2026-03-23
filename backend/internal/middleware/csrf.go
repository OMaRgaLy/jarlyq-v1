package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/config"
)

// NewCSRFMiddleware adds a simple double submit cookie mechanism.
var csrfSafePaths = map[string]struct{}{
	"/api/v1/auth/register":        {},
	"/api/v1/auth/login":           {},
	"/api/v1/auth/google":          {},
	"/api/v1/auth/password/forgot": {},
	"/api/v1/auth/password/reset":  {},
}

func NewCSRFMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			ensureCSRFCookie(c, cfg)
			c.Next()
			return
		}

		if _, ok := csrfSafePaths[c.FullPath()]; ok {
			c.Next()
			return
		}

		csrfCookie, err := c.Cookie(cfg.CSRFCookieName)
		if err != nil || csrfCookie == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "missing csrf token"})
			return
		}

		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" || headerToken != csrfCookie {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid csrf token"})
			return
		}

		c.Next()
	}
}

func ensureCSRFCookie(c *gin.Context, cfg *config.Config) {
	if _, err := c.Cookie(cfg.CSRFCookieName); err == nil {
		return
	}

	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "server error"})
		return
	}
	encoded := base64.RawURLEncoding.EncodeToString(token)

	secure := cfg.AppEnv == "production"
	sameSite := http.SameSiteLaxMode
	if secure {
		sameSite = http.SameSiteStrictMode
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     cfg.CSRFCookieName,
		Value:    encoded,
		Path:     "/",
		HttpOnly: false,
		Secure:   secure,
		SameSite: sameSite,
		Domain:   cfg.CSRFCookieDomain,
	})
}
