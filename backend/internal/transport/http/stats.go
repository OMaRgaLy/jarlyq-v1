package http

import (
	"net/http"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func newStatsRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("/overview", handler.statsOverview)
	group.GET("/stacks", handler.statsStacks)
}

// Country groups for the "market" selector. A single ISO code (e.g. "KZ") also works.
var statsScopes = map[string][]string{
	"cis": {"AM", "AZ", "BY", "KZ", "KG", "MD", "RU", "TJ", "TM", "UZ"},
	"ca":  {"KZ", "KG", "TJ", "TM", "UZ"},
}

// scopeCountries resolves ?scope= into a country list. nil means "whole world".
func scopeCountries(scope string) ([]string, bool) {
	scope = strings.ToLower(strings.TrimSpace(scope))
	switch scope {
	case "", "world":
		return nil, true
	}
	if list, ok := statsScopes[scope]; ok {
		return list, true
	}
	if len(scope) == 2 {
		return []string{strings.ToUpper(scope)}, true
	}
	return nil, false
}

// "Live" = active, not past its deadline (year-round postings never expire).
// Postings still in their Premium-only window are not counted, so public numbers match what visitors can open.
const liveOppSQL = `o.is_active = true AND (o.deadline IS NULL OR o.deadline >= CURRENT_DATE OR o.is_year_round = true)
	AND (o.premium_until IS NULL OR o.premium_until <= NOW())`

// GET /stats/overview — real counters for the landing page (no invented numbers).
func (h *Handler) statsOverview(c *gin.Context) {
	var out struct {
		Companies     int64 `json:"companies"`
		Opportunities int64 `json:"opportunities"`
		Internships   int64 `json:"internships"`
		Stacks        int64 `json:"stacks"`
		Schools       int64 `json:"schools"`
	}
	db := h.Services.DB
	db.Raw(`SELECT COUNT(*) FROM companies WHERE is_active = true`).Scan(&out.Companies)
	db.Raw(`SELECT COUNT(*) FROM opportunities o JOIN companies c ON c.id = o.company_id
	        WHERE c.is_active = true AND `+liveOppSQL).Scan(&out.Opportunities)
	db.Raw(`SELECT COUNT(*) FROM opportunities o JOIN companies c ON c.id = o.company_id
	        WHERE o.type = 'internship' AND c.is_active = true AND `+liveOppSQL).Scan(&out.Internships)
	db.Raw(`SELECT COUNT(DISTINCT stack_id) FROM company_stacks`).Scan(&out.Stacks)
	db.Raw(`SELECT COUNT(*) FROM schools`).Scan(&out.Schools)
	c.JSON(http.StatusOK, out)
}

type stackStat struct {
	ID            uint   `json:"id"`
	Name          string `json:"name"`
	IsTrending    bool   `json:"isTrending"`
	Companies     int64  `json:"companies"`     // active companies that use this stack
	Opportunities int64  `json:"opportunities"` // live postings that need it
}

// GET /stats/stacks?scope=KZ|UZ|…|ca|cis|world&limit=30
// Ranks technologies by how many companies use them and how many live postings
// ask for them, inside the chosen market. A posting needs a stack if it is tagged
// directly or its company lists that stack.
func (h *Handler) statsStacks(c *gin.Context) {
	countries, ok := scopeCountries(c.Query("scope"))
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid scope"})
		return
	}
	limit := 30
	if n, err := strconv.Atoi(c.Query("limit")); err == nil && n > 0 && n <= 100 {
		limit = n
	}

	byID := map[uint]*stackStat{}
	get := func(id uint, name string, trending bool) *stackStat {
		s := byID[id]
		if s == nil {
			s = &stackStat{ID: id, Name: name, IsTrending: trending}
			byID[id] = s
		}
		return s
	}

	type row struct {
		ID         uint
		Name       string
		IsTrending bool
		N          int64
	}

	// Companies using each stack.
	compSQL := `SELECT s.id, s.name, s.is_trending, COUNT(DISTINCT c.id) AS n
		FROM company_stacks cs
		JOIN companies c ON c.id = cs.company_id AND c.is_active = true
		JOIN stacks s ON s.id = cs.stack_id`
	compArgs := []interface{}{}
	if countries != nil {
		compSQL += ` WHERE c.country IN ?`
		compArgs = append(compArgs, countries)
	}
	compSQL += ` GROUP BY s.id, s.name, s.is_trending`
	var compRows []row
	if err := h.Services.DB.Raw(compSQL, compArgs...).Scan(&compRows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load stats"})
		return
	}
	for _, r := range compRows {
		get(r.ID, r.Name, r.IsTrending).Companies = r.N
	}

	// Live postings needing each stack (tagged directly or inherited from the company).
	oppSQL := `WITH opp AS (
			SELECT o.id, o.company_id, COALESCE(NULLIF(o.country, ''), c.country, '') AS country
			FROM opportunities o JOIN companies c ON c.id = o.company_id
			WHERE c.is_active = true AND ` + liveOppSQL + `
		), pairs AS (
			SELECT os.opportunity_id AS opp_id, os.stack_id FROM opportunity_stacks os
			UNION
			SELECT opp.id, cs.stack_id FROM opp JOIN company_stacks cs ON cs.company_id = opp.company_id
		)
		SELECT s.id, s.name, s.is_trending, COUNT(DISTINCT p.opp_id) AS n
		FROM pairs p JOIN opp ON opp.id = p.opp_id JOIN stacks s ON s.id = p.stack_id`
	oppArgs := []interface{}{}
	if countries != nil {
		oppSQL += ` WHERE opp.country IN ?`
		oppArgs = append(oppArgs, countries)
	}
	oppSQL += ` GROUP BY s.id, s.name, s.is_trending`
	var oppRows []row
	if err := h.Services.DB.Raw(oppSQL, oppArgs...).Scan(&oppRows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load stats"})
		return
	}
	for _, r := range oppRows {
		get(r.ID, r.Name, r.IsTrending).Opportunities = r.N
	}

	out := make([]stackStat, 0, len(byID))
	for _, s := range byID {
		out = append(out, *s)
	}
	sort.Slice(out, func(i, j int) bool {
		a, b := out[i], out[j]
		if a.Companies+a.Opportunities != b.Companies+b.Opportunities {
			return a.Companies+a.Opportunities > b.Companies+b.Opportunities
		}
		return a.Name < b.Name
	})
	if len(out) > limit {
		out = out[:limit]
	}
	c.JSON(http.StatusOK, gin.H{"scope": strings.ToLower(c.DefaultQuery("scope", "world")), "stacks": out})
}
