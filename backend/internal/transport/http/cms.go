package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// ─── helpers ──────────────────────────────────────────────────────────────────

func parseUintParam(c *gin.Context, name string) (uint, bool) {
	v, err := strconv.ParseUint(c.Param(name), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid " + name})
		return 0, false
	}
	return uint(v), true
}

func parseUintQuery(c *gin.Context, name string) (uint, bool) {
	v, err := strconv.ParseUint(c.Query(name), 10, 64)
	if err != nil {
		return 0, false
	}
	return uint(v), true
}

// ─── adminGetCompany ──────────────────────────────────────────────────────────
// GET /admin/companies/:id
// Returns a single company with all relations for the tabbed editor.

func (h *Handler) adminGetCompany(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var company model.Company
	if err := h.Services.DB.
		Preload("Stack").
		Preload("Opportunities").
		Preload("Offices").
		Preload("Photos").
		Preload("Showcase").
		Preload("HRContacts").
		Preload("HRContent").
		First(&company, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "company not found"})
		return
	}

	// Load badges
	var badges []model.EntityBadge
	h.Services.DB.Where("entity_type = ? AND entity_id = ?", "company", id).
		Order("sort_order").Find(&badges)

	// Load theme
	var theme model.EntityTheme
	h.Services.DB.Where("entity_type = ? AND entity_id = ?", "company", id).
		First(&theme)

	c.JSON(http.StatusOK, gin.H{
		"company": company,
		"badges":  badges,
		"theme":   theme,
	})
}

// ─── SHOWCASE ─────────────────────────────────────────────────────────────────

type showcaseRequest struct {
	Type        string `json:"type" binding:"required"` // internship|event|vacancy|news
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
	LinkURL     string `json:"link_url"`
	SortOrder   int    `json:"sort_order"`
}

func (h *Handler) adminCreateShowcase(c *gin.Context) {
	companyID, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req showcaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	safeURLs(&req.ImageURL, &req.LinkURL)
	item := model.CompanyShowcase{
		CompanyID:   companyID,
		Type:        req.Type,
		Title:       req.Title,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		LinkURL:     req.LinkURL,
		SortOrder:   req.SortOrder,
	}
	if err := h.Services.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create showcase item"})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *Handler) adminUpdateShowcase(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req showcaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Services.DB.Model(&model.CompanyShowcase{}).Where("id = ?", id).Updates(map[string]any{
		"type": req.Type, "title": req.Title, "description": req.Description,
		"image_url": req.ImageURL, "link_url": req.LinkURL, "sort_order": req.SortOrder,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update showcase item"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) adminDeleteShowcase(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	h.Services.DB.Delete(&model.CompanyShowcase{}, id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ─── PHOTOS ───────────────────────────────────────────────────────────────────

type photoRequest struct {
	URL       string `json:"url" binding:"required"`
	Caption   string `json:"caption"`
	SortOrder int    `json:"sort_order"`
}

func (h *Handler) adminCreatePhoto(c *gin.Context) {
	companyID, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req photoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.URL = safeURL(req.URL)
	if req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid photo url"})
		return
	}
	photo := model.CompanyPhoto{
		CompanyID: companyID,
		URL:       req.URL,
		Caption:   req.Caption,
		SortOrder: req.SortOrder,
	}
	if err := h.Services.DB.Create(&photo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create photo"})
		return
	}
	c.JSON(http.StatusCreated, photo)
}

