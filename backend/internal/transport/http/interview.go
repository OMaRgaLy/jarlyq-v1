package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetInterviewQuestions godoc
// @Summary Get interview questions
// @Description Get paginated list of interview questions with optional filters
// @Tags Interview Questions
// @Produce json
// @Param level query string false "Filter by level (easy, medium, hard)"
// @Param topic query string false "Filter by topic (Python, SQL, etc)"
// @Param limit query int false "Limit per page (default 20, max 100)"
// @Param offset query int false "Offset for pagination"
// @Success 200 {object} map[string]interface{}
// @Router /interview-questions [get]
func (h *Handler) getInterviewQuestions(c *gin.Context) {
	level := c.Query("level")
	topic := c.Query("topic")
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

	questions, err := h.Services.Interview.GetQuestions(c.Request.Context(), level, topic, limit, offset)
	if err != nil {
		h.Logger.Errorf("get interview questions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    questions,
		"count":   len(questions),
	})
}

// GetInterviewQuestion godoc
// @Summary Get interview question details
// @Description Get full details of a specific interview question with answer
// @Tags Interview Questions
// @Produce json
// @Param id path int true "Question ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /interview-questions/{id} [get]
func (h *Handler) getInterviewQuestion(c *gin.Context) {
	id := c.Param("id")
	questionID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question id"})
		return
	}

	question, err := h.Services.Interview.GetQuestion(c.Request.Context(), uint(questionID))
	if err != nil {
		h.Logger.Errorf("get interview question: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get question"})
		return
	}

	if question == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    question,
	})
}

// GetPathInterviewQuestions godoc
// @Summary Get questions for a career path
// @Description Get interview questions relevant to a specific career path
// @Tags Interview Questions
// @Produce json
// @Param path_id path int true "Career Path ID"
// @Param limit query int false "Limit per page (default 20, max 100)"
// @Param offset query int false "Offset for pagination"
// @Success 200 {object} map[string]interface{}
// @Router /interview-questions/path/{path_id} [get]
func (h *Handler) getPathInterviewQuestions(c *gin.Context) {
	id := c.Param("path_id")
	pathID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid path id"})
		return
	}

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

	questions, err := h.Services.Interview.GetPathQuestions(c.Request.Context(), uint(pathID), limit, offset)
	if err != nil {
		h.Logger.Errorf("get path interview questions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    questions,
		"count":   len(questions),
	})
}

// GetInterviewTopics godoc
// @Summary Get most popular interview topics
// @Description Get list of most asked interview topics
// @Tags Interview Questions
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /interview-questions/topics [get]
func (h *Handler) getInterviewTopics(c *gin.Context) {
	topics, err := h.Services.Interview.GetTopics(c.Request.Context())
	if err != nil {
		h.Logger.Errorf("get interview topics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get topics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    topics,
		"count":   len(topics),
	})
}

func newInterviewRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.getInterviewQuestions)
	group.GET("/topics", handler.getInterviewTopics)
	group.GET("/:id", handler.getInterviewQuestion)
	group.GET("/path/:path_id", handler.getPathInterviewQuestions)
}
