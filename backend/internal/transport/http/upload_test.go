package http

import (
	"bytes"
	"encoding/base64"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/config"
	"github.com/OMaRgaLy/jarlyq-v1/backend/pkg/logger"
)

// 1×1 transparent PNG.
const tinyPNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

func uploadReq(t *testing.T, filename string, body []byte) *http.Request {
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, err := w.CreateFormFile("file", filename)
	require.NoError(t, err)
	_, _ = part.Write(body)
	require.NoError(t, w.Close())
	req := httptest.NewRequest(http.MethodPost, "/uploads", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	return req
}

func TestUploadImageAcceptsPNGRejectsOthers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	h := &Handler{Config: &config.Config{UploadDir: dir}, Logger: logger.New("test")}
	r := gin.New()
	r.POST("/uploads", h.uploadImage)
	r.GET("/uploads/:name", h.serveUpload)

	png, _ := base64.StdEncoding.DecodeString(tinyPNG)

	// A real PNG is stored under a random name, whatever the client called it.
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, uploadReq(t, "evil.html", png))
	require.Equal(t, http.StatusCreated, rec.Code, rec.Body.String())
	files, _ := os.ReadDir(dir)
	require.Len(t, files, 1)
	require.Regexp(t, `^[a-f0-9]{32}\.png$`, files[0].Name())

	// …and is served back with a fixed image type and nosniff.
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/uploads/"+files[0].Name(), nil))
	require.Equal(t, http.StatusOK, rec.Code)
	require.Equal(t, "nosniff", rec.Header().Get("X-Content-Type-Options"))
	require.Contains(t, rec.Header().Get("Content-Type"), "image/png")

	// SVG, HTML and scripts are refused even when named like an image.
	for name, body := range map[string][]byte{
		"a.png": []byte(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`),
		"b.jpg": []byte(`<html><script>alert(1)</script></html>`),
		"c.png": []byte("not an image"),
	} {
		rec = httptest.NewRecorder()
		r.ServeHTTP(rec, uploadReq(t, name, body))
		require.Equal(t, http.StatusUnsupportedMediaType, rec.Code, name)
	}

	// Path tricks never reach the disk.
	for _, n := range []string{"..%2f..%2fetc%2fpasswd", "x.png", "../go.mod"} {
		rec = httptest.NewRecorder()
		r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/uploads/"+n, nil))
		require.Equal(t, http.StatusNotFound, rec.Code, n)
	}
	_, err := os.Stat(filepath.Join(dir, "x.png"))
	require.Error(t, err)
}

func TestSafeImageURL(t *testing.T) {
	ok := "/api/v1/uploads/0123456789abcdef0123456789abcdef.png"
	require.Equal(t, ok, safeImageURL(ok))
	require.Equal(t, "https://x.kz/a.png", safeImageURL("https://x.kz/a.png"))
	for _, bad := range []string{"javascript:alert(1)", "/api/v1/uploads/../../etc/passwd", "/etc/passwd", "/api/v1/uploads/abc.svg", "data:image/png;base64,AAAA"} {
		require.Equal(t, "", safeImageURL(bad), bad)
	}
}
