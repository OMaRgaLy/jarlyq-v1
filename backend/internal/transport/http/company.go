package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/example/jarlyq/internal/repository"
)

func newCompanyRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listCompanies)
	group.GET(":id", handler.getCompany)
}

type companyFilterRequest struct {
	StackIDs  []uint `form:"stack_ids[]"`
	RegionIDs []uint `form:"region_ids[]"`
}

func (h *Handler) listCompanies(c *gin.Context) {
	stackIDs := parseUintSlice(c.QueryArray("stack_ids[]"))
	regionIDs := parseUintSlice(c.QueryArray("region_ids[]"))
	companies, err := h.Services.Companies.List(c.Request.Context(), repository.CompanyFilter{StackIDs: stackIDs, RegionIDs: regionIDs})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"companies": companies})
}

func (h *Handler) getCompany(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	company, err := h.Services.Companies.Get(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"company": company})
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
