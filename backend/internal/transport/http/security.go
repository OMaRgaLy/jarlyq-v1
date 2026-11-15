package http

import (
	"regexp"
	"strings"
)

// safeURL returns the URL only if it starts with http:// or https://.
// Prevents javascript: URIs, data: URIs, and SSRF via internal addresses.
func safeURL(u string) string {
	u = strings.TrimSpace(u)
	if u == "" {
		return ""
	}
	lower := strings.ToLower(u)
	if strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://") {
		return u
	}
	return ""
}

// safeURLs applies safeURL to each argument in-place and returns them.
func safeURLs(urls ...*string) {
	for _, u := range urls {
		if u != nil {
			*u = safeURL(*u)
		}
	}
}

// uploadPathRe matches only files our own upload endpoint produced.
var uploadPathRe = regexp.MustCompile(`^/api/v1/uploads/[a-f0-9]{32}\.(png|jpg|gif|webp)$`)

// safeImageURL is safeURL for image fields: it also accepts the path of a file
// uploaded through POST /uploads (and nothing else that is relative).
func safeImageURL(u string) string {
	u = strings.TrimSpace(u)
	if uploadPathRe.MatchString(u) {
		return u
	}
	return safeURL(u)
}

// safeImageURLs applies safeImageURL to each argument in-place.
func safeImageURLs(urls ...*string) {
	for _, u := range urls {
		if u != nil {
			*u = safeImageURL(*u)
		}
	}
}
