package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/middleware"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func newFavoriteRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	authMw := middleware.JWTAuth(jwt)
	group.Use(authMw)

	group.GET("", handler.listFavorites)
	group.POST("", handler.addFavorite)
	group.DELETE("/:entity_type/:entity_id", handler.removeFavorite)
	group.GET("/check/:entity_type/:entity_id", handler.checkFavorite)
}

func (h *Handler) listFavorites(c *gin.Context) {
	userID := c.GetUint("user_id")
	entityType := c.Query("type") // optional filter

	q := h.Services.DB.Where("user_id = ?", userID)
	if entityType != "" {
		q = q.Where("entity_type = ?", entityType)
	}
	var favs []model.UserFavorite
	q.Order("created_at DESC").Limit(200).Find(&favs)
	c.JSON(http.StatusOK, gin.H{"favorites": favs})
}

type addFavoriteRequest struct {
	EntityType string `json:"entity_type" binding:"required"`
	EntityID   uint   `json:"entity_id" binding:"required"`
}

func (h *Handler) addFavorite(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req addFavoriteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	valid := map[string]bool{"company": true, "opportunity": true, "school": true}
	if !valid[req.EntityType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "entity_type must be company, opportunity, or school"})
		return
	}

	fav := &model.UserFavorite{
		UserID:     userID,
		EntityType: req.EntityType,
		EntityID:   req.EntityID,
	}
	if err := h.Services.DB.Create(fav).Error; err != nil {
		// Unique constraint violation = already favorited
		c.JSON(http.StatusConflict, gin.H{"error": "already in favorites"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"favorite": fav})
}

func (h *Handler) removeFavorite(c *gin.Context) {
	userID := c.GetUint("user_id")
	entityType := c.Param("entity_type")
	entityID, err := strconv.ParseUint(c.Param("entity_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_id"})
		return
	}

	result := h.Services.DB.Where("user_id = ? AND entity_type = ? AND entity_id = ?", userID, entityType, entityID).
		Delete(&model.UserFavorite{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "removed"})
}

func (h *Handler) checkFavorite(c *gin.Context) {
	userID := c.GetUint("user_id")
	entityType := c.Param("entity_type")
	entityID, err := strconv.ParseUint(c.Param("entity_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_id"})
		return
	}

	var count int64
	h.Services.DB.Model(&model.UserFavorite{}).
		Where("user_id = ? AND entity_type = ? AND entity_id = ?", userID, entityType, entityID).
		Count(&count)
	c.JSON(http.StatusOK, gin.H{"isFavorite": count > 0})
}
