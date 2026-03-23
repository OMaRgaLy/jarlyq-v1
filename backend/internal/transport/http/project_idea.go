package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (h *Handler) getProjectIdeas(c *gin.Context) {
	direction := c.Query("direction")
	difficulty := c.Query("difficulty")
	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 && val <= 100 {
			limit = val
		}
	}

	if o := c.Query("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	ideas, err := h.Services.ProjectIdea.GetAll(c.Request.Context(), direction, difficulty, limit, offset)
	if err != nil {
		h.Logger.Errorf("get project ideas: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get project ideas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    ideas,
		"count":   len(ideas),
	})
}

func (h *Handler) getProjectIdea(c *gin.Context) {
	id := c.Param("id")
	ideaID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid idea id"})
		return
	}

	idea, err := h.Services.ProjectIdea.GetByID(c.Request.Context(), uint(ideaID))
	if err != nil {
		h.Logger.Errorf("get project idea: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get idea"})
		return
	}

	if idea == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "idea not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    idea,
	})
}

func (h *Handler) getProjectDirections(c *gin.Context) {
	directions, err := h.Services.ProjectIdea.GetDirections(c.Request.Context())
	if err != nil {
		h.Logger.Errorf("get directions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get directions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    directions,
	})
}

func (h *Handler) getPopularProjectIdeas(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 && val <= 50 {
			limit = val
		}
	}

	ideas, err := h.Services.ProjectIdea.GetPopular(c.Request.Context(), limit)
	if err != nil {
		h.Logger.Errorf("get popular ideas: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get ideas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    ideas,
		"count":   len(ideas),
	})
}

func newProjectIdeaRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.getProjectIdeas)
	group.GET("/directions", handler.getProjectDirections)
	group.GET("/popular", handler.getPopularProjectIdeas)
	group.GET("/:id", handler.getProjectIdea)
}
