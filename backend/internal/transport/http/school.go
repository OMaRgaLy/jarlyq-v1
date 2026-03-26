package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)


func newSchoolRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listSchools)
	group.GET("/:id", handler.getSchool)
}

func newMastersRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listMasters)
}

func (h *Handler) listMasters(c *gin.Context) {
	country := c.Query("country")
	language := c.Query("language")
	scholarship := c.Query("scholarship") == "true"
	limit, offset := parsePagination(c)

	rows, err := h.Services.Education.ListMasters(c.Request.Context(), repository.MasterFilter{
		Country:     country,
		Language:    language,
		Scholarship: scholarship,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		h.Logger.Errorf("list masters: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch masters"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"programs": rows})
}

func (h *Handler) listSchools(c *gin.Context) {
	stackIDs := parseUintSlice(c.QueryArray("stack_ids[]"))
	regionIDs := parseUintSlice(c.QueryArray("region_ids[]"))
	limit, offset := parsePagination(c)
	schools, err := h.Services.Education.ListSchools(c.Request.Context(), repository.EducationFilter{
		StackIDs:  stackIDs,
		RegionIDs: regionIDs,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		h.Logger.Errorf("list schools: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch schools"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"schools": schools, "limit": limit, "offset": offset})
}

func (h *Handler) getSchool(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	school, err := h.Services.Education.GetSchool(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "school not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"school": school})
}
