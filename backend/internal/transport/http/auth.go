package http

import (
	"crypto/sha256"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/service"
)

// hashToken returns SHA-256 hex of a raw token string.
func hashToken(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return fmt.Sprintf("%x", h)
}

// storeRefreshToken saves a refresh token hash to the DB.
func (h *Handler) storeRefreshToken(userID uint, rawToken string, ttl time.Duration) {
	rt := model.RefreshToken{
		UserID:    userID,
		TokenHash: hashToken(rawToken),
		ExpiresAt: time.Now().Add(ttl),
	}
	h.Services.DB.Create(&rt)
}

// revokeRefreshToken deletes the token hash from DB. Returns false if not found (already used).
func (h *Handler) revokeRefreshToken(rawToken string) bool {
	hash := hashToken(rawToken)
	result := h.Services.DB.Where("token_hash = ? AND expires_at > ?", hash, time.Now()).
		Delete(&model.RefreshToken{})
	return result.RowsAffected > 0
}

func newAuthRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager, authRateLimiter gin.HandlerFunc) {
	group.POST("/register", authRateLimiter, handler.register)
	group.POST("/login", authRateLimiter, handler.login)
	group.POST("/google", authRateLimiter, handler.googleOAuth)
	group.POST("/refresh", authRateLimiter, handler.refreshToken)
	group.POST("/password/forgot", authRateLimiter, handler.forgotPassword)
	group.POST("/password/reset", authRateLimiter, handler.resetPassword)
	group.GET("/verify-email", handler.verifyEmail)
}

type registerRequest struct {
	Email         string `json:"email" binding:"required,email"`
	Password      string `json:"password" binding:"required,min=8"`
	FirstName     string `json:"first_name" binding:"required"`
	LastName      string `json:"last_name" binding:"required"`
	TermsAccepted bool   `json:"terms_accepted"`
}

type authResponse struct {
	AccessToken  string           `json:"access_token"`
	RefreshToken string           `json:"refresh_token"`
	User         authUserResponse `json:"user"`
}

type authUserResponse struct {
	ID        uint   `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Theme     string `json:"theme"`
	Role      string `json:"role"`
}

func (h *Handler) register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}

	res, err := h.Services.User.Register(c.Request.Context(), service.RegisterInput{
		Email:         req.Email,
		Password:      req.Password,
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		TermsAccepted: req.TermsAccepted,
	})
	if err != nil {
		h.Logger.Warnf("register failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "registration failed"})
		return
	}

	h.storeRefreshToken(res.User.ID, res.RefreshToken, 30*24*time.Hour)
	c.JSON(http.StatusCreated, authResponse{
		AccessToken:  res.AccessToken,
		RefreshToken: res.RefreshToken,
		User:         mapUser(res.User),
	})
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	res, err := h.Services.User.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	h.storeRefreshToken(res.User.ID, res.RefreshToken, 30*24*time.Hour)
	c.JSON(http.StatusOK, authResponse{
		AccessToken:  res.AccessToken,
		RefreshToken: res.RefreshToken,
		User:         mapUser(res.User),
	})
}

type googleRequest struct {
	Token string `json:"token" binding:"required"`
}

func (h *Handler) googleOAuth(c *gin.Context) {
	var req googleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	res, err := h.Services.User.GoogleOAuth(c.Request.Context(), req.Token)
	if err != nil {
		h.Logger.Warnf("google oauth failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication failed"})
		return
	}
	h.storeRefreshToken(res.User.ID, res.RefreshToken, 30*24*time.Hour)
	c.JSON(http.StatusOK, authResponse{
		AccessToken:  res.AccessToken,
		RefreshToken: res.RefreshToken,
		User:         mapUser(res.User),
	})
}

type forgotRequest struct {
	Email string `json:"email" binding:"required,email"`
}

func (h *Handler) forgotPassword(c *gin.Context) {
	var req forgotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	if err := h.Services.User.RequestPasswordReset(c.Request.Context(), req.Email); err != nil {
		h.Logger.Warnf("password reset request failed for %s: %v", req.Email, err)
	}
	// Always return success to prevent email enumeration
	c.JSON(http.StatusOK, gin.H{"status": "if the email exists, a reset link has been sent"})
}

type resetRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

func (h *Handler) resetPassword(c *gin.Context) {
	var req resetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	if err := h.Services.User.ResetPassword(c.Request.Context(), req.Token, req.NewPassword); err != nil {
		h.Logger.Warnf("password reset failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "password reset"})
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *Handler) refreshToken(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token required"})
		return
	}

	// 1. Validate JWT signature & expiry
	claims, err := h.JWT.ParseRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token"})
		return
	}

	// 2. Check token exists in DB and hasn't been used yet (rotation check)
	if !h.revokeRefreshToken(req.RefreshToken) {
		// Token not found — either already rotated or never issued. Possible replay attack.
		// Revoke ALL tokens for this user as a safety measure.
		h.Services.DB.Where("user_id = ?", claims.UserID).Delete(&model.RefreshToken{})
		c.JSON(http.StatusUnauthorized, gin.H{"error": "refresh token already used or revoked"})
		return
	}

	// 3. Verify user still exists
	var user model.User
	if err := h.Services.DB.First(&user, claims.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	// 4. Issue new tokens
	accessToken, err := h.JWT.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	newRefreshToken, err := h.JWT.GenerateRefreshToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// 5. Store new refresh token
	h.storeRefreshToken(user.ID, newRefreshToken, 30*24*time.Hour)

	c.JSON(http.StatusOK, authResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		User:         mapUser(&user),
	})
}

func mapUser(user *model.User) authUserResponse {
	if user == nil {
		return authUserResponse{}
	}
	role := user.Role
	if role == "" {
		role = "user"
	}
	return authUserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Theme:     user.Theme,
		Role:      role,
	}
}

// GET /auth/verify-email?token=...
func (h *Handler) verifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}
	if err := h.Services.User.VerifyEmail(c.Request.Context(), token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "email verified"})
}
