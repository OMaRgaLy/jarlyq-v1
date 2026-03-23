package service

import (
	"context"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

// CompanyService handles business logic for companies.
type CompanyService interface {
	List(ctx context.Context, filter repository.CompanyFilter) ([]model.Company, error)
	Get(ctx context.Context, id uint) (*model.Company, error)
	Create(ctx context.Context, company *model.Company) error
	Update(ctx context.Context, company *model.Company) error
	Delete(ctx context.Context, id uint) error
}

type companyService struct {
	companies repository.CompanyRepository
}

// NewCompanyService returns company service.
func NewCompanyService(companies repository.CompanyRepository) CompanyService {
	return &companyService{companies: companies}
}

func (s *companyService) List(ctx context.Context, filter repository.CompanyFilter) ([]model.Company, error) {
	return s.companies.List(ctx, filter)
}

func (s *companyService) Get(ctx context.Context, id uint) (*model.Company, error) {
	return s.companies.FindByID(ctx, id)
}

func (s *companyService) Create(ctx context.Context, company *model.Company) error {
	return s.companies.Create(ctx, company)
}

func (s *companyService) Update(ctx context.Context, company *model.Company) error {
	return s.companies.Update(ctx, company)
}

func (s *companyService) Delete(ctx context.Context, id uint) error {
	return s.companies.Delete(ctx, id)
}
