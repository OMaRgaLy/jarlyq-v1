package http

import (
	"net/http"
	"strconv"
	"time"

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

	group.Use(authMw, adminMw, middleware.AuditLog(handler.Services.DB))

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
	group.PUT("/stacks/:id", handler.adminUpdateStack)
	group.DELETE("/stacks/:id", handler.adminDeleteStack)

	// Users (read-only)
	group.GET("/users", handler.adminListUsers)

	// HR Contacts
	group.POST("/companies/:id/hr-contacts", handler.adminCreateHRContact)
	group.DELETE("/hr-contacts/:id", handler.adminDeleteHRContact)

	// HR Content
	group.POST("/companies/:id/hr-content", handler.adminCreateHRContent)
	group.DELETE("/hr-content/:id", handler.adminDeleteHRContent)

	// Hackathons
	group.GET("/hackathons", handler.adminListHackathons)
	group.POST("/hackathons", handler.adminCreateHackathon)
	group.PUT("/hackathons/:id", handler.adminUpdateHackathon)
	group.DELETE("/hackathons/:id", handler.adminDeleteHackathon)

	// Reviews moderation
	group.GET("/reviews", handler.adminListReviews)
	group.PUT("/reviews/:id/approve", handler.adminApproveReview)
	group.PUT("/reviews/:id/reject", handler.adminRejectReview)

	// Suggestions
	newAdminSuggestionRoutes(group.Group("/suggestions"), handler)

	// Owner requests
	group.GET("/owner-requests", handler.adminListOwnerRequests)
	group.PUT("/owner-requests/:id/approve", handler.adminApproveOwnerRequest)
	group.PUT("/owner-requests/:id/reject", handler.adminRejectOwnerRequest)

	// User role management
	group.PUT("/users/:id/role", handler.adminSetUserRole)

	// Audit log
	group.GET("/audit-log", handler.adminListAuditLog)
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
	Name          string `json:"name" binding:"required"`
	Description   string `json:"description"`
	CoverURL      string `json:"cover_url"`
	LogoURL       string `json:"logo_url"`
	About         string `json:"about"`
	FoundedYear   int    `json:"founded_year"`
	EmployeeCount string `json:"employee_count"`
	Industry      string `json:"industry"`
	Website       string `json:"website"`
	Telegram      string `json:"telegram"`
	Email         string `json:"email"`

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
		Name:          req.Name,
		Description:   req.Description,
		CoverURL:      req.CoverURL,
		LogoURL:       req.LogoURL,
		About:         req.About,
		FoundedYear:   req.FoundedYear,
		EmployeeCount: req.EmployeeCount,
		Industry:      req.Industry,
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
	company.LogoURL = req.LogoURL
	company.About = req.About
	company.FoundedYear = req.FoundedYear
	company.EmployeeCount = req.EmployeeCount
	company.Industry = req.Industry
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
	Type           string `json:"type" binding:"required"`
	Title          string `json:"title" binding:"required"`
	Description    string `json:"description"`
	Requirements   string `json:"requirements"`
	ApplyURL       string `json:"apply_url"`
	Level          string `json:"level"`
	SalaryMin      int    `json:"salary_min"`
	SalaryMax      int    `json:"salary_max"`
	SalaryCurrency string `json:"salary_currency"`
	WorkFormat     string `json:"work_format"`
	City           string `json:"city"`
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
		CompanyID:      uint(companyID),
		Type:           req.Type,
		Title:          req.Title,
		Description:    req.Description,
		Requirements:   req.Requirements,
		ApplyURL:       req.ApplyURL,
		Level:          req.Level,
		SalaryMin:      req.SalaryMin,
		SalaryMax:      req.SalaryMax,
		SalaryCurrency: req.SalaryCurrency,
		WorkFormat:     req.WorkFormat,
		City:           req.City,
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
	Name          string `json:"name" binding:"required"`
	Type          string `json:"type"`
	Country       string `json:"country"`
	Description   string `json:"description"`
	CoverURL      string `json:"cover_url"`
	IsStateFunded bool   `json:"is_state_funded"`
	Website       string `json:"website"`
	Telegram      string `json:"telegram"`
	Email         string `json:"email"`
}

