package service

import (
	"context"
	"errors"

	"github.com/example/jarlyq/internal/model"
	"github.com/example/jarlyq/internal/repository"
)

// CertificateService handles verification.
type CertificateService interface {
	Verify(ctx context.Context, code string) (*model.Certificate, error)
}

type certificateService struct {
	certificates repository.CertificateRepository
}

// NewCertificateService creates service.
func NewCertificateService(certificates repository.CertificateRepository) CertificateService {
	return &certificateService{certificates: certificates}
}

func (s *certificateService) Verify(ctx context.Context, code string) (*model.Certificate, error) {
	cert, err := s.certificates.Verify(ctx, code)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, repository.ErrNotFound
		}
		return nil, err
	}
	return cert, nil
}
