package http

import (
	"net/http"
	"strconv"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/gin-gonic/gin"
)

func newSuggestionRoutes(r gin.IRouter, h *Handler) {
	r.POST("", h.submitSuggestion)
}

func newAdminSuggestionRoutes(r gin.IRouter, h *Handler) {
	r.GET("", h.listSuggestions)
	r.PUT("/:id", h.reviewSuggestion)
}

func (h *Handler) submitSuggestion(c *gin.Context) {
	var body model.Suggestion
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Name == "" || body.ContactEmail == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name and contact_email are required"})
		return
	}
	if body.Type != "company" && body.Type != "school" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type must be 'company' or 'school'"})
		return
	}
	if err := h.Services.Suggestion.Submit(&body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true})
}

func (h *Handler) listSuggestions(c *gin.Context) {
	status := c.Query("status")
	list, err := h.Services.Suggestion.List(status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"suggestions": list})
}

func (h *Handler) reviewSuggestion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var body struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Status != "approved" && body.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be 'approved' or 'rejected'"})
		return
	}
	if err := h.Services.Suggestion.Review(uint(id), body.Status, body.Notes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
