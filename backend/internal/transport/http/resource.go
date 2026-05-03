package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func newResourceRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listResources)
}

// GET /api/v1/resources
// Filters: ?category=security  ?is_free=true  ?language=en  ?difficulty=beginner  ?q=keyword
func (h *Handler) listResources(c *gin.Context) {
	db := h.Services.DB.Model(&model.Resource{}).Where("is_active = ?", true)

	if cat := c.Query("category"); cat != "" {
		db = db.Where("category = ?", cat)
	}
	if sub := c.Query("subcategory"); sub != "" {
		db = db.Where("LOWER(subcategory) LIKE ?", "%"+sub+"%")
	}
	if c.Query("is_free") == "true" {
		db = db.Where("is_free = ?", true)
	}
	if lang := c.Query("language"); lang != "" {
		db = db.Where("language = ?", lang)
	}
	if diff := c.Query("difficulty"); diff != "" {
		db = db.Where("difficulty = ?", diff)
	}
	if q := c.Query("q"); q != "" {
		like := "%" + q + "%"
		db = db.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(subcategory) LIKE ?", like, like, like)
	}

	db = db.Order("sort_order ASC, category ASC, title ASC")

	var resources []model.Resource
	if err := db.Find(&resources).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load resources"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"resources": resources})
}

// ─── Admin handlers ───────────────────────────────────────────────────────────

type resourceRequest struct {
	Title        string `json:"title" binding:"required"`
	URL          string `json:"url" binding:"required"`
	Description  string `json:"description"`
	Category     string `json:"category" binding:"required"`
	Subcategory  string `json:"subcategory"`
	IsFree       bool   `json:"is_free"`
	Language     string `json:"language"`
	Difficulty   string `json:"difficulty"`
	CountryFocus string `json:"country_focus"`
	IsActive     bool   `json:"is_active"`
	SortOrder    int    `json:"sort_order"`
}

func (h *Handler) adminListResources(c *gin.Context) {
	var resources []model.Resource
	if err := h.Services.DB.Order("sort_order ASC, category ASC, title ASC").Find(&resources).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"resources": resources})
}

func (h *Handler) adminCreateResource(c *gin.Context) {
	var req resourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	lang := req.Language
	if lang == "" {
		lang = "ru"
	}
	r := model.Resource{
		Title:        req.Title,
		URL:          req.URL,
		Description:  req.Description,
		Category:     req.Category,
		Subcategory:  req.Subcategory,
		IsFree:       req.IsFree,
		Language:     lang,
		Difficulty:   req.Difficulty,
		CountryFocus: req.CountryFocus,
		IsActive:     req.IsActive,
		SortOrder:    req.SortOrder,
	}
	if err := h.Services.DB.Create(&r).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"resource": r})
}

func (h *Handler) adminUpdateResource(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req resourceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	lang := req.Language
	if lang == "" {
		lang = "ru"
	}
	updates := map[string]interface{}{
		"title": req.Title, "url": req.URL, "description": req.Description,
		"category": req.Category, "subcategory": req.Subcategory,
		"is_free": req.IsFree, "language": lang,
		"difficulty": req.Difficulty, "country_focus": req.CountryFocus,
		"is_active": req.IsActive, "sort_order": req.SortOrder,
	}
	if err := h.Services.DB.Model(&model.Resource{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

func (h *Handler) adminDeleteResource(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.Services.DB.Delete(&model.Resource{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}
