package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireRole checks that the authenticated user has one of the allowed roles.
// Must be used after JWTAuth so user_role is set in context.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(c *gin.Context) {
		role, _ := c.Get("user_role")
		roleStr, _ := role.(string)
		if roleStr == "" {
			roleStr = "user"
		}
		// Admin always has access
		if roleStr == "admin" {
			c.Next()
			return
		}
		if !allowed[roleStr] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
			return
		}
		c.Next()
	}
}
