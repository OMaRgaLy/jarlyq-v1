package http

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/middleware"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/service"
)

func newUserRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	group.Use(middleware.JWTAuth(jwt))
	group.GET("/me", handler.getProfile)
	group.PUT("/me", handler.updateProfile)
	group.PUT("/me/privacy", handler.updatePrivacy)

	// Extended profile
	group.PUT("/me/ext-profile", handler.updateExtProfile)

	// Experiences
	group.POST("/me/experiences", handler.addExperience)
	group.DELETE("/me/experiences/:eid", handler.deleteExperience)

	// Skills
	group.POST("/me/skills", handler.addSkill)
	group.DELETE("/me/skills/:sid", handler.deleteSkill)
}

// ─── GET /users/me ────────────────────────────────────────────────────────────

type fullProfileResponse struct {
	ID        uint   `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone,omitempty"`
	Telegram  string `json:"telegram,omitempty"`
	Bio       string `json:"bio,omitempty"`
	Theme     string `json:"theme,omitempty"`
	CreatedAt string `json:"created_at"`
	Privacy   struct {
		ProfilePublic   bool `json:"profile_public"`
		PhonePrivate    bool `json:"phone_private"`
		TelegramPrivate bool `json:"telegram_private"`
		EmailPrivate    bool `json:"email_private"`
	} `json:"privacy"`
	ExtProfile  *model.UserExtProfile `json:"ext_profile,omitempty"`
	Experiences []model.UserExperience `json:"experiences"`
	Skills      []model.UserSkill      `json:"skills"`
}

func (h *Handler) getProfile(c *gin.Context) {
	id := c.GetUint("user_id")

	var user model.User
	if err := h.Services.DB.Preload("Profile").
		Preload("Experiences").
		Preload("Skills").
		Preload("Skills.Stack").
		First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	resp := fullProfileResponse{
		ID:          user.ID,
		Email:       user.Email,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		Phone:       user.Phone,
		Telegram:    user.Telegram,
		Bio:         user.Bio,
		Theme:       user.Theme,
		CreatedAt:   user.CreatedAt.Format(time.RFC3339),
		ExtProfile:  user.Profile,
		Experiences: user.Experiences,
		Skills:      user.Skills,
	}
	resp.Privacy.ProfilePublic = user.Privacy.ProfilePublic
	resp.Privacy.PhonePrivate = user.Privacy.PhonePrivate
	resp.Privacy.TelegramPrivate = user.Privacy.TelegramPrivate
	resp.Privacy.EmailPrivate = user.Privacy.EmailPrivate

	if resp.Experiences == nil {
		resp.Experiences = []model.UserExperience{}
	}
	if resp.Skills == nil {
		resp.Skills = []model.UserSkill{}
	}

	c.JSON(http.StatusOK, gin.H{"user": resp})
}

// ─── PUT /users/me ────────────────────────────────────────────────────────────

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

	// Preserve existing ProfilePublic value
	var existing model.User
	h.Services.DB.Select("privacy_profile_public").First(&existing, id)
	privacy.ProfilePublic = existing.Privacy.ProfilePublic

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
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to update profile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": mapUser(user)})
}

// ─── PUT /users/me/privacy ────────────────────────────────────────────────────

