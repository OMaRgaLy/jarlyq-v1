package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

func newCompanyRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listCompanies)
	group.GET("/:id", handler.getCompany)
}

func (h *Handler) listCompanies(c *gin.Context) {
	stackIDs := parseUintSlice(c.QueryArray("stack_ids[]"))
	regionIDs := parseUintSlice(c.QueryArray("region_ids[]"))
	limit, offset := parsePagination(c)
	companies, err := h.Services.Companies.List(c.Request.Context(), repository.CompanyFilter{
		StackIDs:  stackIDs,
		RegionIDs: regionIDs,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		h.Logger.Errorf("list companies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch companies"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"companies": companies, "limit": limit, "offset": offset})
}

func (h *Handler) getCompany(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	company, err := h.Services.Companies.Get(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"company": company})
}

func parsePagination(c *gin.Context) (int, int) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}

func parseUintSlice(values []string) []uint {
	result := make([]uint, 0, len(values))
	for _, v := range values {
		if v == "" {
			continue
		}
		parsed, err := strconv.ParseUint(v, 10, 64)
		if err == nil {
			result = append(result, uint(parsed))
		}
	}
	return result
}
