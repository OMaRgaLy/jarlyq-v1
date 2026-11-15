package http

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// POST /users/me/premium-interest — "I want Premium". Payments are handled manually
// for now, so this records the demand and lets the admin find who to contact.
func (h *Handler) savePremiumInterest(c *gin.Context) {
	userID := c.GetUint("user_id")
	now := time.Now()
	res := h.Services.DB.Model(&model.User{}).Where("id = ?", userID).Update("premium_interest_at", now)
	if res.Error != nil || res.RowsAffected == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

type setPremiumRequest struct {
	// Days of Premium counted from now (or from the current expiry if still active).
	// 0 revokes Premium immediately.
	Days int `json:"days"`
}

// PUT /admin/users/:id/premium — grant, extend or revoke Premium.
// There is no online payment yet: the admin switches Premium on after the user
// pays through the manager (Telegram / WhatsApp), exactly as the pricing page says.
func (h *Handler) adminSetUserPremium(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req setPremiumRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Days < 0 || req.Days > 3650 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "days must be between 0 and 3650"})
		return
	}

	var user model.User
	if err := h.Services.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var until *time.Time
	if req.Days > 0 {
		base := time.Now()
		if user.PremiumUntil != nil && user.PremiumUntil.After(base) {
			base = *user.PremiumUntil // extend, don't overwrite remaining days
		}
		t := base.Add(time.Duration(req.Days) * 24 * time.Hour)
		until = &t
	}
	if err := h.Services.DB.Model(&user).Update("premium_until", until).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"premium_until": until})
}
