package http

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

var validLevels = map[string]bool{"schoolkid": true, "student": true, "switcher": true, "junior": true}

type onboardingRequest struct {
	Level    string `json:"level"`
	Country  string `json:"country"`
	City     string `json:"city"`
	StackIDs []uint `json:"stack_ids"`
}

// PUT /users/me/onboarding — answers from the first-run wizard.
// Stores level / country / city and the stacks the user wants to follow, which
// then personalize the feed and drive Telegram alerts about new postings.
func (h *Handler) saveOnboarding(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req onboardingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	if req.Level != "" && !validLevels[req.Level] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid level"})
		return
	}
	req.Country = strings.ToUpper(strings.TrimSpace(req.Country))
	if req.Country != "" && len(req.Country) != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "country must be a 2-letter ISO code"})
		return
	}
	req.City = strings.TrimSpace(req.City)
	if len([]rune(req.City)) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "city too long"})
		return
	}
	if len(req.StackIDs) > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "max 10 stacks"})
		return
	}

	var user model.User
	if err := h.Services.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"level":        req.Level,
		"country":      req.Country,
		"city":         req.City,
		"onboarded_at": now,
	}
	if err := h.Services.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save"})
		return
	}

	var stacks []model.Stack
	if len(req.StackIDs) > 0 {
		h.Services.DB.Where("id IN ?", req.StackIDs).Find(&stacks)
	}
	if err := h.Services.DB.Model(&user).Association("PreferredStacks").Replace(stacks); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save stacks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
