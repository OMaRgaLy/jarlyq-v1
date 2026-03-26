package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/config"
)

// Claims represents JWT claims.
type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// Manager handles JWT operations.
type Manager interface {
	GenerateAccessToken(userID uint, email string) (string, error)
	GenerateRefreshToken(userID uint, email string) (string, error)
	ParseToken(token string) (*Claims, error)
	ParseRefreshToken(token string) (*Claims, error)
}

// JWTManager implements Manager.
type JWTManager struct {
	accessSecret  []byte
	refreshSecret []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

// NewJWTManager creates a JWT manager.
func NewJWTManager(cfg *config.Config) Manager {
	return &JWTManager{
		accessSecret:  []byte(cfg.JWTAccessSecret),
		refreshSecret: []byte(cfg.JWTRefreshSecret),
		accessTTL:     15 * time.Minute,
		refreshTTL:    720 * time.Hour,
	}
}

// GenerateAccessToken returns access JWT.
func (m *JWTManager) GenerateAccessToken(userID uint, email string) (string, error) {
	return m.generateToken(userID, email, m.accessSecret, m.accessTTL)
}

// GenerateRefreshToken returns refresh JWT.
func (m *JWTManager) GenerateRefreshToken(userID uint, email string) (string, error) {
	return m.generateToken(userID, email, m.refreshSecret, m.refreshTTL)
}

func (m *JWTManager) generateToken(userID uint, email string, secret []byte, ttl time.Duration) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

// ParseToken validates an access JWT and returns claims.
func (m *JWTManager) ParseToken(tokenStr string) (*Claims, error) {
	return m.parseWithSecret(tokenStr, m.accessSecret)
}

// ParseRefreshToken validates a refresh JWT and returns claims.
func (m *JWTManager) ParseRefreshToken(tokenStr string) (*Claims, error) {
	return m.parseWithSecret(tokenStr, m.refreshSecret)
}

func (m *JWTManager) parseWithSecret(tokenStr string, secret []byte) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
