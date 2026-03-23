package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// AdminOnly allows only the configured admin email.
// Must be used after JWTAuth so user_email is set in context.
func AdminOnly() gin.HandlerFunc {
	adminEmail := os.Getenv("ADMIN_EMAIL")
	return func(c *gin.Context) {
		if adminEmail == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin not configured"})
			return
		}
		email, exists := c.Get("user_email")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		if email.(string) != adminEmail {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}
