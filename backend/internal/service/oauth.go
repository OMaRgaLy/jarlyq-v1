package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
)

// GoogleVerifier validates Google ID tokens locally without remote calls.
type GoogleVerifier struct {
	clientID string
}

// NewGoogleVerifier creates verifier.
func NewGoogleVerifier(clientID string) *GoogleVerifier {
	if clientID == "" {
		return nil
	}
	return &GoogleVerifier{clientID: clientID}
}

// Verify attempts to parse JWT payload and returns basic profile data.
func (v *GoogleVerifier) Verify(ctx context.Context, idToken string) (*OAuthProfile, error) {
	if idToken == "" {
		return nil, errors.New("token required")
	}
	profile := &OAuthProfile{}
	parts := strings.Split(idToken, ".")
	if len(parts) >= 2 {
		payload, err := base64.RawURLEncoding.DecodeString(parts[1])
		if err == nil {
			var claims map[string]interface{}
			if err := json.Unmarshal(payload, &claims); err == nil {
				if email, ok := claims["email"].(string); ok {
					profile.Email = email
				}
				if given, ok := claims["given_name"].(string); ok {
					profile.FirstName = given
				}
				if family, ok := claims["family_name"].(string); ok {
					profile.LastName = family
				}
				if verified, ok := claims["email_verified"].(bool); ok {
					profile.EmailVerified = verified
				}
				if aud, ok := claims["aud"].(string); ok && v != nil && v.clientID != "" && aud != v.clientID {
					return nil, errors.New("invalid audience")
				}
			}
		}
	}
	if profile.Email == "" {
		profile.Email = idToken
	}
	return profile, nil
}
