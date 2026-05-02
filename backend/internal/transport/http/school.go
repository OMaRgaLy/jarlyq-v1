package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)


func newSchoolRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listSchools)
	group.GET("/:id", handler.getSchool)
}

func newMastersRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listMasters)
	group.GET("/:id", handler.getMasterProgram)
}

func (h *Handler) listMasters(c *gin.Context) {
	country := c.Query("country")
	language := c.Query("language")
	scholarship := c.Query("scholarship") == "true"
	limit, offset := parsePagination(c)

	rows, err := h.Services.Education.ListMasters(c.Request.Context(), repository.MasterFilter{
		Country:     country,
		Language:    language,
		Scholarship: scholarship,
		Limit:       limit,
		Offset:      offset,
	})
	if err != nil {
		h.Logger.Errorf("list masters: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch masters"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"programs": rows})
}

func (h *Handler) getMasterProgram(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var row repository.MasterCourseRow
	err = h.Services.DB.
		Table("courses").
		Select(`courses.id AS course_id, courses.title AS course_title,
			courses.description, courses.external_url, courses.price,
			courses.price_currency, courses.duration_weeks, courses.format,
			courses.language, courses.scholarship_available, courses.application_deadline,
			schools.id AS school_id, schools.name AS school_name,
			schools.logo_url AS school_logo_url, schools.country AS school_country,
			schools.type AS school_type`).
		Joins("JOIN schools ON schools.id = courses.school_id").
		Where("courses.id = ? AND courses.level = ?", id, "master").
		Scan(&row).Error

	if err != nil || row.CourseID == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "program not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"program": row})
}

func (h *Handler) listSchools(c *gin.Context) {
	stackIDs := parseUintSlice(c.QueryArray("stack_ids[]"))
	regionIDs := parseUintSlice(c.QueryArray("region_ids[]"))
	limit, offset := parsePagination(c)
	schools, err := h.Services.Education.ListSchools(c.Request.Context(), repository.EducationFilter{
		StackIDs:  stackIDs,
		RegionIDs: regionIDs,
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		h.Logger.Errorf("list schools: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch schools"})
		return
	}

	// Attach badges to each school
	if len(schools) > 0 {
		ids := make([]uint, len(schools))
		for i, s := range schools {
			ids[i] = s.ID
		}
		var badges []model.EntityBadge
		h.Services.DB.Where("entity_type = ? AND entity_id IN ?", "school", ids).
			Order("sort_order").Find(&badges)

		// Group badges by entity_id
		badgeMap := make(map[uint][]model.EntityBadge)
		for _, b := range badges {
			badgeMap[b.EntityID] = append(badgeMap[b.EntityID], b)
		}
		for i := range schools {
			schools[i].Badges = badgeMap[schools[i].ID]
		}
	}

	c.JSON(http.StatusOK, gin.H{"schools": schools, "limit": limit, "offset": offset})
}

func (h *Handler) getSchool(c *gin.Context) {
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

	// Attach badges
	var badges []model.EntityBadge
	h.Services.DB.Where("entity_type = ? AND entity_id = ?", "school", id).
		Order("sort_order").Find(&badges)
	school.Badges = badges

	c.JSON(http.StatusOK, gin.H{"school": school})
}
