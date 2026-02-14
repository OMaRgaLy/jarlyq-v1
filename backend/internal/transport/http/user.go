package http

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/example/jarlyq/internal/auth"
	"github.com/example/jarlyq/internal/middleware"
	"github.com/example/jarlyq/internal/model"
	"github.com/example/jarlyq/internal/service"
)

func newUserRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	group.Use(middleware.JWTAuth(jwt))
	group.GET("/me", handler.getProfile)
	group.PUT("/me", handler.updateProfile)
}

type updateProfileRequest struct {
	FirstName string     `json:"first_name"`
	LastName  string     `json:"last_name"`
	BirthDate *time.Time `json:"birth_date"`
	Phone     string     `json:"phone"`
	Telegram  string     `json:"telegram"`
	Bio       string     `json:"bio"`
	Theme     string     `json:"theme"`
	Privacy   struct {
		PhonePrivate    bool `json:"phone_private"`
		TelegramPrivate bool `json:"telegram_private"`
		EmailPrivate    bool `json:"email_private"`
	} `json:"privacy"`
}

func (h *Handler) getProfile(c *gin.Context) {
	id := c.GetUint("user_id")
	user, err := h.Services.User.GetProfile(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": mapUser(user)})
}

func (h *Handler) updateProfile(c *gin.Context) {
	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	id := c.GetUint("user_id")
	privacy := model.PrivacySettings{
		PhonePrivate:    req.Privacy.PhonePrivate,
		TelegramPrivate: req.Privacy.TelegramPrivate,
		EmailPrivate:    req.Privacy.EmailPrivate,
	}
	user, err := h.Services.User.UpdateProfile(c.Request.Context(), id, service.UpdateProfileInput{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		BirthDate: req.BirthDate,
		Phone:     req.Phone,
		Telegram:  req.Telegram,
		Bio:       req.Bio,
		Theme:     req.Theme,
		Privacy:   privacy,
	})
	if err != nil {
		h.Logger.Warnf("update profile failed for user %d: %v", id, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to update profile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": mapUser(user)})
}