func (h *Handler) adminUpdatePhoto(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req photoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.Services.DB.Model(&model.CompanyPhoto{}).Where("id = ?", id).Updates(map[string]any{
		"url": req.URL, "caption": req.Caption, "sort_order": req.SortOrder,
	})
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) adminDeletePhoto(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	h.Services.DB.Delete(&model.CompanyPhoto{}, id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ─── OFFICES ──────────────────────────────────────────────────────────────────

type officeRequest struct {
	City    string `json:"city" binding:"required"`
	Country string `json:"country" binding:"required"`
	Address string `json:"address"`
	IsHQ    bool   `json:"is_hq"`
}

func (h *Handler) adminCreateOffice(c *gin.Context) {
	companyID, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req officeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	office := model.CompanyOffice{
		CompanyID: companyID,
		City:      req.City,
		Country:   req.Country,
		Address:   req.Address,
		IsHQ:      req.IsHQ,
	}
	if err := h.Services.DB.Create(&office).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create office"})
		return
	}
	c.JSON(http.StatusCreated, office)
}

func (h *Handler) adminUpdateOffice(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req officeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.Services.DB.Model(&model.CompanyOffice{}).Where("id = ?", id).Updates(map[string]any{
		"city": req.City, "country": req.Country, "address": req.Address, "is_hq": req.IsHQ,
	})
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) adminDeleteOffice(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	h.Services.DB.Delete(&model.CompanyOffice{}, id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ─── HR CONTACTS (UPDATE — create/delete already in admin.go) ─────────────────

type hrContactUpdateRequest struct {
	Name     string `json:"name"`
	Position string `json:"position"`
	Telegram string `json:"telegram"`
	LinkedIn string `json:"linkedin"`
	Note     string `json:"note"`
}

func (h *Handler) adminUpdateHRContact(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req hrContactUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Services.DB.Model(&model.HRContact{}).Where("id = ?", id).Updates(map[string]any{
		"name": req.Name, "position": req.Position, "telegram": req.Telegram,
		"linkedin": req.LinkedIn, "note": req.Note,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update HR contact"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ─── BADGES ───────────────────────────────────────────────────────────────────

type badgeRequest struct {
	EntityType string `json:"entity_type" binding:"required"` // company|school
	EntityID   uint   `json:"entity_id" binding:"required"`
	Icon       string `json:"icon" binding:"required"`
	Label      string `json:"label" binding:"required"`
	ColorLight string `json:"color_light"`
	ColorDark  string `json:"color_dark"`
	SortOrder  int    `json:"sort_order"`
}

// GET /admin/badges?entity_type=company&entity_id=1
func (h *Handler) adminListBadges(c *gin.Context) {
	entityType := c.Query("entity_type")
	entityIDStr := c.Query("entity_id")

	query := h.Services.DB.Model(&model.EntityBadge{}).Order("sort_order")
	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	if entityIDStr != "" {
		if id, err := strconv.ParseUint(entityIDStr, 10, 64); err == nil {
			query = query.Where("entity_id = ?", id)
		}
	}

	var badges []model.EntityBadge
	if err := query.Find(&badges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list badges"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"badges": badges})
}

func (h *Handler) adminCreateBadge(c *gin.Context) {
	var req badgeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Apply sane defaults for colors if not provided
	if req.ColorLight == "" {
		req.ColorLight = "#2563eb"
	}
	if req.ColorDark == "" {
		req.ColorDark = "#3b82f6"
	}
	badge := model.EntityBadge{
		EntityType: req.EntityType,
		EntityID:   req.EntityID,
		Icon:       req.Icon,
		Label:      req.Label,
		ColorLight: req.ColorLight,
		ColorDark:  req.ColorDark,
		SortOrder:  req.SortOrder,
	}
	if err := h.Services.DB.Create(&badge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create badge"})
		return
	}
	c.JSON(http.StatusCreated, badge)
}

func (h *Handler) adminUpdateBadge(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req badgeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.Services.DB.Model(&model.EntityBadge{}).Where("id = ?", id).Updates(map[string]any{
		"icon": req.Icon, "label": req.Label,
		"color_light": req.ColorLight, "color_dark": req.ColorDark,
		"sort_order": req.SortOrder,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update badge"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) adminDeleteBadge(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	h.Services.DB.Delete(&model.EntityBadge{}, id)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ─── THEMES ───────────────────────────────────────────────────────────────────

type themeRequest struct {
	EntityType    string `json:"entity_type" binding:"required"` // company|school
	EntityID      uint   `json:"entity_id" binding:"required"`
	AccentLight   string `json:"accent_light"`
	AccentDark    string `json:"accent_dark"`
	CoverGradient string `json:"cover_gradient"` // none|top|overlay|blur
}

// PUT /admin/themes — create or update (upsert)
func (h *Handler) adminUpsertTheme(c *gin.Context) {
	var req themeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.AccentLight == "" {
		req.AccentLight = "#2563eb"
	}
	if req.AccentDark == "" {
		req.AccentDark = "#3b82f6"
	}
	if req.CoverGradient == "" {
		req.CoverGradient = "none"
	}

	theme := model.EntityTheme{
		EntityType:    req.EntityType,
		EntityID:      req.EntityID,
		AccentLight:   req.AccentLight,
		AccentDark:    req.AccentDark,
		CoverGradient: req.CoverGradient,
	}
	// Upsert: update if exists, create if not
	result := h.Services.DB.
		Where("entity_type = ? AND entity_id = ?", req.EntityType, req.EntityID).
		Assign(model.EntityTheme{
			AccentLight:   req.AccentLight,
			AccentDark:    req.AccentDark,
			CoverGradient: req.CoverGradient,
		}).
		FirstOrCreate(&theme)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save theme"})
		return
	}
	// If record existed, update it
	if result.RowsAffected == 0 {
		h.Services.DB.Model(&theme).Updates(map[string]any{
			"accent_light":   req.AccentLight,
			"accent_dark":    req.AccentDark,
			"cover_gradient": req.CoverGradient,
		})
	}
	c.JSON(http.StatusOK, theme)
}

// GET /admin/themes?entity_type=company&entity_id=1
func (h *Handler) adminGetTheme(c *gin.Context) {
	entityType := c.Query("entity_type")
	entityIDStr := c.Query("entity_id")
	if entityType == "" || entityIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "entity_type and entity_id required"})
		return
	}
	entityID, err := strconv.ParseUint(entityIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_id"})
		return
	}
	var theme model.EntityTheme
	if err := h.Services.DB.
		Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		First(&theme).Error; err != nil {
		// Return empty defaults — not an error
		c.JSON(http.StatusOK, gin.H{
			"entityType":    entityType,
			"entityId":      entityID,
			"accentLight":   "#2563eb",
			"accentDark":    "#3b82f6",
			"coverGradient": "none",
		})
		return
	}
	c.JSON(http.StatusOK, theme)
}

// ─── adminGetSchool ───────────────────────────────────────────────────────────
// GET /admin/schools/:id

func (h *Handler) adminGetSchool(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var school model.School
	if err := h.Services.DB.Preload("Courses").First(&school, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "school not found"})
		return
	}
	var badges []model.EntityBadge
	h.Services.DB.Where("entity_type = ? AND entity_id = ?", "school", id).
		Order("sort_order").Find(&badges)
	var theme model.EntityTheme
	h.Services.DB.Where("entity_type = ? AND entity_id = ?", "school", id).First(&theme)
	c.JSON(http.StatusOK, gin.H{"school": school, "badges": badges, "theme": theme})
}

// ─── adminUpdateSchoolFull ────────────────────────────────────────────────────
// PUT /admin/schools/:id/full

type schoolFullRequest struct {
	Name          string `json:"name"`
	Type          string `json:"type"`
	Country       string `json:"country"`
	City          string `json:"city"`
	Description   string `json:"description"`
	About         string `json:"about"`
	AgeRange      string `json:"age_range"`
	Audience      string `json:"audience"`
	LogoURL       string `json:"logo_url"`
	CoverURL      string `json:"cover_url"`
	IsStateFunded bool   `json:"is_state_funded"`
	IsVerified    bool   `json:"is_verified"`
	Website       string `json:"website"`
	Telegram      string `json:"telegram"`
	Email         string `json:"email"`
}

func (h *Handler) adminUpdateSchoolFull(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req schoolFullRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	safeURLs(&req.LogoURL, &req.CoverURL)
	if err := h.Services.DB.Model(&model.School{}).Where("id = ?", id).Updates(map[string]any{
		"name": req.Name, "type": req.Type, "country": req.Country, "city": req.City,
		"description": req.Description, "about": req.About,
		"age_range": req.AgeRange, "audience": req.Audience,
		"logo_url": req.LogoURL, "cover_url": req.CoverURL,
		"is_state_funded": req.IsStateFunded, "is_verified": req.IsVerified,
		"contact_website": req.Website, "contact_telegram": req.Telegram, "contact_email": req.Email,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update school"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
