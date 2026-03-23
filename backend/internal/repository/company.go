package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// CompanyRepository handles company persistence.
type CompanyRepository interface {
	List(ctx context.Context, filter CompanyFilter) ([]model.Company, error)
	FindByID(ctx context.Context, id uint) (*model.Company, error)
	Create(ctx context.Context, company *model.Company) error
	Update(ctx context.Context, company *model.Company) error
	Delete(ctx context.Context, id uint) error
}

// CompanyFilter for search.
type CompanyFilter struct {
	StackIDs  []uint
	RegionIDs []uint
	Limit     int
	Offset    int
}

type companyRepo struct {
	db *gorm.DB
}

// NewCompanyRepository creates repository.
func NewCompanyRepository(db *gorm.DB) CompanyRepository {
	return &companyRepo{db: db}
}

func (r *companyRepo) List(ctx context.Context, filter CompanyFilter) ([]model.Company, error) {
	query := r.db.WithContext(ctx).Model(&model.Company{}).Preload("Stack").Preload("Regions").Preload("Opportunities").Preload("Opportunities.Stack").Preload("Opportunities.Regions")

	if len(filter.StackIDs) > 0 {
		query = query.Joins("JOIN company_stacks cs ON cs.company_id = companies.id").Where("cs.stack_id IN ?", filter.StackIDs).Group("companies.id")
	}
	if len(filter.RegionIDs) > 0 {
		query = query.Joins("JOIN company_regions cr ON cr.company_id = companies.id").Where("cr.region_id IN ?", filter.RegionIDs).Group("companies.id")
	}

	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	query = query.Offset(filter.Offset).Limit(limit)

	var companies []model.Company
	if err := query.Find(&companies).Error; err != nil {
		return nil, err
	}
	return companies, nil
}

func (r *companyRepo) FindByID(ctx context.Context, id uint) (*model.Company, error) {
	var company model.Company
	if err := r.db.WithContext(ctx).Preload("Stack").Preload("Regions").Preload("Opportunities").Preload("Opportunities.Stack").Preload("Opportunities.Regions").First(&company, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &company, nil
}

func (r *companyRepo) Create(ctx context.Context, company *model.Company) error {
	return r.db.WithContext(ctx).Create(company).Error
}

func (r *companyRepo) Update(ctx context.Context, company *model.Company) error {
	return r.db.WithContext(ctx).Session(&gorm.Session{FullSaveAssociations: true}).Save(company).Error
}

func (r *companyRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Company{}, id).Error
}
