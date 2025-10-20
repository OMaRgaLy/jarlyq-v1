package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/go-playground/validator/v10"

	"github.com/example/jarlyq/internal/auth"
	"github.com/example/jarlyq/internal/model"
	"github.com/example/jarlyq/internal/repository"
	"github.com/example/jarlyq/pkg/mailer"
)

// UserService manages users.
type UserService interface {
	Register(ctx context.Context, input RegisterInput) (*AuthResult, error)
	Login(ctx context.Context, email, password string) (*AuthResult, error)
	GoogleOAuth(ctx context.Context, token string) (*AuthResult, error)
	GetProfile(ctx context.Context, id uint) (*model.User, error)
	UpdateProfile(ctx context.Context, id uint, input UpdateProfileInput) (*model.User, error)
	RequestPasswordReset(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, token, newPassword string) error
}

// RegisterInput for new users.
type RegisterInput struct {
	Email     string `validate:"required,email"`
	Password  string `validate:"required,min=8"`
	FirstName string `validate:"required"`
	LastName  string `validate:"required"`
}

// UpdateProfileInput for editing profiles.
type UpdateProfileInput struct {
	FirstName string     `validate:"omitempty"`
	LastName  string     `validate:"omitempty"`
	BirthDate *time.Time `validate:"omitempty"`
	Phone     string     `validate:"omitempty"`
	Telegram  string     `validate:"omitempty"`
	Bio       string     `validate:"max=255"`
	Theme     string     `validate:"oneof=light dark"`
	Privacy   model.PrivacySettings
}

// AuthResult returns tokens and user.
type AuthResult struct {
	AccessToken  string
	RefreshToken string
	User         *model.User
}

type userService struct {
	users     repository.UserRepository
	validator *validator.Validate
	jwt       auth.Manager
	mailer    mailer.Mailer
	google    OAuthVerifier
	tokenRepo PasswordTokenRepository
}

// PasswordTokenRepository handles reset tokens.
type PasswordTokenRepository interface {
	Save(ctx context.Context, token string, userID uint, expiresAt time.Time) error
	Find(ctx context.Context, token string) (uint, time.Time, error)
	Delete(ctx context.Context, token string) error
}

// OAuthVerifier validates Google ID tokens.
type OAuthVerifier interface {
	Verify(ctx context.Context, idToken string) (*OAuthProfile, error)
}

// OAuthProfile returns google user info.
type OAuthProfile struct {
	Email         string
	FirstName     string
	LastName      string
	EmailVerified bool
}

// NewUserService constructs service.
func NewUserService(users repository.UserRepository, jwt auth.Manager, mailer mailer.Mailer, verifier OAuthVerifier, tokenRepo PasswordTokenRepository) UserService {
	return &userService{
		users:     users,
		validator: validator.New(),
		jwt:       jwt,
		mailer:    mailer,
		google:    verifier,
		tokenRepo: tokenRepo,
	}
}

func (s *userService) Register(ctx context.Context, input RegisterInput) (*AuthResult, error) {
	if err := s.validator.Struct(input); err != nil {
		return nil, err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		Email:        input.Email,
		PasswordHash: string(hashed),
		FirstName:    input.FirstName,
		LastName:     input.LastName,
		Theme:        "light",
	}

	if err := s.users.Create(ctx, user); err != nil {
		return nil, err
	}

	access, err := s.jwt.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	refresh, err := s.jwt.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	if s.mailer != nil {
		_ = s.mailer.SendVerification(user.Email, fmt.Sprintf("https://app.jarlyq.com/verify?token=%s", access))
	}

	return &AuthResult{AccessToken: access, RefreshToken: refresh, User: user}, nil
}

func (s *userService) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	user, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	access, err := s.jwt.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	refresh, err := s.jwt.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &AuthResult{AccessToken: access, RefreshToken: refresh, User: user}, nil
}

func (s *userService) GoogleOAuth(ctx context.Context, token string) (*AuthResult, error) {
	if s.google == nil {
		return nil, errors.New("google oauth not configured")
	}
	profile, err := s.google.Verify(ctx, token)
	if err != nil {
		return nil, err
	}

	user, err := s.users.FindByEmail(ctx, profile.Email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			user = &model.User{Email: profile.Email, FirstName: profile.FirstName, LastName: profile.LastName, EmailVerified: profile.EmailVerified}
			if err := s.users.Create(ctx, user); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	access, err := s.jwt.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}
	refresh, err := s.jwt.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &AuthResult{AccessToken: access, RefreshToken: refresh, User: user}, nil
}

func (s *userService) GetProfile(ctx context.Context, id uint) (*model.User, error) {
	return s.users.FindByID(ctx, id)
}

func (s *userService) UpdateProfile(ctx context.Context, id uint, input UpdateProfileInput) (*model.User, error) {
	user, err := s.users.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if input.FirstName != "" {
		user.FirstName = input.FirstName
	}
	if input.LastName != "" {
		user.LastName = input.LastName
	}
	if input.BirthDate != nil {
		user.BirthDate = input.BirthDate
	}
	if input.Phone != "" {
		user.Phone = input.Phone
	}
	if input.Telegram != "" {
		user.Telegram = input.Telegram
	}
	if input.Bio != "" {
		user.Bio = input.Bio
	}
	if input.Theme != "" {
		user.Theme = input.Theme
	}
	user.Privacy = input.Privacy

	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *userService) RequestPasswordReset(ctx context.Context, email string) error {
	user, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return err
	}
	token := fmt.Sprintf("reset-%d-%d", user.ID, time.Now().Unix())
	expires := time.Now().Add(1 * time.Hour)
	if s.tokenRepo != nil {
		if err := s.tokenRepo.Save(ctx, token, user.ID, expires); err != nil {
			return err
		}
	}
	if s.mailer != nil {
		return s.mailer.SendPasswordReset(user.Email, fmt.Sprintf("https://app.jarlyq.com/reset?token=%s", token))
	}
	return nil
}

func (s *userService) ResetPassword(ctx context.Context, token, newPassword string) error {
	if s.tokenRepo == nil {
		return errors.New("password reset not configured")
	}
	userID, expiresAt, err := s.tokenRepo.Find(ctx, token)
	if err != nil {
		return err
	}
	if time.Now().After(expiresAt) {
		return errors.New("token expired")
	}

	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.PasswordHash = string(hashed)
	if err := s.users.Update(ctx, user); err != nil {
		return err
	}
	return s.tokenRepo.Delete(ctx, token)
}
