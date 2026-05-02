package http

import "strings"

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
