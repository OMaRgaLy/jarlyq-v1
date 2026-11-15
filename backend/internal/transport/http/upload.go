package http

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/middleware"
)

// maxUploadBytes is the largest image we accept. The server-wide body limit is 2 MB,
// so this leaves room for the multipart envelope.
const maxUploadBytes = 1_800_000

// Sniffed content type → file extension. SVG is deliberately absent: it can carry scripts.
var uploadTypes = map[string]string{
	"image/png":  "png",
	"image/jpeg": "jpg",
	"image/gif":  "gif",
	"image/webp": "webp",
}

var uploadNameRe = regexp.MustCompile(`^[a-f0-9]{32}\.(png|jpg|gif|webp)$`)

func newUploadRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	// Public: files have unguessable names and are only images.
	group.GET("/:name", handler.serveUpload)
	// Only people who can edit pages may upload: admins and page owners.
	group.POST("", middleware.JWTAuth(jwt), handler.canUpload, handler.uploadImage)
}

// canUpload lets admins, company/school owners and partners through.
func (h *Handler) canUpload(c *gin.Context) {
	role, _ := c.Get("user_role")
	email, _ := c.Get("user_email")
	if e, _ := email.(string); e != "" && e == h.Config.AdminEmail {
		c.Next()
		return
	}
	switch role {
	case "admin", "company_owner", "school_owner", "partner":
		c.Next()
	default:
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	}
}

// POST /uploads — multipart field "file". Returns {"url": "/api/v1/uploads/<name>"}.
func (h *Handler) uploadImage(c *gin.Context) {
	fh, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required (max 1.8 MB)"})
		return
	}
	if fh.Size <= 0 || fh.Size > maxUploadBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "image is too large, max 1.8 MB"})
		return
	}
	f, err := fh.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read file"})
		return
	}
	defer f.Close()

	// The type comes from the bytes, never from the file name or the client's header.
	head := make([]byte, 512)
	n, _ := io.ReadFull(f, head)
	ext, ok := uploadTypes[http.DetectContentType(head[:n])]
	if !ok {
		c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "only PNG, JPEG, GIF and WebP images are allowed"})
		return
	}
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}

	raw := make([]byte, 16)
	if _, err := rand.Read(raw); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}
	name := hex.EncodeToString(raw) + "." + ext

	if err := os.MkdirAll(h.Config.UploadDir, 0o750); err != nil {
		h.Logger.Errorf("upload: mkdir: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}
	out, err := os.OpenFile(filepath.Join(h.Config.UploadDir, name), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o640)
	if err != nil {
		h.Logger.Errorf("upload: create: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}
	defer out.Close()
	if _, err := io.Copy(out, io.LimitReader(f, maxUploadBytes)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"url": "/api/v1/uploads/" + name})
}

// GET /uploads/:name
func (h *Handler) serveUpload(c *gin.Context) {
	name := c.Param("name")
	if !uploadNameRe.MatchString(name) {
		c.Status(http.StatusNotFound)
		return
	}
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Content-Security-Policy", "default-src 'none'; img-src 'self'; sandbox")
	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	c.File(filepath.Join(h.Config.UploadDir, name))
}
