package http

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/example/jarlyq/internal/repository"
)

// GetJobs godoc
// @Summary Get all jobs with filters
// @Description Get paginated job listings with optional filters by level, location, stack, salary, etc
// @Tags Jobs
// @Produce json
// @Param level query string false "Job level (intern, junior, middle, senior)"
// @Param location query string false "Location (Remote, Almaty, etc)"
// @Param type query string false "Job type (full-time, internship, contract)"
// @Param stack_ids query string false "Stack IDs comma-separated (e.g., 1,2,3)"
// @Param salary_min query int false "Minimum salary (USD)"
// @Param salary_max query int false "Maximum salary (USD)"
// @Param limit query int false "Limit per page (default 20, max 100)"
// @Param offset query int false "Offset for pagination"
// @Success 200 {object} map[string]interface{}
// @Router /jobs [get]
func (h *Handler) getJobs(c *gin.Context) {
	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 && val <= 100 {
			limit = val
		}
	}

	if o := c.Query("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	filters := repository.JobFilters{
		Level:    c.Query("level"),
		Location: c.Query("location"),
		JobType:  c.Query("type"),
	}

	if minStr := c.Query("salary_min"); minStr != "" {
		if val, err := strconv.Atoi(minStr); err == nil && val > 0 {
			filters.SalaryMin = val
		}
	}

	if maxStr := c.Query("salary_max"); maxStr != "" {
		if val, err := strconv.Atoi(maxStr); err == nil && val > 0 {
			filters.SalaryMax = val
		}
	}

	if stackStr := c.Query("stack_ids"); stackStr != "" {
		parts := strings.Split(stackStr, ",")
		for _, p := range parts {
			if id, err := strconv.ParseUint(strings.TrimSpace(p), 10, 32); err == nil {
				filters.StackIDs = append(filters.StackIDs, uint(id))
			}
		}
	}

	jobs, err := h.Services.Job.GetAllJobs(c.Request.Context(), filters, limit, offset)
	if err != nil {
		h.Logger.Errorf("get jobs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get jobs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    jobs,
		"count":   len(jobs),
	})
}

// GetJobDetail godoc
// @Summary Get job details
// @Description Get full job details including interview questions and reviews
// @Tags Jobs
// @Produce json
// @Param id path int true "Job ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /jobs/{id} [get]
func (h *Handler) getJobDetail(c *gin.Context) {
	id := c.Param("id")
	jobID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid job id"})
		return
	}

	job, err := h.Services.Job.GetJobDetail(c.Request.Context(), uint(jobID))
	if err != nil {
		h.Logger.Errorf("get job detail: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get job"})
		return
	}

	if job == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    job,
	})
}

// GetCompanyJobs godoc
// @Summary Get all jobs from a company
// @Description Get all job openings from a specific company
// @Tags Jobs
// @Produce json
// @Param company_id path int true "Company ID"
// @Param limit query int false "Limit (default 20)"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /jobs/company/{company_id} [get]
func (h *Handler) getCompanyJobs(c *gin.Context) {
	id := c.Param("company_id")
	companyID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company id"})
		return
	}

	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	if o := c.Query("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	jobs, err := h.Services.Job.GetJobsByCompany(c.Request.Context(), uint(companyID), limit, offset)
	if err != nil {
		h.Logger.Errorf("get company jobs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get jobs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    jobs,
		"count":   len(jobs),
	})
}

// GetPopularJobs godoc
// @Summary Get trending jobs
// @Description Get most viewed/popular job postings
// @Tags Jobs
// @Produce json
// @Param limit query int false "Limit (default 10, max 50)"
// @Success 200 {object} map[string]interface{}
// @Router /jobs/popular [get]
func (h *Handler) getPopularJobs(c *gin.Context) {
	limit := 10
	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 && val <= 50 {
			limit = val
		}
	}

	jobs, err := h.Services.Job.GetPopularJobs(c.Request.Context(), limit)
	if err != nil {
		h.Logger.Errorf("get popular jobs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get jobs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    jobs,
		"count":   len(jobs),
	})
}

// GetRemoteJobs godoc
// @Summary Get remote jobs
// @Description Get all remote job positions
// @Tags Jobs
// @Produce json
// @Param limit query int false "Limit (default 20)"
// @Param offset query int false "Offset"
// @Success 200 {object} map[string]interface{}
// @Router /jobs/remote [get]
func (h *Handler) getRemoteJobs(c *gin.Context) {
	limit := 20
	offset := 0

	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	if o := c.Query("offset"); o != "" {
		if val, err := strconv.Atoi(o); err == nil && val >= 0 {
			offset = val
		}
	}

	jobs, err := h.Services.Job.GetRemoteJobs(c.Request.Context(), limit, offset)
	if err != nil {
		h.Logger.Errorf("get remote jobs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get jobs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    jobs,
		"count":   len(jobs),
	})
}

func newJobRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.getJobs)
	group.GET("/popular", handler.getPopularJobs)
	group.GET("/remote", handler.getRemoteJobs)
	group.GET("/:id", handler.getJobDetail)
	group.GET("/company/:company_id", handler.getCompanyJobs)
}