func (h *Handler) updatePrivacy(c *gin.Context) {
	id := c.GetUint("user_id")
	var req struct {
		ProfilePublic   *bool `json:"profile_public"`
		PhonePrivate    *bool `json:"phone_private"`
		TelegramPrivate *bool `json:"telegram_private"`
		EmailPrivate    *bool `json:"email_private"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var user model.User
	if err := h.Services.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	if req.ProfilePublic != nil {
		user.Privacy.ProfilePublic = *req.ProfilePublic
	}
	if req.PhonePrivate != nil {
		user.Privacy.PhonePrivate = *req.PhonePrivate
	}
	if req.TelegramPrivate != nil {
		user.Privacy.TelegramPrivate = *req.TelegramPrivate
	}
	if req.EmailPrivate != nil {
		user.Privacy.EmailPrivate = *req.EmailPrivate
	}
	h.Services.DB.Save(&user)
	c.JSON(http.StatusOK, gin.H{
		"profile_public":   user.Privacy.ProfilePublic,
		"phone_private":    user.Privacy.PhonePrivate,
		"telegram_private": user.Privacy.TelegramPrivate,
		"email_private":    user.Privacy.EmailPrivate,
	})
}

// ─── PUT /users/me/ext-profile ────────────────────────────────────────────────

func (h *Handler) updateExtProfile(c *gin.Context) {
	id := c.GetUint("user_id")
	var req struct {
		City        string `json:"city"`
		GithubURL   string `json:"github_url"`
		LinkedinURL string `json:"linkedin_url"`
		InstagramURL string `json:"instagram_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	var ep model.UserExtProfile
	result := h.Services.DB.Where("user_id = ?", id).First(&ep)
	if result.Error != nil {
		// create
		ep = model.UserExtProfile{
			UserID:       id,
			City:         req.City,
			GithubURL:    req.GithubURL,
			LinkedinURL:  req.LinkedinURL,
			InstagramURL: req.InstagramURL,
		}
		h.Services.DB.Create(&ep)
	} else {
		ep.City = req.City
		ep.GithubURL = req.GithubURL
		ep.LinkedinURL = req.LinkedinURL
		ep.InstagramURL = req.InstagramURL
		h.Services.DB.Save(&ep)
	}
	c.JSON(http.StatusOK, gin.H{"ext_profile": ep})
}

// ─── EXPERIENCES ──────────────────────────────────────────────────────────────

func (h *Handler) addExperience(c *gin.Context) {
	id := c.GetUint("user_id")
	var req struct {
		CompanyName string     `json:"company_name" binding:"required"`
		Position    string     `json:"position" binding:"required"`
		StartDate   time.Time  `json:"start_date" binding:"required"`
		EndDate     *time.Time `json:"end_date"`
		IsCurrent   bool       `json:"is_current"`
		Description string     `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	exp := model.UserExperience{
		UserID:      id,
		CompanyName: req.CompanyName,
		Position:    req.Position,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		IsCurrent:   req.IsCurrent,
		Description: req.Description,
	}
	h.Services.DB.Create(&exp)
	c.JSON(http.StatusCreated, gin.H{"experience": exp})
}

func (h *Handler) deleteExperience(c *gin.Context) {
	id := c.GetUint("user_id")
	eid, err := parseID(c, "eid")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.Services.DB.Where("id = ? AND user_id = ?", eid, id).Delete(&model.UserExperience{})
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ─── SKILLS ───────────────────────────────────────────────────────────────────

func (h *Handler) addSkill(c *gin.Context) {
	id := c.GetUint("user_id")
	var req struct {
		StackID uint   `json:"stack_id" binding:"required"`
		Level   string `json:"level" binding:"required"` // beginner|intermediate|expert
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// No duplicates
	var existing model.UserSkill
	if h.Services.DB.Where("user_id = ? AND stack_id = ?", id, req.StackID).First(&existing).Error == nil {
		existing.Level = req.Level
		h.Services.DB.Save(&existing)
		h.Services.DB.Preload("Stack").First(&existing, existing.ID)
		c.JSON(http.StatusOK, gin.H{"skill": existing})
		return
	}

	skill := model.UserSkill{UserID: id, StackID: req.StackID, Level: req.Level}
	h.Services.DB.Create(&skill)
	h.Services.DB.Preload("Stack").First(&skill, skill.ID)
	c.JSON(http.StatusCreated, gin.H{"skill": skill})
}

func (h *Handler) deleteSkill(c *gin.Context) {
	id := c.GetUint("user_id")
	sid, err := parseID(c, "sid")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.Services.DB.Where("id = ? AND user_id = ?", sid, id).Delete(&model.UserSkill{})
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ─── helpers ──────────────────────────────────────────────────────────────────

func parseID(c *gin.Context, param string) (uint64, error) {
	return strconv.ParseUint(c.Param(param), 10, 64)
}
