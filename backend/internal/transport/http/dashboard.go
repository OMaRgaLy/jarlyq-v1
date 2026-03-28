package http

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/middleware"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func newDashboardRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	authMw := middleware.JWTAuth(jwt)
	group.Use(authMw, middleware.AuditLog(handler.Services.DB))

	// Owner requests — any authenticated user can submit
	group.POST("/owner-requests", handler.createOwnerRequest)
	group.GET("/owner-requests/mine", handler.myOwnerRequests)

	// Company owner dashboard
	companyGroup := group.Group("/company")
	companyGroup.Use(middleware.RequireRole("company_owner"))
	{
		companyGroup.GET("", handler.dashboardGetCompany)
		companyGroup.PUT("", handler.dashboardUpdateCompany)
		companyGroup.POST("/opportunities", handler.dashboardCreateOpportunity)
		companyGroup.PUT("/opportunities/:id", handler.dashboardUpdateOpportunity)
		companyGroup.DELETE("/opportunities/:id", handler.dashboardDeleteOpportunity)
		companyGroup.POST("/hr-contacts", handler.dashboardCreateHRContact)
		companyGroup.DELETE("/hr-contacts/:id", handler.dashboardDeleteHRContact)
	}

	// School owner dashboard
	schoolGroup := group.Group("/school")
	schoolGroup.Use(middleware.RequireRole("school_owner"))
	{
		schoolGroup.GET("", handler.dashboardGetSchool)
		schoolGroup.PUT("", handler.dashboardUpdateSchool)
		schoolGroup.POST("/courses", handler.dashboardCreateCourse)
		schoolGroup.PUT("/courses/:id", handler.dashboardUpdateCourse)
		schoolGroup.DELETE("/courses/:id", handler.dashboardDeleteCourse)
	}
}

// ─── OWNER REQUESTS ──────────────────────────────────────────────────────────

type ownerRequestInput struct {
	EntityType string `json:"entity_type" binding:"required"` // "company", "school", "partner"
	EntityID   uint   `json:"entity_id" binding:"required"`
	Message    string `json:"message"`
}

func (h *Handler) createOwnerRequest(c *gin.Context) {
	userID := c.GetUint("user_id")
	var req ownerRequestInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.EntityType != "company" && req.EntityType != "school" && req.EntityType != "partner" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "entity_type must be company, school, or partner"})
		return
	}

	// Verify entity exists
	switch req.EntityType {
	case "company":
		var count int64
		h.Services.DB.Model(&model.Company{}).Where("id = ?", req.EntityID).Count(&count)
		if count == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
			return
		}
	case "school":
		var count int64
		h.Services.DB.Model(&model.School{}).Where("id = ?", req.EntityID).Count(&count)
		if count == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "school not found"})
			return
		}
	}

	// Check for duplicate pending request
	var existing int64
	h.Services.DB.Model(&model.OwnerRequest{}).
		Where("user_id = ? AND entity_type = ? AND entity_id = ? AND status = 'pending'", userID, req.EntityType, req.EntityID).
		Count(&existing)
	if existing > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "you already have a pending request for this entity"})
		return
	}

	or := &model.OwnerRequest{
		UserID:     userID,
		EntityType: req.EntityType,
		EntityID:   req.EntityID,
		Message:    req.Message,
		Status:     "pending",
	}
	if err := h.Services.DB.Create(or).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"request": or})
}

func (h *Handler) myOwnerRequests(c *gin.Context) {
	userID := c.GetUint("user_id")
	var requests []model.OwnerRequest
	h.Services.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&requests)
	c.JSON(http.StatusOK, gin.H{"requests": requests})
}

// ─── COMPANY OWNER DASHBOARD ────────────────────────────────────────────────

func (h *Handler) getOwnerCompanyID(c *gin.Context) (uint, bool) {
	userID := c.GetUint("user_id")
	var user model.User
	if err := h.Services.DB.Select("id, role, company_id").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return 0, false
	}
	if user.CompanyID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "no company assigned to your account"})
		return 0, false
	}
	return *user.CompanyID, true
}

func (h *Handler) dashboardGetCompany(c *gin.Context) {
	companyID, ok := h.getOwnerCompanyID(c)
	if !ok {
		return
	}
	company, err := h.Services.Companies.Get(c.Request.Context(), companyID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"company": company})
}

