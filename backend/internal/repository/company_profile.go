package repository

import (
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

type CompanyProfileRepository interface {
	// GetByCompanyID returns company profile with jobs and reviews
	GetByCompanyID(companyID uint) (*model.CompanyProfile, error)
	// GetAll returns all company profiles
	GetAll(limit, offset int) ([]model.CompanyProfile, error)
	// SearchByName searches companies by name
	SearchByName(name string, limit, offset int) ([]model.CompanyProfile, error)
	// GetHiringCompanies returns only companies that are hiring
	GetHiringCompanies(limit, offset int) ([]model.CompanyProfile, error)
	// GetCompaniesWithStack returns companies using specific technology
	GetCompaniesWithStack(stackID uint, limit, offset int) ([]model.CompanyProfile, error)
	// GetCompanyReviews gets all reviews for a company
	GetCompanyReviews(companyID uint, limit, offset int) ([]model.CompanyReview, error)
	// GetHRAdvices gets HR tips from a company
	GetHRAdvices(companyID uint, limit, offset int) ([]model.HRAdvice, error)
}

type companyProfileRepo struct {
	db *gorm.DB
}

func NewCompanyProfileRepository(db *gorm.DB) CompanyProfileRepository {
	return &companyProfileRepo{db: db}
}

func (r *companyProfileRepo) GetByCompanyID(companyID uint) (*model.CompanyProfile, error) {
	var profile model.CompanyProfile
	if err := r.db.
		Where("company_id = ?", companyID).
		Preload("Jobs").
		Preload("InterviewQs").
		Preload("Reviews").
		Preload("HRAdvices").
		First(&profile).Error; err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *companyProfileRepo) GetAll(limit, offset int) ([]model.CompanyProfile, error) {
	var profiles []model.CompanyProfile
	if err := r.db.
		Preload("Jobs", func(db *gorm.DB) *gorm.DB {
			return db.Limit(3) // Show only 3 latest jobs
		}).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&profiles).Error; err != nil {
		return nil, err
	}
	return profiles, nil
}

func (r *companyProfileRepo) SearchByName(name string, limit, offset int) ([]model.CompanyProfile, error) {
	var profiles []model.CompanyProfile
	if err := r.db.
		Where("company_id IN (SELECT id FROM companies WHERE name ILIKE ?)", "%"+name+"%").
		Preload("Jobs").
		Limit(limit).
		Offset(offset).
		Find(&profiles).Error; err != nil {
		return nil, err
	}
	return profiles, nil
}

func (r *companyProfileRepo) GetHiringCompanies(limit, offset int) ([]model.CompanyProfile, error) {
	var profiles []model.CompanyProfile
	if err := r.db.
		Where("hiring_now = ?", true).
		Preload("Jobs").
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&profiles).Error; err != nil {
		return nil, err
	}
	return profiles, nil
}

func (r *companyProfileRepo) GetCompaniesWithStack(stackID uint, limit, offset int) ([]model.CompanyProfile, error) {
	var profiles []model.CompanyProfile
	if err := r.db.
		Joins("JOIN companies ON company_profiles.company_id = companies.id").
		Joins("JOIN company_stacks ON companies.id = company_stacks.company_id").
		Where("company_stacks.stack_id = ?", stackID).
		Preload("Jobs").
		Distinct("company_profiles.id").
		Limit(limit).
		Offset(offset).
		Find(&profiles).Error; err != nil {
		return nil, err
	}
	return profiles, nil
}

func (r *companyProfileRepo) GetCompanyReviews(companyID uint, limit, offset int) ([]model.CompanyReview, error) {
	var reviews []model.CompanyReview
	if err := r.db.
		Where("company_id = ?", companyID).
		Limit(limit).
		Offset(offset).
		Order("rating DESC, created_at DESC").
		Find(&reviews).Error; err != nil {
		return nil, err
	}
	return reviews, nil
}

func (r *companyProfileRepo) GetHRAdvices(companyID uint, limit, offset int) ([]model.HRAdvice, error) {
	var advices []model.HRAdvice
	if err := r.db.
		Where("company_id = ?", companyID).
		Limit(limit).
		Offset(offset).
		Order("helpful DESC, created_at DESC").
		Find(&advices).Error; err != nil {
		return nil, err
	}
	return advices, nil
}
