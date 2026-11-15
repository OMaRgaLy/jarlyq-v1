package http

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/middleware"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// ─── Premium helpers ──────────────────────────────────────────────────────────

// viewerIsPremium reports whether the caller (set by JWTAuth / OptionalJWT) has
// an active Premium subscription. Admins always count as Premium.
func (h *Handler) viewerIsPremium(c *gin.Context) bool {
	uid := c.GetUint("user_id")
	if uid == 0 {
		return false
	}
	var u model.User
	if err := h.Services.DB.Select("id", "role", "premium_until").First(&u, uid).Error; err != nil {
		return false
	}
	return u.Role == "admin" || u.IsPremium()
}

// oppLockedFor reports whether the opportunity is still in its Premium-only window.
func oppLockedFor(opp *model.Opportunity, premium bool) bool {
	return !premium && opp.PremiumUntil != nil && opp.PremiumUntil.After(time.Now())
}

// ─── Tracker routes ───────────────────────────────────────────────────────────

func newTrackerRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	group.Use(middleware.JWTAuth(jwt))
	group.GET("", handler.listTracker)
	group.PUT("/:opportunity_id", handler.upsertTracker)
	group.DELETE("/:opportunity_id", handler.deleteTracker)
}

type trackerItem struct {
	ID             uint       `json:"id"`
	OpportunityID  uint       `json:"opportunityId"`
	Status         string     `json:"status"`
	Note           string     `json:"note"`
	AppliedAt      *time.Time `json:"appliedAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	Title          string     `json:"title"`
	Type           string     `json:"type"`
	Deadline       *time.Time `json:"deadline,omitempty"`
	IsYearRound    bool       `json:"isYearRound"`
	ApplyURL       string     `json:"applyURL,omitempty"`
	City           string     `json:"city,omitempty"`
	WorkFormat     string     `json:"workFormat,omitempty"`
	IsActive       bool       `json:"isActive"`
	CompanyID      uint       `json:"companyId"`
	CompanyName    string     `json:"companyName"`
	CompanyLogoURL string     `json:"companyLogoURL"`
}

// GET /tracker — the caller's applications with opportunity + company info.
func (h *Handler) listTracker(c *gin.Context) {
	userID := c.GetUint("user_id")
	var items []trackerItem
	err := h.Services.DB.Raw(`
		SELECT ua.id, ua.opportunity_id, ua.status, ua.note, ua.applied_at, ua.created_at, ua.updated_at,
		       o.title, o.type, o.deadline, o.is_year_round, o.apply_url, o.city, o.work_format, o.is_active,
		       c.id AS company_id, c.name AS company_name, c.logo_url AS company_logo_url
		FROM user_applications ua
		JOIN opportunities o ON o.id = ua.opportunity_id
		LEFT JOIN companies c ON c.id = o.company_id
		WHERE ua.user_id = ?
		ORDER BY (o.deadline IS NULL), o.deadline ASC, ua.updated_at DESC
		LIMIT 500`, userID).Scan(&items).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load tracker"})
		return
	}
	for i := range items {
		items[i].ApplyURL = safeURL(items[i].ApplyURL)
	}
	if items == nil {
		items = []trackerItem{}
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

type trackerUpsertRequest struct {
	Status *string `json:"status"`
	Note   *string `json:"note"`
}

// PUT /tracker/:opportunity_id — create or update a tracker row.
func (h *Handler) upsertTracker(c *gin.Context) {
	userID := c.GetUint("user_id")
	oppID, err := strconv.ParseUint(c.Param("opportunity_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid opportunity id"})
		return
	}
	var req trackerUpsertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	if req.Status != nil && !model.ValidAppStatus(*req.Status) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		return
	}
	if req.Note != nil && len([]rune(*req.Note)) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "note too long (max 1000)"})
		return
	}

	var opp model.Opportunity
	if err := h.Services.DB.Where("is_active = ?", true).First(&opp, oppID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "opportunity not found"})
		return
	}
	if oppLockedFor(&opp, h.viewerIsPremium(c)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "premium_required"})
		return
	}

	app, err := h.saveApplication(userID, uint(oppID), req.Status, req.Note)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"application": app})
}

// saveApplication creates the row (status defaults to "saved") or updates it.
func (h *Handler) saveApplication(userID, oppID uint, status, note *string) (*model.UserApplication, error) {
	var app model.UserApplication
	err := h.Services.DB.Where("user_id = ? AND opportunity_id = ?", userID, oppID).First(&app).Error
	if err != nil {
		if err != gorm.ErrRecordNotFound {
			return nil, err
		}
		app = model.UserApplication{UserID: userID, OpportunityID: oppID, Status: model.AppStatusSaved}
	}
	if status != nil {
		app.Status = *status
	}
	if note != nil {
		app.Note = strings.TrimSpace(*note)
	}
	if app.Status == model.AppStatusApplied && app.AppliedAt == nil {
		now := time.Now()
		app.AppliedAt = &now
	}
	// Upsert keeps this race-safe when two tabs save at once.
	if err := h.Services.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "opportunity_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"status", "note", "applied_at", "updated_at"}),
	}).Save(&app).Error; err != nil {
		return nil, err
	}
	return &app, nil
}

// DELETE /tracker/:opportunity_id
func (h *Handler) deleteTracker(c *gin.Context) {
	userID := c.GetUint("user_id")
	oppID, err := strconv.ParseUint(c.Param("opportunity_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid opportunity id"})
		return
	}
	h.Services.DB.Where("user_id = ? AND opportunity_id = ?", userID, oppID).Delete(&model.UserApplication{})
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ─── Apply click ──────────────────────────────────────────────────────────────

// POST /internships/:id/apply — counts the click (a lead for the company) and,
// for signed-in users, moves the tracker row to "applied". Returns the sanitized
// apply URL so the browser can open it.
func (h *Handler) applyToOpportunity(c *gin.Context) {
	oppID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var opp model.Opportunity
	if err := h.Services.DB.Where("is_active = ?", true).First(&opp, oppID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "opportunity not found"})
		return
	}
	if oppLockedFor(&opp, h.viewerIsPremium(c)) {
		c.JSON(http.StatusForbidden, gin.H{"error": "premium_required"})
		return
	}

	h.Services.DB.Model(&model.Opportunity{}).Where("id = ?", opp.ID).
		UpdateColumn("apply_clicks", gorm.Expr("apply_clicks + 1"))

	tracked := false
	if uid := c.GetUint("user_id"); uid != 0 {
		var existing model.UserApplication
		err := h.Services.DB.Where("user_id = ? AND opportunity_id = ?", uid, opp.ID).First(&existing).Error
		// Never downgrade a later stage (interview/offer) back to "applied".
		if err == gorm.ErrRecordNotFound || (err == nil && existing.Status == model.AppStatusSaved) {
			applied := model.AppStatusApplied
			if _, serr := h.saveApplication(uid, opp.ID, &applied, nil); serr == nil {
				tracked = true
			}
		} else if err == nil {
			tracked = true
		}
	}

	url := safeURL(opp.ApplyURL)
	if url == "" {
		url = safeURL(opp.SourceURL)
	}
	c.JSON(http.StatusOK, gin.H{"applyURL": url, "tracked": tracked})
}
