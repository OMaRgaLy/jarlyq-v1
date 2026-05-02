package http

import (
	"crypto/sha256"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/service"
)

// cookieSecure returns true when running in production (HTTPS required for Secure flag).
func cookieSecure() bool {
	return os.Getenv("GIN_MODE") == "release"
}

// setAuthCookies writes httpOnly access_token and refresh_token cookies.
func (h *Handler) setAuthCookies(c *gin.Context, accessToken, refreshToken string) {
	secure := cookieSecure()
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		MaxAge:   15 * 60, // 15 min
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		MaxAge:   30 * 24 * 3600, // 30 days
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// clearAuthCookies expires both auth cookies.
func (h *Handler) clearAuthCookies(c *gin.Context) {
	secure := cookieSecure()
	for _, name := range []string{"access_token", "refresh_token"} {
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     name,
			Value:    "",
			MaxAge:   -1,
			Path:     "/",
			HttpOnly: true,
			Secure:   secure,
			SameSite: http.SameSiteLaxMode,
		})
	}
}

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
	group.POST("/logout", handler.logout)
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
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
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
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
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
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
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
	RefreshToken string `json:"refresh_token"`
}

func (h *Handler) refreshToken(c *gin.Context) {
	// Read refresh_token from httpOnly cookie first, then fallback to JSON body.
	rawRefresh, err := c.Cookie("refresh_token")
	if err != nil || rawRefresh == "" {
		var req refreshRequest
		if jsonErr := c.ShouldBindJSON(&req); jsonErr != nil || req.RefreshToken == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "refresh_token required"})
			return
		}
		rawRefresh = req.RefreshToken
	}

	// 1. Validate JWT signature & expiry
	claims, err := h.JWT.ParseRefreshToken(rawRefresh)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token"})
		return
	}

	// 2. Check token exists in DB and hasn't been used yet (rotation check)
	if !h.revokeRefreshToken(rawRefresh) {
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

	// 5. Store new refresh token and update cookies
	h.storeRefreshToken(user.ID, newRefreshToken, 30*24*time.Hour)
	h.setAuthCookies(c, accessToken, newRefreshToken)

	c.JSON(http.StatusOK, authResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		User:         mapUser(&user),
	})
}

// POST /auth/logout — clear auth cookies and revoke refresh token.
func (h *Handler) logout(c *gin.Context) {
	if rawRefresh, err := c.Cookie("refresh_token"); err == nil && rawRefresh != "" {
		h.revokeRefreshToken(rawRefresh)
	}
	h.clearAuthCookies(c)
	c.JSON(http.StatusOK, gin.H{"status": "logged out"})
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
