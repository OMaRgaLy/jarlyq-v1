package http

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func newSearchRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.search)
}

type searchCompany struct {
	ID      uint   `json:"id"`
	Name    string `json:"name"`
	LogoURL string `json:"logoURL,omitempty"`
	Industry string `json:"industry,omitempty"`
}

type searchSchool struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
}

type searchOpportunity struct {
	ID          uint   `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Level       string `json:"level"`
	CompanyID   uint   `json:"companyId"`
	CompanyName string `json:"companyName"`
}

func (h *Handler) search(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if len(q) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query too short"})
		return
	}

	like := "%" + strings.ToLower(q) + "%"

	// Companies
	var companies []model.Company
	if err := h.Services.DB.
		Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(industry) LIKE ?", like, like, like).
		Limit(5).
		Find(&companies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	companyResults := make([]searchCompany, len(companies))
	for i, co := range companies {
		companyResults[i] = searchCompany{ID: co.ID, Name: co.Name, LogoURL: co.LogoURL, Industry: co.Industry}
	}

	// Schools
	var schools []model.School
	if err := h.Services.DB.
		Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ?", like, like).
		Limit(5).
		Find(&schools).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	schoolResults := make([]searchSchool, len(schools))
	for i, s := range schools {
		schoolResults[i] = searchSchool{ID: s.ID, Name: s.Name, Description: s.Description}
	}

	// Opportunities (join with company name)
	type oppRow struct {
		model.Opportunity
		CompanyName string
	}
	var opps []oppRow
	if err := h.Services.DB.Table("opportunities").
		Select("opportunities.*, companies.name AS company_name").
		Joins("LEFT JOIN companies ON companies.id = opportunities.company_id").
		Where("LOWER(opportunities.title) LIKE ? OR LOWER(opportunities.description) LIKE ? OR LOWER(companies.name) LIKE ?", like, like, like).
		Limit(5).
		Scan(&opps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	oppResults := make([]searchOpportunity, len(opps))
	for i, o := range opps {
		oppResults[i] = searchOpportunity{
			ID: o.ID, Type: o.Type, Title: o.Title,
			Level: o.Level, CompanyID: o.CompanyID, CompanyName: o.CompanyName,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"companies":     companyResults,
		"schools":       schoolResults,
		"opportunities": oppResults,
		"query":         q,
	})
}