func (h *Handler) adminCreateSchool(c *gin.Context) {
	var req adminSchoolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	school := &model.School{
		Name:          req.Name,
		Type:          req.Type,
		Country:       req.Country,
		Description:   req.Description,
		CoverURL:      req.CoverURL,
		IsStateFunded: req.IsStateFunded,
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
	school.Type = req.Type
	school.Country = req.Country
	school.Description = req.Description
	school.CoverURL = req.CoverURL
	school.IsStateFunded = req.IsStateFunded
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
	Title                string `json:"title" binding:"required"`
	Description          string `json:"description"`
	ExternalURL          string `json:"external_url"`
	Price                int    `json:"price"`
	PriceCurrency        string `json:"price_currency"`
	DurationWeeks        int    `json:"duration_weeks"`
	Format               string `json:"format"`
	HasEmployment        bool   `json:"has_employment"`
	Level                string `json:"level"`
	Language             string `json:"language"`
	ScholarshipAvailable bool   `json:"scholarship_available"`
	ApplicationDeadline  string `json:"application_deadline"`
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
		SchoolID:             uint(schoolID),
		Title:                req.Title,
		Description:          req.Description,
		ExternalURL:          req.ExternalURL,
		Price:                req.Price,
		PriceCurrency:        req.PriceCurrency,
		DurationWeeks:        req.DurationWeeks,
		Format:               req.Format,
		HasEmployment:        req.HasEmployment,
		Level:                req.Level,
		Language:             req.Language,
		ScholarshipAvailable: req.ScholarshipAvailable,
		ApplicationDeadline:  req.ApplicationDeadline,
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
	course := model.Course{
		Title:                req.Title,
		Description:          req.Description,
		ExternalURL:          req.ExternalURL,
		Price:                req.Price,
		PriceCurrency:        req.PriceCurrency,
		DurationWeeks:        req.DurationWeeks,
		Format:               req.Format,
		HasEmployment:        req.HasEmployment,
		Level:                req.Level,
		Language:             req.Language,
		ScholarshipAvailable: req.ScholarshipAvailable,
		ApplicationDeadline:  req.ApplicationDeadline,
	}
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
	IsTrending bool   `json:"is_trending"`
}

func (h *Handler) adminCreateStack(c *gin.Context) {
	var req adminStackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	stack := &model.Stack{Name: req.Name, Popularity: req.Popularity, IsTrending: req.IsTrending}
	if err := h.Services.Stacks.Create(c.Request.Context(), stack); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"stack": stack})
}

