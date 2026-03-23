package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/config"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, model.AutoMigrate(db))
	return db
}

func TestUserRegisterAndLogin(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	cfg := &config.Config{JWTAccessSecret: "access", JWTRefreshSecret: "refresh"}
	jwtManager := auth.NewJWTManager(cfg)

	svc := NewUserService(userRepo, jwtManager, nil, nil, nil, cfg, nil)

	res, err := svc.Register(context.Background(), RegisterInput{
		Email:     "user@example.com",
		Password:  "supersecret",
		FirstName: "Aruzhan",
		LastName:  "Tilek",
	})
	require.NoError(t, err)
	require.NotEmpty(t, res.AccessToken)
	require.NotEmpty(t, res.RefreshToken)

	loginRes, err := svc.Login(context.Background(), "user@example.com", "supersecret")
	require.NoError(t, err)
	require.Equal(t, res.User.ID, loginRes.User.ID)

	_, err = svc.Login(context.Background(), "user@example.com", "wrong")
	require.Error(t, err)
}

func TestPasswordResetFlow(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	cfg := &config.Config{JWTAccessSecret: "access", JWTRefreshSecret: "refresh"}
	jwtManager := auth.NewJWTManager(cfg)
	tokenRepo := repository.NewPasswordTokenRepository(db)

	svc := NewUserService(userRepo, jwtManager, nil, nil, tokenRepo, cfg, nil)

	_, err := svc.Register(context.Background(), RegisterInput{
		Email:     "reset@example.com",
		Password:  "verysecret",
		FirstName: "Aruzhan",
		LastName:  "Tilek",
	})
	require.NoError(t, err)

	// Call RequestPasswordReset — token gets hashed and saved
	err = svc.RequestPasswordReset(context.Background(), "reset@example.com")
	require.NoError(t, err)

	// Verify a token was saved in DB
	var savedToken model.PasswordResetToken
	require.NoError(t, db.First(&savedToken).Error)
	require.WithinDuration(t, time.Now().Add(1*time.Hour), savedToken.ExpiresAt, time.Minute)

	// Since we can't recover the plain token from the hash,
	// insert a known plain token directly for testing ResetPassword
	plainToken := "test-reset-token-12345"
	tokenHash := hashToken(plainToken)
	var user model.User
	require.NoError(t, db.Where("email = ?", "reset@example.com").First(&user).Error)
	db.Create(&model.PasswordResetToken{
		Token:     tokenHash,
		UserID:    user.ID,
		ExpiresAt: time.Now().Add(1 * time.Hour),
	})

	err = svc.ResetPassword(context.Background(), plainToken, "newsecret")
	require.NoError(t, err)

	_, err = svc.Login(context.Background(), "reset@example.com", "newsecret")
	require.NoError(t, err)
}
