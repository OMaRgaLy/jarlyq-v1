package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetCareerPaths godoc
// @Summary Get all career paths
// @Description Get paginated list of career paths for students
// @Tags Career Paths
// @Produce json
// @Param limit query int false "Limit per page (default 10, max 100)"
// @Param offset query int false "Offset for pagination"
// @Success 200 {object} map[string]interface{}
// @Router /career-paths [get]
func (h *Handler) getCareerPaths(c *gin.Context) {
	limit := 10
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

	paths, err := h.services.CareerPath.GetAllPaths(c.Request.Context(), limit, offset)
	if err != nil {
		h.log.Errorf("get career paths: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get career paths"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    paths,
		"count":   len(paths),
	})
}

// GetCareerPathDetail godoc
// @Summary Get career path details
// @Description Get full details of a career path with all stages
// @Tags Career Paths
// @Produce json
// @Param id path int true "Career Path ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /career-paths/{id} [get]
func (h *Handler) getCareerPathDetail(c *gin.Context) {
	id := c.Param("id")
	pathID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path id"})
		return
	}

	path, err := h.services.CareerPath.GetPathDetail(c.Request.Context(), uint(pathID))
	if err != nil {
		h.log.Errorf("get career path detail: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get career path"})
		return
	}

	if path == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "career path not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    path,
	})
}

// GetCareerPathStages godoc
// @Summary Get path stages
// @Description Get all stages for a specific career path
// @Tags Career Paths
// @Produce json
// @Param id path int true "Career Path ID"
// @Success 200 {object} map[string]interface{}
// @Router /career-paths/{id}/stages [get]
func (h *Handler) getCareerPathStages(c *gin.Context) {
	id := c.Param("id")
	pathID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path id"})
		return
	}

	stages, err := h.services.CareerPath.GetPathStages(c.Request.Context(), uint(pathID))
	if err != nil {
		h.log.Errorf("get career path stages: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get stages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stages,
		"count":   len(stages),
	})
}

func newCareerPathRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.getCareerPaths)
	group.GET("/:id", handler.getCareerPathDetail)
	group.GET("/:id/stages", handler.getCareerPathStages)
}
