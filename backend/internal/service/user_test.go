package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/example/jarlyq/internal/auth"
	"github.com/example/jarlyq/internal/config"
	"github.com/example/jarlyq/internal/model"
	"github.com/example/jarlyq/internal/repository"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, model.AutoMigrate(db))
	return db
}

func TestUserRegisterAndLogin(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repository.NewUserRepository(db)
	cfg := &config.Config{JWTAccessSecret: "access", JWTRefreshSecret: "refresh"}
	jwtManager := auth.NewJWTManager(cfg)

	svc := NewUserService(userRepo, jwtManager, nil, nil, nil)

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

	svc := NewUserService(userRepo, jwtManager, nil, nil, tokenRepo)

	_, err := svc.Register(context.Background(), RegisterInput{
		Email:     "reset@example.com",
		Password:  "verysecret",
		FirstName: "Aruzhan",
		LastName:  "Tilek",
	})
	require.NoError(t, err)

	err = svc.RequestPasswordReset(context.Background(), "reset@example.com")
	require.NoError(t, err)

	var token model.PasswordResetToken
	require.NoError(t, db.First(&token).Error)
	require.WithinDuration(t, time.Now().Add(1*time.Hour), token.ExpiresAt, time.Minute)

	err = svc.ResetPassword(context.Background(), token.Token, "newsecret")
	require.NoError(t, err)

	_, err = svc.Login(context.Background(), "reset@example.com", "newsecret")
	require.NoError(t, err)
}
