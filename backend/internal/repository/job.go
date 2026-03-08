package repository

import (
	"github.com/example/jarlyq/internal/model"
	"gorm.io/gorm"
)

type JobRepository interface {
	// GetAll returns jobs with filters and pagination
	GetAll(filters JobFilters, limit, offset int) ([]model.Job, error)
	// GetByID returns a job with company info
	GetByID(id uint) (*model.Job, error)
	// GetByCompanyID returns all jobs from a company
	GetByCompanyID(companyID uint, limit, offset int) ([]model.Job, error)
	// SearchByStack returns jobs requiring specific stack
	SearchByStack(stackID uint, limit, offset int) ([]model.Job, error)
	// GetPopularJobs returns trending/most viewed jobs
	GetPopularJobs(limit int) ([]model.Job, error)
	// GetJobsByLevel returns jobs for specific level
	GetJobsByLevel(level string, limit, offset int) ([]model.Job, error)
	// GetRemoteJobs returns only remote positions
	GetRemoteJobs(limit, offset int) ([]model.Job, error)
}

type JobFilters struct {
	Level      string   // junior, middle, senior, etc
	Location   string   // Remote, Almaty, etc
	Countries  []string // KZ, KG, UZ
	JobType    string   // full-time, internship, etc
	SalaryMin  int
	SalaryMax  int
	StackIDs   []uint
	CompanyIDs []uint
}

type jobRepo struct {
	db *gorm.DB
}

func NewJobRepository(db *gorm.DB) JobRepository {
	return &jobRepo{db: db}
}

func (r *jobRepo) GetAll(filters JobFilters, limit, offset int) ([]model.Job, error) {
	query := r.db.Preload("Stacks").Preload("Reviews")

	if filters.Level != "" {
		query = query.Where("level = ?", filters.Level)
	}

	if filters.Location != "" {
		query = query.Where("location LIKE ?", "%"+filters.Location+"%")
	}

	if filters.JobType != "" {
		query = query.Where("job_type = ?", filters.JobType)
	}

	if filters.SalaryMin > 0 {
		query = query.Where("salary_max >= ?", filters.SalaryMin)
	}

	if filters.SalaryMax > 0 {
		query = query.Where("salary_min <= ?", filters.SalaryMax)
	}

	if len(filters.StackIDs) > 0 {
		query = query.
			Joins("JOIN job_stacks ON jobs.id = job_stacks.job_id").
			Where("job_stacks.stack_id IN ?", filters.StackIDs)
	}

	if len(filters.CompanyIDs) > 0 {
		query = query.Where("company_id IN ?", filters.CompanyIDs)
	}

	var jobs []model.Job
	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error; err != nil {
		return nil, err
	}

	return jobs, nil
}

func (r *jobRepo) GetByID(id uint) (*model.Job, error) {
	var job model.Job
	if err := r.db.
		Preload("Stacks").
		Preload("InterviewQs").
		Preload("Reviews").
		First(&job, id).Error; err != nil {
		return nil, err
	}
	return &job, nil
}

func (r *jobRepo) GetByCompanyID(companyID uint, limit, offset int) ([]model.Job, error) {
	var jobs []model.Job
	if err := r.db.
		Where("company_id = ?", companyID).
		Preload("Stacks").
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (r *jobRepo) SearchByStack(stackID uint, limit, offset int) ([]model.Job, error) {
	var jobs []model.Job
	if err := r.db.
		Joins("JOIN job_stacks ON jobs.id = job_stacks.job_id").
		Where("job_stacks.stack_id = ?", stackID).
		Preload("Stacks").
		Distinct("jobs.id").
		Limit(limit).
		Offset(offset).
		Order("jobs.created_at DESC").
		Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (r *jobRepo) GetPopularJobs(limit int) ([]model.Job, error) {
	var jobs []model.Job
	if err := r.db.
		Preload("Stacks").
		Order("views DESC").
		Limit(limit).
		Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (r *jobRepo) GetJobsByLevel(level string, limit, offset int) ([]model.Job, error) {
	var jobs []model.Job
	if err := r.db.
		Where("level = ?", level).
		Preload("Stacks").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}

func (r *jobRepo) GetRemoteJobs(limit, offset int) ([]model.Job, error) {
	var jobs []model.Job
	if err := r.db.
		Where("work_format LIKE ? OR location = ?", "%Remote%", "Remote").
		Preload("Stacks").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error; err != nil {
		return nil, err
	}
	return jobs, nil
}
