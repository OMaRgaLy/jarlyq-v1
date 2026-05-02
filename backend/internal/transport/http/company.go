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

func newCompanyRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	group.GET("", handler.listCompanies)
	group.GET("/:id", handler.getCompany)
	group.GET("/:id/reviews", handler.listCompanyReviews)
	group.POST("/:id/reviews", middleware.JWTAuth(jwt), handler.createCompanyReview)
}

func (h *Handler) listCompanies(c *gin.Context) {
	stackIDs := parseUintSlice(c.QueryArray("stack_ids[]"))
	regionIDs := parseUintSlice(c.QueryArray("region_ids[]"))
	limit, offset := parsePagination(c)
	companies, err := h.Services.Companies.List(c.Request.Context(), repository.CompanyFilter{
		StackIDs:  stackIDs,
		RegionIDs: regionIDs,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		h.Logger.Errorf("list companies: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch companies"})
		return
	}

	// Attach badges to each company (single batch query)
	if len(companies) > 0 {
		ids := make([]uint, len(companies))
		for i, co := range companies {
			ids[i] = co.ID
		}
		var badges []model.EntityBadge
		h.Services.DB.Where("entity_type = ? AND entity_id IN ?", "company", ids).
			Order("sort_order").Find(&badges)

		badgeMap := make(map[uint][]model.EntityBadge)
		for _, b := range badges {
			badgeMap[b.EntityID] = append(badgeMap[b.EntityID], b)
		}
		for i := range companies {
			companies[i].Badges = badgeMap[companies[i].ID]
		}
	}

	c.JSON(http.StatusOK, gin.H{"companies": companies, "limit": limit, "offset": offset})
}

func (h *Handler) getCompany(c *gin.Context) {
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

	// Attach badges
	var badges []model.EntityBadge
	h.Services.DB.Where("entity_type = ? AND entity_id = ?", "company", id).
		Order("sort_order").Find(&badges)
	company.Badges = badges

	c.JSON(http.StatusOK, gin.H{"company": company})
}

// GET /companies/:id/reviews — public, approved only
func (h *Handler) listCompanyReviews(c *gin.Context) {
	companyID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var reviews []model.CompanyReview
	h.Services.DB.Where("company_id = ? AND status = 'approved'", companyID).
		Order("helpful_count DESC, created_at DESC").
		Find(&reviews)

	// Populate author name
	for i := range reviews {
		if reviews[i].IsAnonymous {
			reviews[i].AuthorName = "Аноним"
		} else {
			var u struct {
				FirstName string
				LastName  string
			}
			h.Services.DB.Table("users").
				Select("first_name, last_name").
				Where("id = ?", reviews[i].UserID).
				Scan(&u)
			if u.FirstName != "" {
				reviews[i].AuthorName = u.FirstName + " " + u.LastName
			}
		}
	}

	var total int64
	h.Services.DB.Model(&model.CompanyReview{}).
		Where("company_id = ? AND status = 'approved'", companyID).
		Count(&total)

	c.JSON(http.StatusOK, gin.H{"reviews": reviews, "total": total})
}

type createReviewRequest struct {
	Rating          float32 `json:"rating" binding:"required,min=1,max=5"`
	Title           string  `json:"title" binding:"required,max=255"`
	ReviewText      string  `json:"review_text" binding:"required"`
	IsAnonymous     bool    `json:"is_anonymous"`
	WorkLifeBalance int     `json:"work_life_balance"`
	SalaryRating    int     `json:"salary_rating"`
	GrowthRating    int     `json:"growth_rating"`
	CultureRating   int     `json:"culture_rating"`
	EmploymentType  string  `json:"employment_type"`
	Position        string  `json:"position"`
	YearsWorked     int     `json:"years_worked"`
}

// POST /companies/:id/reviews — auth required, phone required
func (h *Handler) createCompanyReview(c *gin.Context) {
	companyID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	userID := c.GetUint("user_id")

	// Phone is required
	var phone string
	h.Services.DB.Table("users").Select("phone").Where("id = ?", userID).Scan(&phone)
	if phone == "" {
		c.JSON(http.StatusForbidden, gin.H{"error": "phone number required to leave a review"})
		return
	}

	// One review per user per company
	var existing model.CompanyReview
	if err := h.Services.DB.Where("company_id = ? AND user_id = ?", companyID, userID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "you have already reviewed this company"})
		return
	}

	var req createReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review := &model.CompanyReview{
		CompanyID:       uint(companyID),
		UserID:          userID,
		Status:          "pending",
		IsAnonymous:     req.IsAnonymous,
		Rating:          req.Rating,
		Title:           req.Title,
		ReviewText:      req.ReviewText,
		WorkLifeBalance: req.WorkLifeBalance,
		SalaryRating:    req.SalaryRating,
		GrowthRating:    req.GrowthRating,
		CultureRating:   req.CultureRating,
		EmploymentType:  req.EmploymentType,
		Position:        req.Position,
		YearsWorked:     req.YearsWorked,
	}

	if err := h.Services.DB.Create(review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save review"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"review": review, "message": "Review submitted for moderation"})
}

func parsePagination(c *gin.Context) (int, int) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}

func parseUintSlice(values []string) []uint {
	result := make([]uint, 0, len(values))
	for _, v := range values {
		if v == "" {
			continue
		}
		parsed, err := strconv.ParseUint(v, 10, 64)
		if err == nil {
			result = append(result, uint(parsed))
		}
	}
	return result
}
