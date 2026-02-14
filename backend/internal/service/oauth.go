package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

// GoogleVerifier validates Google ID tokens via Google's tokeninfo endpoint.
type GoogleVerifier struct {
	clientID   string
	httpClient *http.Client
}

// NewGoogleVerifier creates verifier.
func NewGoogleVerifier(clientID string) *GoogleVerifier {
	if clientID == "" {
		return nil
	}
	return &GoogleVerifier{
		clientID:   clientID,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// googleTokenInfo represents the response from Google's tokeninfo endpoint.
type googleTokenInfo struct {
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Audience      string `json:"aud"`
	Error         string `json:"error_description"`
}

// Verify validates the ID token against Google's tokeninfo API and returns profile data.
func (v *GoogleVerifier) Verify(ctx context.Context, idToken string) (*OAuthProfile, error) {
	if idToken == "" {
		return nil, errors.New("token required")
	}

	url := fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", idToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("verify token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var info googleTokenInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	if resp.StatusCode != http.StatusOK || info.Error != "" {
		return nil, errors.New("invalid google token")
	}

	if info.Audience != v.clientID {
		return nil, errors.New("token audience mismatch")
	}

	if info.Email == "" {
		return nil, errors.New("email not present in token")
	}

	return &OAuthProfile{
		Email:         info.Email,
		FirstName:     info.GivenName,
		LastName:      info.FamilyName,
		EmailVerified: info.EmailVerified == "true",
	}, nil
}
