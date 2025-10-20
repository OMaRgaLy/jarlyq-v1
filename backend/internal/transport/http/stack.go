package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func newStackRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("", handler.listStacks)
}

func (h *Handler) listStacks(c *gin.Context) {
	stacks, err := h.Services.Stacks.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"stacks": stacks})
}
