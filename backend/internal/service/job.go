package service

import (
	"context"
	"fmt"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

type JobService interface {
	// GetAllJobs returns paginated job listings with filters
	GetAllJobs(ctx context.Context, filters repository.JobFilters, limit, offset int) ([]model.Job, error)
	// GetJobDetail returns full job details including interview questions and reviews
	GetJobDetail(ctx context.Context, jobID uint) (*model.Job, error)
	// GetJobsByCompany returns all jobs from a company
	GetJobsByCompany(ctx context.Context, companyID uint, limit, offset int) ([]model.Job, error)
	// SearchByStack returns jobs requiring specific technology
	SearchByStack(ctx context.Context, stackID uint, limit, offset int) ([]model.Job, error)
	// GetPopularJobs returns trending jobs
	GetPopularJobs(ctx context.Context, limit int) ([]model.Job, error)
	// GetJobsByLevel returns jobs for specific career level
	GetJobsByLevel(ctx context.Context, level string, limit, offset int) ([]model.Job, error)
	// GetRemoteJobs returns remote positions
	GetRemoteJobs(ctx context.Context, limit, offset int) ([]model.Job, error)
}

type jobService struct {
	repo repository.JobRepository
}

func NewJobService(repo repository.JobRepository) JobService {
	return &jobService{repo: repo}
}

func (s *jobService) GetAllJobs(ctx context.Context, filters repository.JobFilters, limit, offset int) ([]model.Job, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	jobs, err := s.repo.GetAll(filters, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get all jobs: %w", err)
	}

	return jobs, nil
}

func (s *jobService) GetJobDetail(ctx context.Context, jobID uint) (*model.Job, error) {
	if jobID == 0 {
		return nil, fmt.Errorf("invalid job id")
	}

	job, err := s.repo.GetByID(jobID)
	if err != nil {
		return nil, fmt.Errorf("get job detail: %w", err)
	}

	return job, nil
}

func (s *jobService) GetJobsByCompany(ctx context.Context, companyID uint, limit, offset int) ([]model.Job, error) {
	if companyID == 0 {
		return nil, fmt.Errorf("invalid company id")
	}

	if limit <= 0 {
		limit = 20
	}

	jobs, err := s.repo.GetByCompanyID(companyID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get jobs by company: %w", err)
	}

	return jobs, nil
}

func (s *jobService) SearchByStack(ctx context.Context, stackID uint, limit, offset int) ([]model.Job, error) {
	if stackID == 0 {
		return nil, fmt.Errorf("invalid stack id")
	}

	if limit <= 0 {
		limit = 20
	}

	jobs, err := s.repo.SearchByStack(stackID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("search by stack: %w", err)
	}

	return jobs, nil
}

func (s *jobService) GetPopularJobs(ctx context.Context, limit int) ([]model.Job, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	jobs, err := s.repo.GetPopularJobs(limit)
	if err != nil {
		return nil, fmt.Errorf("get popular jobs: %w", err)
	}

	return jobs, nil
}

func (s *jobService) GetJobsByLevel(ctx context.Context, level string, limit, offset int) ([]model.Job, error) {
	if level == "" {
		return nil, fmt.Errorf("level required")
	}

	if limit <= 0 {
		limit = 20
	}

	jobs, err := s.repo.GetJobsByLevel(level, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get jobs by level: %w", err)
	}

	return jobs, nil
}

func (s *jobService) GetRemoteJobs(ctx context.Context, limit, offset int) ([]model.Job, error) {
	if limit <= 0 {
		limit = 20
	}

	jobs, err := s.repo.GetRemoteJobs(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get remote jobs: %w", err)
	}

	return jobs, nil
}

// CompanyProfileService
type CompanyProfileService interface {
	// GetCompanyProfile returns company profile with all related data
	GetCompanyProfile(ctx context.Context, companyID uint) (*model.CompanyProfile, error)
	// GetAllCompanies returns all companies
	GetAllCompanies(ctx context.Context, limit, offset int) ([]model.CompanyProfile, error)
	// SearchCompanies searches companies by name
	SearchCompanies(ctx context.Context, name string, limit, offset int) ([]model.CompanyProfile, error)
	// GetHiringCompanies returns companies actively hiring
	GetHiringCompanies(ctx context.Context, limit, offset int) ([]model.CompanyProfile, error)
	// GetCompanyReviews returns reviews for a company
	GetCompanyReviews(ctx context.Context, companyID uint, limit, offset int) ([]model.CompanyReview, error)
	// GetCompanyAdvices returns HR tips for a company
	GetCompanyAdvices(ctx context.Context, companyID uint, limit, offset int) ([]model.HRAdvice, error)
}

type companyProfileService struct {
	repo repository.CompanyProfileRepository
}

func NewCompanyProfileService(repo repository.CompanyProfileRepository) CompanyProfileService {
	return &companyProfileService{repo: repo}
}

func (s *companyProfileService) GetCompanyProfile(ctx context.Context, companyID uint) (*model.CompanyProfile, error) {
	if companyID == 0 {
		return nil, fmt.Errorf("invalid company id")
	}

	profile, err := s.repo.GetByCompanyID(companyID)
	if err != nil {
		return nil, fmt.Errorf("get company profile: %w", err)
	}

	return profile, nil
}

func (s *companyProfileService) GetAllCompanies(ctx context.Context, limit, offset int) ([]model.CompanyProfile, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	companies, err := s.repo.GetAll(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get all companies: %w", err)
	}

	return companies, nil
}

func (s *companyProfileService) SearchCompanies(ctx context.Context, name string, limit, offset int) ([]model.CompanyProfile, error) {
	if name == "" {
		return nil, fmt.Errorf("search query required")
	}

	if limit <= 0 {
		limit = 20
	}

	companies, err := s.repo.SearchByName(name, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("search companies: %w", err)
	}

	return companies, nil
}

func (s *companyProfileService) GetHiringCompanies(ctx context.Context, limit, offset int) ([]model.CompanyProfile, error) {
	if limit <= 0 {
		limit = 20
	}

	companies, err := s.repo.GetHiringCompanies(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get hiring companies: %w", err)
	}

	return companies, nil
}

func (s *companyProfileService) GetCompanyReviews(ctx context.Context, companyID uint, limit, offset int) ([]model.CompanyReview, error) {
	if companyID == 0 {
		return nil, fmt.Errorf("invalid company id")
	}

	if limit <= 0 {
		limit = 20
	}

	reviews, err := s.repo.GetCompanyReviews(companyID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get company reviews: %w", err)
	}

	return reviews, nil
}

func (s *companyProfileService) GetCompanyAdvices(ctx context.Context, companyID uint, limit, offset int) ([]model.HRAdvice, error) {
	if companyID == 0 {
		return nil, fmt.Errorf("invalid company id")
	}

	if limit <= 0 {
		limit = 10
	}

	advices, err := s.repo.GetHRAdvices(companyID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get hr advices: %w", err)
	}

	return advices, nil
}
