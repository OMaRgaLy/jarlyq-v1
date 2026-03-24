package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/middleware"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

func listAllFilter() repository.CompanyFilter {
	return repository.CompanyFilter{Limit: 200, Offset: 0}
}

func listAllEducationFilter() repository.EducationFilter {
	return repository.EducationFilter{Limit: 200, Offset: 0}
}

func newAdminRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	authMw := middleware.JWTAuth(jwt)
	adminMw := middleware.AdminOnly()

	group.Use(authMw, adminMw)

	// Companies
	group.GET("/companies", handler.adminListCompanies)
	group.POST("/companies", handler.adminCreateCompany)
	group.PUT("/companies/:id", handler.adminUpdateCompany)
	group.DELETE("/companies/:id", handler.adminDeleteCompany)

	// Opportunities
	group.POST("/companies/:id/opportunities", handler.adminCreateOpportunity)
	group.DELETE("/opportunities/:id", handler.adminDeleteOpportunity)

	// Schools
	group.GET("/schools", handler.adminListSchools)
	group.POST("/schools", handler.adminCreateSchool)
	group.PUT("/schools/:id", handler.adminUpdateSchool)
	group.DELETE("/schools/:id", handler.adminDeleteSchool)

	// Courses
	group.POST("/schools/:id/courses", handler.adminCreateCourse)
	group.PUT("/courses/:id", handler.adminUpdateCourse)
	group.DELETE("/courses/:id", handler.adminDeleteCourse)

	// Stacks
	group.GET("/stacks", handler.adminListStacks)
	group.POST("/stacks", handler.adminCreateStack)
	group.DELETE("/stacks/:id", handler.adminDeleteStack)

	// Suggestions
	newAdminSuggestionRoutes(group.Group("/suggestions"), handler)
}

// ─── COMPANIES ────────────────────────────────────────────────────────────────

func (h *Handler) adminListCompanies(c *gin.Context) {
	companies, err := h.Services.Companies.List(c.Request.Context(), listAllFilter())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"companies": companies})
}

type adminCompanyRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	CoverURL    string `json:"cover_url"`
	Website     string `json:"website"`
	Telegram    string `json:"telegram"`
	Email       string `json:"email"`

	TrainingEnabled   bool `json:"training_enabled"`
	InternshipEnabled bool `json:"internship_enabled"`
	VacancyEnabled    bool `json:"vacancy_enabled"`
}

func (h *Handler) adminCreateCompany(c *gin.Context) {
	var req adminCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	company := &model.Company{
		Name:        req.Name,
		Description: req.Description,
		CoverURL:    req.CoverURL,
		Contacts: model.ContactInfo{
			Website:  req.Website,
			Telegram: req.Telegram,
			Email:    req.Email,
		},
		Widgets: model.CompanyWidgets{
			TrainingEnabled:   req.TrainingEnabled,
			InternshipEnabled: req.InternshipEnabled,
			VacancyEnabled:    req.VacancyEnabled,
		},
	}
	if err := h.Services.Companies.Create(c.Request.Context(), company); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"company": company})
}

func (h *Handler) adminUpdateCompany(c *gin.Context) {
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
	var req adminCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	company.Name = req.Name
	company.Description = req.Description
	company.CoverURL = req.CoverURL
	company.Contacts = model.ContactInfo{
		Website:  req.Website,
		Telegram: req.Telegram,
		Email:    req.Email,
	}
	company.Widgets = model.CompanyWidgets{
		TrainingEnabled:   req.TrainingEnabled,
		InternshipEnabled: req.InternshipEnabled,
		VacancyEnabled:    req.VacancyEnabled,
	}
	if err := h.Services.Companies.Update(c.Request.Context(), company); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"company": company})
}

func (h *Handler) adminDeleteCompany(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.Services.Companies.Delete(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ─── OPPORTUNITIES ────────────────────────────────────────────────────────────

type adminOpportunityRequest struct {
	Type        string `json:"type" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Requirements string `json:"requirements"`
	ApplyURL    string `json:"apply_url"`
	Level       string `json:"level"`
}

func (h *Handler) adminCreateOpportunity(c *gin.Context) {
	companyID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}
	var req adminOpportunityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	opp := model.Opportunity{
		CompanyID:    uint(companyID),
		Type:         req.Type,
		Title:        req.Title,
		Description:  req.Description,
		Requirements: req.Requirements,
		ApplyURL:     req.ApplyURL,
		Level:        req.Level,
	}
	if err := h.Services.DB.Create(&opp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"opportunity": opp})
}

func (h *Handler) adminDeleteOpportunity(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.Services.DB.Delete(&model.Opportunity{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ─── SCHOOLS ──────────────────────────────────────────────────────────────────

func (h *Handler) adminListSchools(c *gin.Context) {
	schools, err := h.Services.Education.ListSchools(c.Request.Context(), listAllEducationFilter())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"schools": schools})
}

type adminSchoolRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	CoverURL    string `json:"cover_url"`
	Website     string `json:"website"`
	Telegram    string `json:"telegram"`
	Email       string `json:"email"`
}

func (h *Handler) adminCreateSchool(c *gin.Context) {
	var req adminSchoolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	school := &model.School{
		Name:        req.Name,
		Description: req.Description,
		CoverURL:    req.CoverURL,
		Contacts: model.ContactInfo{
			Website:  req.Website,
			Telegram: req.Telegram,
			Email:    req.Email,
		},
	}
	if err := h.Services.Education.CreateSchool(c.Request.Context(), school); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"school": school})
}

func (h *Handler) adminUpdateSchool(c *gin.Context) {
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
	var req adminSchoolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	school.Name = req.Name
	school.Description = req.Description
	school.CoverURL = req.CoverURL
	school.Contacts = model.ContactInfo{
		Website:  req.Website,
		Telegram: req.Telegram,
		Email:    req.Email,
	}
	if err := h.Services.Education.UpdateSchool(c.Request.Context(), school); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"school": school})
}

func (h *Handler) adminDeleteSchool(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.Services.Education.DeleteSchool(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ─── COURSES ──────────────────────────────────────────────────────────────────

type adminCourseRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	ExternalURL string `json:"external_url"`
}

func (h *Handler) adminCreateCourse(c *gin.Context) {
	schoolID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid school id"})
		return
	}
	var req adminCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	course := model.Course{
		SchoolID:    uint(schoolID),
		Title:       req.Title,
		Description: req.Description,
		ExternalURL: req.ExternalURL,
	}
	if err := h.Services.DB.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"course": course})
}

func (h *Handler) adminUpdateCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req adminCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	course := model.Course{Title: req.Title, Description: req.Description, ExternalURL: req.ExternalURL}
	if err := h.Services.DB.Model(&model.Course{}).Where("id = ?", id).Updates(course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

func (h *Handler) adminDeleteCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.Services.DB.Delete(&model.Course{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ─── STACKS ───────────────────────────────────────────────────────────────────

func (h *Handler) adminListStacks(c *gin.Context) {
	stacks, err := h.Services.Stacks.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"stacks": stacks})
}

type adminStackRequest struct {
	Name       string `json:"name" binding:"required"`
	Popularity uint   `json:"popularity"`
}

func (h *Handler) adminCreateStack(c *gin.Context) {
	var req adminStackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	stack := &model.Stack{Name: req.Name, Popularity: req.Popularity}
	if err := h.Services.Stacks.Create(c.Request.Context(), stack); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"stack": stack})
}

func (h *Handler) adminDeleteStack(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.Services.Stacks.Delete(c.Request.Context(), uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}
