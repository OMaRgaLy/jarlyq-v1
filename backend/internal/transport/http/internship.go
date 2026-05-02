package http

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func newInternshipRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listInternships)
	group.GET("/:id", handler.getInternship)
}

// listInternships returns all opportunities of type "internship"
// with their parent company info, supporting filters:
//   ?city=Алматы  ?work_format=remote  ?is_year_round=true  ?is_paid=true
func (h *Handler) listInternships(c *gin.Context) {
	type internshipItem struct {
		model.Opportunity
		CompanyName    string `json:"companyName"`
		CompanyLogoURL string `json:"companyLogoURL"`
		CompanyID      uint   `json:"companyId"`
	}

	db := h.Services.DB.
		Table("opportunities").
		Select("opportunities.*, companies.name as company_name, companies.logo_url as company_logo_url, companies.id as company_id").
		Joins("LEFT JOIN companies ON companies.id = opportunities.company_id").
		Where("opportunities.type = ? AND opportunities.is_active = ?", "internship", true)

	if city := strings.TrimSpace(c.Query("city")); city != "" {
		db = db.Where("LOWER(opportunities.city) LIKE ?", "%"+strings.ToLower(city)+"%")
	}
	if wf := c.Query("work_format"); wf != "" {
		db = db.Where("opportunities.work_format = ?", wf)
	}
	if c.Query("is_year_round") == "true" {
		db = db.Where("opportunities.is_year_round = ?", true)
	}
	if c.Query("is_paid") == "true" {
		db = db.Where("opportunities.salary_min > 0 OR opportunities.salary_max > 0")
	}
	if stackID, err := strconv.Atoi(c.Query("stack_id")); err == nil && stackID > 0 {
		db = db.Joins("JOIN opportunity_stacks os ON os.opportunity_id = opportunities.id AND os.stack_id = ?", stackID)
	}

	db = db.Order("opportunities.is_year_round DESC, opportunities.deadline ASC")

	var results []internshipItem
	if err := db.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load internships"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"internships": results})
}

func (h *Handler) getInternship(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	type internshipDetail struct {
		model.Opportunity
		CompanyName    string `json:"companyName"`
		CompanyLogoURL string `json:"companyLogoURL"`
		CompanyID      uint   `json:"companyId"`
	}

	var result internshipDetail
	err = h.Services.DB.
		Table("opportunities").
		Select("opportunities.*, companies.name as company_name, companies.logo_url as company_logo_url, companies.id as company_id").
		Joins("LEFT JOIN companies ON companies.id = opportunities.company_id").
		Where("opportunities.id = ? AND opportunities.is_active = ?", id, true).
		Scan(&result).Error

	if err != nil || result.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "internship not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"internship": result, "opportunity": result})
}
