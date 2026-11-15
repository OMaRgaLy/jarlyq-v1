package http

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/middleware"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func newInternshipRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	// OptionalJWT: public pages work for everyone, but Premium users also see
	// postings that are still inside their early-access window.
	group.Use(middleware.OptionalJWT(jwt))
	group.GET("", handler.listInternships)
	group.GET("/:id", handler.getInternship)
	group.POST("/:id/apply", handler.applyToOpportunity)
}

type internshipItem struct {
	model.Opportunity
	CompanyName    string   `json:"companyName"`
	CompanyLogoURL string   `json:"companyLogoURL"`
	CompanyID      uint     `json:"companyId"`
	Stacks         []string `json:"stacks" gorm:"-"`
}

// parseIDList turns "1,2,3" into []uint, ignoring junk.
func parseIDList(s string) []uint {
	var out []uint
	for _, part := range strings.Split(s, ",") {
		if n, err := strconv.ParseUint(strings.TrimSpace(part), 10, 64); err == nil && n > 0 {
			out = append(out, uint(n))
		}
	}
	return out
}

// attachStacks fills item.Stacks with technology names. A posting needs a stack
// when it is tagged directly or its company lists it.
func (h *Handler) attachStacks(items []internshipItem) {
	if len(items) == 0 {
		return
	}
	ids := make([]uint, len(items))
	for i, it := range items {
		ids[i] = it.ID
	}
	type pair struct {
		OppID uint
		Name  string
	}
	var pairs []pair
	h.Services.DB.Raw(`
		SELECT p.opp_id, s.name
		FROM (
			SELECT opportunity_id AS opp_id, stack_id FROM opportunity_stacks WHERE opportunity_id IN ?
			UNION
			SELECT o.id AS opp_id, cs.stack_id FROM opportunities o
			JOIN company_stacks cs ON cs.company_id = o.company_id WHERE o.id IN ?
		) p JOIN stacks s ON s.id = p.stack_id
		ORDER BY s.popularity DESC, s.name`, ids, ids).Scan(&pairs)
	byOpp := map[uint][]string{}
	for _, p := range pairs {
		byOpp[p.OppID] = append(byOpp[p.OppID], p.Name)
	}
	for i := range items {
		items[i].Stacks = byOpp[items[i].ID]
		if items[i].Stacks == nil {
			items[i].Stacks = []string{}
		}
	}
}

