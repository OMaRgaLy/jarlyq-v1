package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type leadRow struct {
	OpportunityID uint   `json:"opportunityId"`
	Title         string `json:"title"`
	Type          string `json:"type"`
	ApplyClicks   int    `json:"applyClicks"` // clicks on "Apply" (everyone, signed in or not)
	Saved         int    `json:"saved"`       // people who keep it in their tracker
}

// GET /dashboard/company/leads — what the platform delivered to the owner's company:
// clicks on "Apply" and how many students saved each posting. This is the number a
// company pays attention to, so it is shown on the owner dashboard.
func (h *Handler) dashboardCompanyLeads(c *gin.Context) {
	companyID, ok := h.getOwnerCompanyID(c)
	if !ok {
		return
	}
	var rows []leadRow
	if err := h.Services.DB.Raw(`
		SELECT o.id AS opportunity_id, o.title, o.type, o.apply_clicks,
		       (SELECT COUNT(*) FROM user_applications ua WHERE ua.opportunity_id = o.id) AS saved
		FROM opportunities o
		WHERE o.company_id = ? AND o.is_active = true
		ORDER BY o.apply_clicks DESC, o.created_at DESC`, companyID).Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load leads"})
		return
	}
	totalClicks, totalSaved := 0, 0
	for _, r := range rows {
		totalClicks += r.ApplyClicks
		totalSaved += r.Saved
	}
	if rows == nil {
		rows = []leadRow{}
	}
	c.JSON(http.StatusOK, gin.H{"leads": rows, "totalClicks": totalClicks, "totalSaved": totalSaved})
}
