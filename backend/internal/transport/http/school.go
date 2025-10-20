package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/example/jarlyq/internal/repository"
)

func newSchoolRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listSchools)
	group.GET(":id", handler.getSchool)
}

func (h *Handler) listSchools(c *gin.Context) {
	stackIDs := parseUintSlice(c.QueryArray("stack_ids[]"))
	regionIDs := parseUintSlice(c.QueryArray("region_ids[]"))
	schools, err := h.Services.Education.ListSchools(c.Request.Context(), repository.EducationFilter{StackIDs: stackIDs, RegionIDs: regionIDs})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"schools": schools})
}

func (h *Handler) getSchool(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	school, err := h.Services.Education.GetSchool(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"school": school})
}
