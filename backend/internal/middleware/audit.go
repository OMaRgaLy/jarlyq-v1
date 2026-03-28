package middleware

import (
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

var entityIDPattern = regexp.MustCompile(`/(\d+)`)

// AuditLog is a Gin middleware that automatically records admin/dashboard mutations.
// It runs AFTER the handler and only logs successful write operations (2xx status).
func AuditLog(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only log mutating methods
		method := c.Request.Method
		if method == http.MethodGet || method == http.MethodOptions || method == http.MethodHead {
			c.Next()
			return
		}

		c.Next()

		// Only log successful responses
		status := c.Writer.Status()
		if status < 200 || status >= 300 {
			return
		}

		action := methodToAction(method)
		path := c.FullPath()
		entity, entityID := extractEntity(path, c)

		// Refine action for approve/reject
		if strings.HasSuffix(path, "/approve") {
			action = "approve"
		} else if strings.HasSuffix(path, "/reject") {
			action = "reject"
		}

		if entity == "" {
			return
		}

		email, _ := c.Get("user_email")
		emailStr, _ := email.(string)

		log := model.AuditLog{
			UserID:    c.GetUint("user_id"),
			UserEmail: emailStr,
			Action:    action,
			Entity:    entity,
			EntityID:  entityID,
			Details:   fmt.Sprintf("%s %s", method, c.Request.URL.Path),
			IP:        c.ClientIP(),
		}
		db.Create(&log)
	}
}

func methodToAction(m string) string {
	switch m {
	case http.MethodPost:
		return "create"
	case http.MethodPut, http.MethodPatch:
		return "update"
	case http.MethodDelete:
		return "delete"
	default:
		return m
	}
}

func extractEntity(path string, c *gin.Context) (string, uint) {
	// path examples: /v1/admin/companies/:id, /v1/dashboard/company/opportunities/:id
	parts := strings.Split(strings.TrimPrefix(path, "/v1/admin/"), "/")
	if strings.Contains(path, "/dashboard/") {
		parts = strings.Split(strings.TrimPrefix(path, "/v1/dashboard/"), "/")
	}

	entity := ""
	if len(parts) > 0 {
		entity = strings.TrimSuffix(parts[0], "s") // companies -> company
		if entity == "companie" {
			entity = "company"
		}
	}

	// If nested: /companies/:id/opportunities/:id -> entity = opportunity
	if len(parts) >= 3 {
		nested := strings.TrimSuffix(parts[2], "s")
		if nested == "companie" {
			nested = "company"
		}
		if nested != "approve" && nested != "reject" {
			entity = nested
		}
	}

	// Extract entity ID from URL params
	var eid uint
	for _, param := range []string{"id", "eid", "sid"} {
		if v := c.Param(param); v != "" {
			if n, err := strconv.ParseUint(v, 10, 64); err == nil {
				eid = uint(n)
				break
			}
		}
	}

	return entity, eid
}