func (h *Handler) adminUpdateStack(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req adminStackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Services.DB.Model(&model.Stack{}).Where("id = ?", id).Updates(map[string]interface{}{
		"name":        req.Name,
		"popularity":  req.Popularity,
		"is_trending": req.IsTrending,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var stack model.Stack
	h.Services.DB.First(&stack, id)
	c.JSON(http.StatusOK, gin.H{"stack": stack})
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

// ─── USERS ────────────────────────────────────────────────────────────────────

func (h *Handler) adminListUsers(c *gin.Context) {
	var users []struct {
		ID        uint   `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Role      string `json:"role"`
		CompanyID *uint  `json:"company_id"`
		SchoolID  *uint  `json:"school_id"`
		CreatedAt string `json:"created_at"`
	}
	h.Services.DB.Table("users").
		Select("id, first_name, last_name, email, phone, role, company_id, school_id, created_at").
		Order("created_at DESC").
		Limit(200).
		Scan(&users)
	c.JSON(http.StatusOK, gin.H{"users": users})
}

// ---- HR Contacts ----

type adminHRContactRequest struct {
	Name     string `json:"name" binding:"required"`
	Position string `json:"position"`
	Telegram string `json:"telegram"`
	LinkedIn string `json:"linkedin"`
	Note     string `json:"note"`
}

func (h *Handler) adminCreateHRContact(c *gin.Context) {
	companyID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}
	var req adminHRContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	contact := &model.HRContact{
		CompanyID: uint(companyID),
		Name:      req.Name,
		Position:  req.Position,
		Telegram:  req.Telegram,
		LinkedIn:  req.LinkedIn,
		Note:      req.Note,
	}
	if err := h.Services.DB.Create(contact).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"contact": contact})
}

func (h *Handler) adminDeleteHRContact(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.Services.DB.Delete(&model.HRContact{}, id)
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ---- HR Content ----

type adminHRContentRequest struct {
	AuthorName  string `json:"author_name" binding:"required"`
	AuthorPos   string `json:"author_pos"`
	Type        string `json:"type" binding:"required"` // article|tip|speech|video
	Title       string `json:"title" binding:"required"`
	URL         string `json:"url"`
	Description string `json:"description"`
	PublishedAt string `json:"published_at"` // RFC3339 or empty
}

func (h *Handler) adminCreateHRContent(c *gin.Context) {
	companyID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}
	var req adminHRContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	content := &model.HRContent{
		CompanyID:   uint(companyID),
		AuthorName:  req.AuthorName,
		AuthorPos:   req.AuthorPos,
		Type:        req.Type,
		Title:       req.Title,
		URL:         req.URL,
		Description: req.Description,
	}
	if req.PublishedAt != "" {
		if t, err := time.Parse(time.RFC3339, req.PublishedAt); err == nil {
			content.PublishedAt = &t
		}
	}
	if err := h.Services.DB.Create(content).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"content": content})
}

func (h *Handler) adminDeleteHRContent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.Services.DB.Delete(&model.HRContent{}, id)
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ---- Hackathons ----

type adminHackathonRequest struct {
	Title                string `json:"title" binding:"required"`
	Description          string `json:"description"`
	Organizer            string `json:"organizer"`
	Location             string `json:"location"`
	IsOnline             bool   `json:"is_online"`
	PrizePool            string `json:"prize_pool"`
	RegisterURL          string `json:"register_url"`
	WebsiteURL           string `json:"website_url"`
	TechStack            string `json:"tech_stack"`
	RegistrationDeadline string `json:"registration_deadline"`
	StartDate            string `json:"start_date"`
	EndDate              string `json:"end_date"`
	IsActive             bool   `json:"is_active"`
}

func parseOptionalTime(s string) *time.Time {
	if s == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t2, err2 := time.Parse("2006-01-02", s)
		if err2 != nil {
			return nil
		}
		return &t2
	}
	return &t
}

func (h *Handler) adminListHackathons(c *gin.Context) {
	var list []model.Hackathon
	h.Services.DB.Order("registration_deadline ASC").Find(&list)
	c.JSON(http.StatusOK, gin.H{"hackathons": list})
}

func (h *Handler) adminCreateHackathon(c *gin.Context) {
	var req adminHackathonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hack := &model.Hackathon{
		Title:                req.Title,
		Description:          req.Description,
		Organizer:            req.Organizer,
		Location:             req.Location,
		IsOnline:             req.IsOnline,
		PrizePool:            req.PrizePool,
		RegisterURL:          req.RegisterURL,
		WebsiteURL:           req.WebsiteURL,
		TechStack:            req.TechStack,
		IsActive:             req.IsActive,
		RegistrationDeadline: parseOptionalTime(req.RegistrationDeadline),
		StartDate:            parseOptionalTime(req.StartDate),
		EndDate:              parseOptionalTime(req.EndDate),
	}
	if err := h.Services.DB.Create(hack).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"hackathon": hack})
}

func (h *Handler) adminUpdateHackathon(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req adminHackathonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	upd := map[string]interface{}{
		"title": req.Title, "description": req.Description,
		"organizer": req.Organizer, "location": req.Location,
		"is_online": req.IsOnline, "prize_pool": req.PrizePool,
		"register_url": req.RegisterURL, "website_url": req.WebsiteURL,
		"tech_stack": req.TechStack, "is_active": req.IsActive,
		"registration_deadline": parseOptionalTime(req.RegistrationDeadline),
		"start_date": parseOptionalTime(req.StartDate),
		"end_date": parseOptionalTime(req.EndDate),
	}
	h.Services.DB.Model(&model.Hackathon{}).Where("id = ?", id).Updates(upd)
	var hack model.Hackathon
	h.Services.DB.First(&hack, id)
	c.JSON(http.StatusOK, gin.H{"hackathon": hack})
}

func (h *Handler) adminDeleteHackathon(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.Services.DB.Delete(&model.Hackathon{}, id)
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

// GET /admin/reviews?status=pending
func (h *Handler) adminListReviews(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")
	var reviews []model.CompanyReview
	h.Services.DB.Where("status = ?", status).Order("created_at ASC").Find(&reviews)

	// Populate author names
	for i := range reviews {
		var u struct {
			FirstName string
			LastName  string
		}
		h.Services.DB.Table("users").Select("first_name, last_name").Where("id = ?", reviews[i].UserID).Scan(&u)
		if !reviews[i].IsAnonymous && u.FirstName != "" {
			reviews[i].AuthorName = u.FirstName + " " + u.LastName
		} else {
			reviews[i].AuthorName = "Аноним"
		}
	}

	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

func (h *Handler) adminApproveReview(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.Services.DB.Model(&model.CompanyReview{}).Where("id = ?", id).Update("status", "approved")
	c.JSON(http.StatusOK, gin.H{"status": "approved"})
}

func (h *Handler) adminRejectReview(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	h.Services.DB.Model(&model.CompanyReview{}).Where("id = ?", id).Update("status", "rejected")
	c.JSON(http.StatusOK, gin.H{"status": "rejected"})
}

// ─── OWNER REQUESTS ──────────────────────────────────────────────────────────

func (h *Handler) adminListOwnerRequests(c *gin.Context) {
	status := c.DefaultQuery("status", "pending")
	var requests []model.OwnerRequest
	h.Services.DB.Where("status = ?", status).Order("created_at ASC").Find(&requests)

	// Populate user and entity names
	for i := range requests {
		var u struct {
			Email     string
			FirstName string
			LastName  string
		}
		h.Services.DB.Table("users").Select("email, first_name, last_name").Where("id = ?", requests[i].UserID).Scan(&u)
		requests[i].UserEmail = u.Email
		requests[i].UserName = u.FirstName + " " + u.LastName

		switch requests[i].EntityType {
		case "company":
			var name string
			h.Services.DB.Table("companies").Select("name").Where("id = ?", requests[i].EntityID).Scan(&name)
			requests[i].EntityName = name
		case "school":
			var name string
			h.Services.DB.Table("schools").Select("name").Where("id = ?", requests[i].EntityID).Scan(&name)
			requests[i].EntityName = name
		}
	}

	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

func (h *Handler) adminApproveOwnerRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req model.OwnerRequest
	if err := h.Services.DB.First(&req, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
		return
	}
	if req.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "request already processed"})
		return
	}

	// Update request status
	h.Services.DB.Model(&req).Update("status", "approved")

	// Assign role and entity to user
	updates := map[string]interface{}{}
	switch req.EntityType {
	case "company":
		updates["role"] = "company_owner"
		updates["company_id"] = req.EntityID
	case "school":
		updates["role"] = "school_owner"
		updates["school_id"] = req.EntityID
	case "partner":
		updates["role"] = "partner"
	}
	h.Services.DB.Model(&model.User{}).Where("id = ?", req.UserID).Updates(updates)

	c.JSON(http.StatusOK, gin.H{"status": "approved"})
}

func (h *Handler) adminRejectOwnerRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input struct {
		Notes string `json:"notes"`
	}
	c.ShouldBindJSON(&input)

	result := h.Services.DB.Model(&model.OwnerRequest{}).Where("id = ? AND status = 'pending'", id).Updates(map[string]interface{}{
		"status":      "rejected",
		"admin_notes": input.Notes,
	})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found or already processed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "rejected"})
}

// ─── USER ROLE MANAGEMENT ───────────────────────────────────────────────────

type setRoleRequest struct {
	Role      string `json:"role" binding:"required"`
	CompanyID *uint  `json:"company_id"`
	SchoolID  *uint  `json:"school_id"`
}

func (h *Handler) adminSetUserRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req setRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validRoles := map[string]bool{"user": true, "company_owner": true, "school_owner": true, "partner": true, "admin": true}
	if !validRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}

	updates := map[string]interface{}{"role": req.Role}
	if req.CompanyID != nil {
		updates["company_id"] = *req.CompanyID
	}
	if req.SchoolID != nil {
		updates["school_id"] = *req.SchoolID
	}

	result := h.Services.DB.Model(&model.User{}).Where("id = ?", id).Updates(updates)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "role updated"})
}
