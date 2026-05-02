package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
)

// JWTAuth validates JWT access tokens.
// Token source priority: Authorization header → access_token cookie.
// The header path is kept for admin panel and API clients; cookies serve browser users.
func JWTAuth(jwtManager auth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenStr string

		// 1. Authorization: Bearer <token> (admin panel, API clients)
		if header := c.GetHeader("Authorization"); header != "" {
			parts := strings.SplitN(header, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenStr = parts[1]
			}
		}

		// 2. Fallback: httpOnly cookie (browser users)
		if tokenStr == "" {
			if cookie, err := c.Cookie("access_token"); err == nil {
				tokenStr = cookie
			}
		}

		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization"})
			return
		}

		claims, err := jwtManager.ParseToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}
