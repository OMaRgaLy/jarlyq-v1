package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func newCertificateRoutes(group *gin.RouterGroup, handler *Handler) {
	group.GET("/verify", handler.verifyCertificate)
}

type verifyRequest struct {
	Code string `form:"code" json:"code"`
}

func (h *Handler) verifyCertificate(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		var req verifyRequest
		if err := c.ShouldBindJSON(&req); err != nil || req.Code == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "code required"})
			return
		}
		code = req.Code
	}
	certificate, err := h.Services.Certificate.Verify(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "certificate not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"certificate": certificate})
}
