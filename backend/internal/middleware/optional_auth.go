package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
)

// OptionalJWT identifies the caller when a valid access token is present, but
// never rejects the request. Public endpoints use it to tailor the response
// (for example, hide Premium-only early-access postings from free visitors).
// A bad or expired token is treated exactly like no token.
func OptionalJWT(jwtManager auth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenStr string
		if header := c.GetHeader("Authorization"); header != "" {
			parts := strings.SplitN(header, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenStr = parts[1]
			}
		}
		if tokenStr == "" {
			if cookie, err := c.Cookie("access_token"); err == nil {
				tokenStr = cookie
			}
		}
		if tokenStr != "" {
			if claims, err := jwtManager.ParseToken(tokenStr); err == nil {
				c.Set("user_id", claims.UserID)
				c.Set("user_email", claims.Email)
				c.Set("user_role", claims.Role)
			}
		}
		c.Next()
	}
}
