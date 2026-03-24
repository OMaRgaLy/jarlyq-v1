package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func newHackathonRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listHackathons)
}

func (h *Handler) listHackathons(c *gin.Context) {
	var list []model.Hackathon
	h.Services.DB.
		Where("is_active = ?", true).
		Order("registration_deadline ASC").
		Find(&list)
	c.JSON(http.StatusOK, gin.H{"hackathons": list})
}
