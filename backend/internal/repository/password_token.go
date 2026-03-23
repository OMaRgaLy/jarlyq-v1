package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// PasswordTokenRepositoryDB implements PasswordTokenRepository using DB.
type PasswordTokenRepositoryDB struct {
	db *gorm.DB
}

// NewPasswordTokenRepository creates repo.
func NewPasswordTokenRepository(db *gorm.DB) *PasswordTokenRepositoryDB {
	return &PasswordTokenRepositoryDB{db: db}
}

// Save stores token.
func (r *PasswordTokenRepositoryDB) Save(ctx context.Context, token string, userID uint, expiresAt time.Time) error {
	record := &model.PasswordResetToken{Token: token, UserID: userID, ExpiresAt: expiresAt}
	return r.db.WithContext(ctx).Create(record).Error
}

// Find retrieves token info.
func (r *PasswordTokenRepositoryDB) Find(ctx context.Context, token string) (uint, time.Time, error) {
	var record model.PasswordResetToken
	if err := r.db.WithContext(ctx).Where("token = ?", token).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, time.Time{}, ErrNotFound
		}
		return 0, time.Time{}, err
	}
	return record.UserID, record.ExpiresAt, nil
}

// Delete removes token.
func (r *PasswordTokenRepositoryDB) Delete(ctx context.Context, token string) error {
	return r.db.WithContext(ctx).Where("token = ?", token).Delete(&model.PasswordResetToken{}).Error
}
