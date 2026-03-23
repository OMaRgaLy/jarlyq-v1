package middleware

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/pkg/logger"
)

// RequestLogger logs HTTP requests with latency.
func RequestLogger(log logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		log.Infof("%s %s %d %s", method, path, status, latency)
	}
}
