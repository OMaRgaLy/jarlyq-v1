package repository

import (
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

type JobInterviewRepository interface {
	// GetByJobID returns all interview questions for a job
	GetByJobID(jobID uint, limit, offset int) ([]model.JobInterviewQuestion, error)
	// GetByCompanyID returns all interview questions from a company
	GetByCompanyID(companyID uint, limit, offset int) ([]model.JobInterviewQuestion, error)
	// GetTopicsByCompany returns distinct topics for a company
	GetTopicsByCompany(companyID uint) ([]string, error)
	// GetMostAskedQuestions returns frequently asked questions
	GetMostAskedQuestions(limit int) ([]model.JobInterviewQuestion, error)
	// GetHardestQuestions returns hardest questions
	GetHardestQuestions(limit int) ([]model.JobInterviewQuestion, error)
}

type jobInterviewRepo struct {
	db *gorm.DB
}

func NewJobInterviewRepository(db *gorm.DB) JobInterviewRepository {
	return &jobInterviewRepo{db: db}
}

func (r *jobInterviewRepo) GetByJobID(jobID uint, limit, offset int) ([]model.JobInterviewQuestion, error) {
	var questions []model.JobInterviewQuestion
	if err := r.db.
		Where("job_id = ?", jobID).
		Limit(limit).
		Offset(offset).
		Order("times_asked DESC, difficulty DESC").
		Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *jobInterviewRepo) GetByCompanyID(companyID uint, limit, offset int) ([]model.JobInterviewQuestion, error) {
	var questions []model.JobInterviewQuestion
	if err := r.db.
		Where("company_id = ?", companyID).
		Limit(limit).
		Offset(offset).
		Order("times_asked DESC, difficulty DESC").
		Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *jobInterviewRepo) GetTopicsByCompany(companyID uint) ([]string, error) {
	var topics []string
	if err := r.db.
		Model(&model.JobInterviewQuestion{}).
		Where("company_id = ?", companyID).
		Distinct("category").
		Pluck("category", &topics).Error; err != nil {
		return nil, err
	}
	return topics, nil
}

func (r *jobInterviewRepo) GetMostAskedQuestions(limit int) ([]model.JobInterviewQuestion, error) {
	var questions []model.JobInterviewQuestion
	if err := r.db.
		Order("times_asked DESC").
		Limit(limit).
		Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *jobInterviewRepo) GetHardestQuestions(limit int) ([]model.JobInterviewQuestion, error) {
	var questions []model.JobInterviewQuestion
	if err := r.db.
		Order("difficulty DESC, times_asked DESC").
		Limit(limit).
		Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

type JobReviewRepository interface {
	// GetByJobID returns all reviews for a job
	GetByJobID(jobID uint, limit, offset int) ([]model.JobReview, error)
	// GetByCompanyID returns all reviews for a company
	GetByCompanyID(companyID uint, limit, offset int) ([]model.JobReview, error)
	// GetAverageRating returns average interview rating for a company
	GetAverageRating(companyID uint) (float32, error)
	// GetHiringStats returns how many people were hired vs total interviews
	GetHiringStats(companyID uint) (int, int, error)
}

type jobReviewRepo struct {
	db *gorm.DB
}

func NewJobReviewRepository(db *gorm.DB) JobReviewRepository {
	return &jobReviewRepo{db: db}
}

func (r *jobReviewRepo) GetByJobID(jobID uint, limit, offset int) ([]model.JobReview, error) {
	var reviews []model.JobReview
	if err := r.db.
		Where("job_id = ?", jobID).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&reviews).Error; err != nil {
		return nil, err
	}
	return reviews, nil
}

func (r *jobReviewRepo) GetByCompanyID(companyID uint, limit, offset int) ([]model.JobReview, error) {
	var reviews []model.JobReview
	if err := r.db.
		Where("company_id = ?", companyID).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&reviews).Error; err != nil {
		return nil, err
	}
	return reviews, nil
}

func (r *jobReviewRepo) GetAverageRating(companyID uint) (float32, error) {
	var avgRating float32
	if err := r.db.
		Model(&model.JobReview{}).
		Where("company_id = ?", companyID).
		Select("AVG(interview_rating)").
		Scan(&avgRating).Error; err != nil {
		return 0, err
	}
	return avgRating, nil
}

func (r *jobReviewRepo) GetHiringStats(companyID uint) (int, int, error) {
	var result struct {
		Hired int
		Total int
	}

	if err := r.db.
		Model(&model.JobReview{}).
		Where("company_id = ?", companyID).
		Select("SUM(CASE WHEN was_hired = true THEN 1 ELSE 0 END) as hired, COUNT(*) as total").
		Scan(&result).Error; err != nil {
		return 0, 0, err
	}

	return result.Hired, result.Total, nil
}