func (h *Handler) dashboardUpdateCompany(c *gin.Context) {
	companyID, ok := h.getOwnerCompanyID(c)
	if !ok {
		return
	}
	company, err := h.Services.Companies.Get(c.Request.Context(), companyID)
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

func (h *Handler) dashboardCreateOpportunity(c *gin.Context) {
	companyID, ok := h.getOwnerCompanyID(c)
	if !ok {
		return
	}
	var req adminOpportunityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	opp := model.Opportunity{
		CompanyID:      companyID,
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
		IsYearRound:    req.IsYearRound,
		IsVerified:     req.IsVerified,
		Source:         req.Source,
	}
	if req.Deadline != nil {
		if t, err := time.Parse("2006-01-02", *req.Deadline); err == nil {
			opp.Deadline = &t
		}
	}
	if err := h.Services.DB.Create(&opp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"opportunity": opp})
}

func (h *Handler) dashboardUpdateOpportunity(c *gin.Context) {
	companyID, ok := h.getOwnerCompanyID(c)
	if !ok {
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	// Verify opportunity belongs to this company
	var opp model.Opportunity
	if err := h.Services.DB.Where("id = ? AND company_id = ?", id, companyID).First(&opp).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "opportunity not found"})
		return
	}
	var req adminOpportunityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	opp.Type = req.Type
	opp.Title = req.Title
	opp.Description = req.Description
	opp.Requirements = req.Requirements
	opp.ApplyURL = req.ApplyURL
	opp.Level = req.Level
	opp.SalaryMin = req.SalaryMin
	opp.SalaryMax = req.SalaryMax
	opp.SalaryCurrency = req.SalaryCurrency
	opp.WorkFormat = req.WorkFormat
	opp.City = req.City
	opp.IsYearRound = req.IsYearRound
	opp.IsVerified = req.IsVerified
	opp.Source = req.Source
	if req.Deadline != nil {
		if t, err := time.Parse("2006-01-02", *req.Deadline); err == nil {
			opp.Deadline = &t
		}
	} else {
		opp.Deadline = nil
	}
	if err := h.Services.DB.Save(&opp).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"opportunity": opp})
}

func (h *Handler) dashboardDeleteOpportunity(c *gin.Context) {
	companyID, ok := h.getOwnerCompanyID(c)
	if !ok {
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	result := h.Services.DB.Where("id = ? AND company_id = ?", id, companyID).Delete(&model.Opportunity{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "opportunity not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (h *Handler) dashboardCreateHRContact(c *gin.Context) {
	companyID, ok := h.getOwnerCompanyID(c)
	if !ok {
		return
	}
	var req adminHRContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	contact := &model.HRContact{
		CompanyID: companyID,
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

func (h *Handler) dashboardDeleteHRContact(c *gin.Context) {
	companyID, ok := h.getOwnerCompanyID(c)
	if !ok {
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	result := h.Services.DB.Where("id = ? AND company_id = ?", id, companyID).Delete(&model.HRContact{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "contact not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

// ─── SCHOOL OWNER DASHBOARD ─────────────────────────────────────────────────

func (h *Handler) getOwnerSchoolID(c *gin.Context) (uint, bool) {
	userID := c.GetUint("user_id")
	var user model.User
	if err := h.Services.DB.Select("id, role, school_id").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return 0, false
	}
	if user.SchoolID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "no school assigned to your account"})
		return 0, false
	}
	return *user.SchoolID, true
}

func (h *Handler) dashboardGetSchool(c *gin.Context) {
	schoolID, ok := h.getOwnerSchoolID(c)
	if !ok {
		return
	}
	school, err := h.Services.Education.GetSchool(c.Request.Context(), schoolID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "school not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"school": school})
}

func (h *Handler) dashboardUpdateSchool(c *gin.Context) {
	schoolID, ok := h.getOwnerSchoolID(c)
	if !ok {
		return
	}
	school, err := h.Services.Education.GetSchool(c.Request.Context(), schoolID)
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

func (h *Handler) dashboardCreateCourse(c *gin.Context) {
	schoolID, ok := h.getOwnerSchoolID(c)
	if !ok {
		return
	}
	var req adminCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	course := model.Course{
		SchoolID:             schoolID,
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

func (h *Handler) dashboardUpdateCourse(c *gin.Context) {
	schoolID, ok := h.getOwnerSchoolID(c)
	if !ok {
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var existing model.Course
	if err := h.Services.DB.Where("id = ? AND school_id = ?", id, schoolID).First(&existing).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "course not found"})
		return
	}
	var req adminCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updates := model.Course{
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
	if err := h.Services.DB.Model(&existing).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"course": existing})
}

func (h *Handler) dashboardDeleteCourse(c *gin.Context) {
	schoolID, ok := h.getOwnerSchoolID(c)
	if !ok {
		return
	}
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	result := h.Services.DB.Where("id = ? AND school_id = ?", id, schoolID).Delete(&model.Course{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "course not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}