// listInternships returns live postings (internships by default) with company info.
// Filters: ?type=internship|vacancy|all  ?q=text  ?city=  ?country=KZ,UZ  ?work_format=
//
//	?stack_id=1 | ?stack_ids=1,2  ?for_me=true (match my preferred stacks)
//	?is_year_round=true  ?is_paid=true  ?education_level=  ?career_switchers=true
//	?schoolkids=true  ?include_expired=true  ?sort=deadline|new
func (h *Handler) listInternships(c *gin.Context) {
	premium := h.viewerIsPremium(c)

	typ := c.DefaultQuery("type", "internship")
	db := h.Services.DB.
		Table("opportunities").
		Select("opportunities.*, companies.name as company_name, companies.logo_url as company_logo_url, companies.id as company_id").
		Joins("LEFT JOIN companies ON companies.id = opportunities.company_id").
		Where("opportunities.is_active = ? AND (companies.id IS NULL OR companies.is_active = ?)", true, true)
	if typ == "internship" || typ == "vacancy" {
		db = db.Where("opportunities.type = ?", typ)
	}

	if c.Query("include_expired") != "true" {
		db = db.Where("(opportunities.deadline IS NULL OR opportunities.deadline >= CURRENT_DATE OR opportunities.is_year_round = ?)", true)
	}

	// Premium early access: free visitors do not see postings still in their window.
	var locked int64
	if !premium {
		db = db.Where("(opportunities.premium_until IS NULL OR opportunities.premium_until <= ?)", time.Now())
		lockedQ := h.Services.DB.Table("opportunities").
			Where("opportunities.is_active = ? AND opportunities.premium_until > ?", true, time.Now())
		if typ == "internship" || typ == "vacancy" {
			lockedQ = lockedQ.Where("opportunities.type = ?", typ)
		}
		lockedQ.Count(&locked)
	}

	if q := strings.TrimSpace(c.Query("q")); q != "" {
		like := "%" + strings.ToLower(q) + "%"
		db = db.Where("(LOWER(opportunities.title) LIKE ? OR LOWER(companies.name) LIKE ? OR LOWER(opportunities.city) LIKE ?)", like, like, like)
	}
	if city := strings.TrimSpace(c.Query("city")); city != "" {
		db = db.Where("LOWER(opportunities.city) LIKE ?", "%"+strings.ToLower(city)+"%")
	}
	if cs := strings.TrimSpace(c.Query("country")); cs != "" {
		var list []string
		for _, part := range strings.Split(cs, ",") {
			if p := strings.ToUpper(strings.TrimSpace(part)); len(p) == 2 {
				list = append(list, p)
			}
		}
		if len(list) > 0 {
			db = db.Where("COALESCE(NULLIF(opportunities.country, ''), companies.country, '') IN ?", list)
		}
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

	stackIDs := parseIDList(c.Query("stack_ids"))
	if id := parseIDList(c.Query("stack_id")); len(id) > 0 {
		stackIDs = append(stackIDs, id...)
	}
	if c.Query("for_me") == "true" {
		if uid := c.GetUint("user_id"); uid != 0 {
			var mine []uint
			h.Services.DB.Table("user_preferred_stacks").Where("user_id = ?", uid).Pluck("stack_id", &mine)
			stackIDs = append(stackIDs, mine...)
		}
	}
	if len(stackIDs) > 0 {
		db = db.Where(`(EXISTS (SELECT 1 FROM opportunity_stacks os WHERE os.opportunity_id = opportunities.id AND os.stack_id IN ?)
			OR EXISTS (SELECT 1 FROM company_stacks cs WHERE cs.company_id = opportunities.company_id AND cs.stack_id IN ?))`,
			stackIDs, stackIDs)
	}

	if el := c.Query("education_level"); el != "" {
		// "none" or "schoolkid" → only exact match; otherwise filter ≤ requested level
		switch el {
		case "none":
			db = db.Where("opportunities.education_level = ?", "none")
		case "schoolkid":
			db = db.Where("opportunities.suitable_for_schoolkids = ? OR opportunities.education_level IN ?", true, []string{"none", "schoolkid"})
		default:
			// Return everything that asks for ≤ the requested level
			order := map[string]int{"any": 99, "bachelor": 3, "student_3_4": 2, "student_1_2": 1, "schoolkid": 0, "none": -1}
			max := order[el]
			var allowed []string
			for lvl, rank := range order {
				if rank <= max {
					allowed = append(allowed, lvl)
				}
			}
			db = db.Where("opportunities.education_level IN ?", allowed)
		}
	}
	if c.Query("career_switchers") == "true" {
		db = db.Where("opportunities.accepts_career_switchers = ?", true)
	}
	if c.Query("schoolkids") == "true" {
		db = db.Where("opportunities.suitable_for_schoolkids = ?", true)
	}

	if c.Query("sort") == "new" {
		db = db.Order("opportunities.created_at DESC")
	} else {
		// Closest deadline first; year-round / undated postings go last.
		db = db.Order("(opportunities.deadline IS NULL) ASC, opportunities.deadline ASC, opportunities.created_at DESC")
	}

	var results []internshipItem
	if err := db.Limit(500).Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load internships"})
		return
	}
	h.attachStacks(results)
	for i := range results {
		results[i].ApplyURL = safeURL(results[i].ApplyURL)
	}
	if results == nil {
		results = []internshipItem{}
	}

	c.JSON(http.StatusOK, gin.H{"internships": results, "premiumLocked": locked, "isPremium": premium})
}

func (h *Handler) getInternship(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var result internshipItem
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

	if oppLockedFor(&result.Opportunity, h.viewerIsPremium(c)) {
		// Teaser only: enough to explain what Premium unlocks, nothing actionable.
		c.JSON(http.StatusForbidden, gin.H{
			"error":          "premium_required",
			"title":          result.Title,
			"companyName":    result.CompanyName,
			"companyLogoURL": result.CompanyLogoURL,
			"premiumUntil":   result.PremiumUntil,
		})
		return
	}

	items := []internshipItem{result}
	h.attachStacks(items)
	items[0].ApplyURL = safeURL(items[0].ApplyURL)
	c.JSON(http.StatusOK, gin.H{"internship": items[0], "opportunity": items[0]})
}
