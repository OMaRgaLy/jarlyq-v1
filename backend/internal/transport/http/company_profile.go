package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetCompanies godoc
// @Summary Get all companies
// @Description Get list of all companies with their profiles
// @Tags Companies
// @Produce json
// @Param limit query int false "Limit (default 20, max 100)"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /companies [get]
func (h *Handler) getCompaniesProfiles(c *gin.Context) {
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

	companies, err := h.Services.CompanyProfile.GetAllCompanies(c.Request.Context(), limit, offset)
	if err != nil {
		h.Logger.Errorf("get companies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get companies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
		"count":   len(companies),
	})
}

// GetCompanyProfile godoc
// @Summary Get company profile
// @Description Get full company profile with jobs, reviews, and HR tips
// @Tags Companies
// @Produce json
// @Param id path int true "Company ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /companies/{id} [get]
func (h *Handler) getCompanyProfile(c *gin.Context) {
	id := c.Param("id")
	companyID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}

	company, err := h.Services.CompanyProfile.GetCompanyProfile(c.Request.Context(), uint(companyID))
	if err != nil {
		h.Logger.Errorf("get company profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get company"})
		return
	}

	if company == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    company,
	})
}

// SearchCompanies godoc
// @Summary Search companies
// @Description Search companies by name
// @Tags Companies
// @Produce json
// @Param q query string true "Search query"
// @Param limit query int false "Limit (default 20)"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /companies/search [get]
func (h *Handler) searchCompanies(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "search query required"})
		return
	}

	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	if o := c.Query("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	companies, err := h.Services.CompanyProfile.SearchCompanies(c.Request.Context(), query, limit, offset)
	if err != nil {
		h.Logger.Errorf("search companies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search companies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
		"count":   len(companies),
	})
}

// GetHiringCompanies godoc
// @Summary Get hiring companies
// @Description Get companies that are actively hiring
// @Tags Companies
// @Produce json
// @Param limit query int false "Limit (default 20)"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /companies/hiring [get]
func (h *Handler) getHiringCompanies(c *gin.Context) {
	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	if o := c.Query("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	companies, err := h.Services.CompanyProfile.GetHiringCompanies(c.Request.Context(), limit, offset)
	if err != nil {
		h.Logger.Errorf("get hiring companies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get companies"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    companies,
		"count":   len(companies),
	})
}

// GetCompanyReviews godoc
// @Summary Get company reviews
// @Description Get all employee reviews for a company
// @Tags Companies
// @Produce json
// @Param id path int true "Company ID"
// @Param limit query int false "Limit (default 20)"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /companies/{id}/reviews [get]
func (h *Handler) getCompanyReviews(c *gin.Context) {
	id := c.Param("id")
	companyID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}

	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	if o := c.Query("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	reviews, err := h.Services.CompanyProfile.GetCompanyReviews(c.Request.Context(), uint(companyID), limit, offset)
	if err != nil {
		h.Logger.Errorf("get company reviews: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    reviews,
		"count":   len(reviews),
	})
}

// GetCompanyAdvices godoc
// @Summary Get HR tips from company
// @Description Get hiring tips and advice from company HR
// @Tags Companies
// @Produce json
// @Param id path int true "Company ID"
// @Param limit query int false "Limit (default 10)"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /companies/{id}/advices [get]
func (h *Handler) getCompanyAdvices(c *gin.Context) {
	id := c.Param("id")
	companyID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}

	limit := 10
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	advices, err := h.Services.CompanyProfile.GetCompanyAdvices(c.Request.Context(), uint(companyID), limit, offset)
	if err != nil {
		h.Logger.Errorf("get company advices: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get advices"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    advices,
		"count":   len(advices),
	})
}

func newCompanyProfileRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.getCompaniesProfiles)
	group.GET("/search", handler.searchCompanies)
	group.GET("/hiring", handler.getHiringCompanies)
	group.GET("/:id", handler.getCompanyProfile)
	group.GET("/:id/reviews", handler.getCompanyReviews)
	group.GET("/:id/advices", handler.getCompanyAdvices)
}
