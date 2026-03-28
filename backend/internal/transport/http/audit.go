package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// WriteAuditLog is a helper used by admin/dashboard handlers to record an action.
func (h *Handler) WriteAuditLog(c *gin.Context, action, entity string, entityID uint, details string) {
	email, _ := c.Get("user_email")
	emailStr, _ := email.(string)
	uid := c.GetUint("user_id")
	log := model.AuditLog{
		UserID:    uid,
		UserEmail: emailStr,
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		Details:   details,
		IP:        c.ClientIP(),
	}
	h.Services.DB.Create(&log)
}

// GET /admin/audit-log?page=1&entity=company&action=create
func (h *Handler) adminListAuditLog(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	perPage := 50
	offset := (page - 1) * perPage

	q := h.Services.DB.Model(&model.AuditLog{})
	if entity := c.Query("entity"); entity != "" {
		q = q.Where("entity = ?", entity)
	}
	if action := c.Query("action"); action != "" {
		q = q.Where("action = ?", action)
	}

	var total int64
	q.Count(&total)

	var logs []model.AuditLog
	q.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&logs)

	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"total": total,
		"page":  page,
	})
}
