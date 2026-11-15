package http

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func newModuleRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listModules)
}

// GET /api/v1/modules
// Public: the frontend reads this on every page load to decide which sections
// to show in navigation and which pages to open, show as "soon", or hide.
func (h *Handler) listModules(c *gin.Context) {
	var modules []model.SiteModule
	if err := h.Services.DB.Order("sort_order ASC, id ASC").Find(&modules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load modules"})
		return
	}
	// Switching a module in the admin panel must show up on the next page load.
	c.Header("Cache-Control", "no-store")
	c.JSON(http.StatusOK, gin.H{"modules": modules})
}

// ─── Admin handlers ───────────────────────────────────────────────────────────

type moduleUpdateRequest struct {
	// Pointers: a field that is absent from the JSON is left unchanged.
	State       *string `json:"state"`
	Label       *string `json:"label"`
	Description *string `json:"description"`
}

// PUT /api/v1/admin/modules/:key
func (h *Handler) adminUpdateModule(c *gin.Context) {
	var req moduleUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var m model.SiteModule
	if err := h.Services.DB.Where("key = ?", c.Param("key")).First(&m).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "module not found"})
		return
	}

	if req.State != nil {
		if !model.IsValidModuleState(*req.State) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "state must be one of: on, soon, off"})
			return
		}
		m.State = *req.State
	}
	if req.Label != nil {
		label := strings.TrimSpace(*req.Label)
		if label == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "label must not be empty"})
			return
		}
		m.Label = label
	}
	if req.Description != nil {
		m.Description = strings.TrimSpace(*req.Description)
	}

	if err := h.Services.DB.Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save module"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"module": m})
}

type modulePresetRequest struct {
	Preset string `json:"preset" binding:"required"`
}

// POST /api/v1/admin/modules/preset  {"preset": "mvp" | "all"}
func (h *Handler) adminApplyModulePreset(c *gin.Context) {
	var req modulePresetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if _, ok := model.ModulePresets[req.Preset]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unknown preset"})
		return
	}
	if err := model.ApplyModulePreset(h.Services.DB, req.Preset); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to apply preset"})
		return
	}

	var modules []model.SiteModule
	if err := h.Services.DB.Order("sort_order ASC, id ASC").Find(&modules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load modules"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"modules": modules})
}
