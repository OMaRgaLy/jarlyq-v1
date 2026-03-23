package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// CertificateRepository handles certificates.
type CertificateRepository interface {
	Verify(ctx context.Context, code string) (*model.Certificate, error)
	Create(ctx context.Context, certificate *model.Certificate) error
}

type certificateRepo struct {
	db *gorm.DB
}

// NewCertificateRepository returns repo.
func NewCertificateRepository(db *gorm.DB) CertificateRepository {
	return &certificateRepo{db: db}
}

func (r *certificateRepo) Verify(ctx context.Context, code string) (*model.Certificate, error) {
	var cert model.Certificate
	if err := r.db.WithContext(ctx).Where("code = ?", code).First(&cert).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &cert, nil
}

func (r *certificateRepo) Create(ctx context.Context, certificate *model.Certificate) error {
	return r.db.WithContext(ctx).Create(certificate).Error
}
