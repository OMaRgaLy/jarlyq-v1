package repository

import (
	"time"

	"github.com/example/jarlyq/internal/model"
	"gorm.io/gorm"
)

type UserProgressRepository interface {
	// GetUserCurrentPath returns the path a user is currently working on
	GetUserCurrentPath(userID uint) (*model.UserProgress, error)
	// StartPath creates a new user progress record for a path
	StartPath(userID, pathID uint) (*model.UserProgress, error)
	// UpdateProgress updates user's progress on the path
	UpdateProgress(userID, pathID uint, currentStage, progress int) error
	// CompletePath marks path as completed
	CompletePath(userID, pathID uint) error
	// TrackInterviewQuestion marks a question as learned/studied/mastered
	TrackInterviewQuestion(userID, questionID uint, status string) error
	// GetInterviewProgress gets question learning status for a user
	GetInterviewProgress(userID, questionID uint) (*model.UserInterviewProgress, error)
}

type userProgressRepo struct {
	db *gorm.DB
}

func NewUserProgressRepository(db *gorm.DB) UserProgressRepository {
	return &userProgressRepo{db: db}
}

func (r *userProgressRepo) GetUserCurrentPath(userID uint) (*model.UserProgress, error) {
	var progress model.UserProgress
	if err := r.db.
		Where("user_id = ? AND completed_at IS NULL", userID).
		First(&progress).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // user doesn't have active path
		}
		return nil, err
	}
	return &progress, nil
}

func (r *userProgressRepo) StartPath(userID, pathID uint) (*model.UserProgress, error) {
	progress := model.UserProgress{
		UserID:       userID,
		CareerPathID: pathID,
		StartedAt:    time.Now(),
		CurrentStage: 1,
		Progress:     0,
	}

	if err := r.db.Create(&progress).Error; err != nil {
		return nil, err
	}

	return &progress, nil
}

func (r *userProgressRepo) UpdateProgress(userID, pathID uint, currentStage, progress int) error {
	return r.db.
		Model(&model.UserProgress{}).
		Where("user_id = ? AND career_path_id = ?", userID, pathID).
		Updates(map[string]interface{}{
			"current_stage": currentStage,
			"progress":      progress,
		}).Error
}

func (r *userProgressRepo) CompletePath(userID, pathID uint) error {
	return r.db.
		Model(&model.UserProgress{}).
		Where("user_id = ? AND career_path_id = ?", userID, pathID).
		Update("completed_at", time.Now()).Error
}

func (r *userProgressRepo) TrackInterviewQuestion(userID, questionID uint, status string) error {
	// First try to find existing record
	var existing model.UserInterviewProgress
	if err := r.db.
		Where("user_id = ? AND interview_question_id = ?", userID, questionID).
		First(&existing).Error; err == nil {
		// Update existing record
		return r.db.
			Model(&existing).
			Update("status", status).Error
	}

	// Create new record if not found
	return r.db.Create(&model.UserInterviewProgress{
		UserID:              userID,
		InterviewQuestionID: questionID,
		Status:              status,
	}).Error
}

func (r *userProgressRepo) GetInterviewProgress(userID, questionID uint) (*model.UserInterviewProgress, error) {
	var progress model.UserInterviewProgress
	if err := r.db.
		Where("user_id = ? AND interview_question_id = ?", userID, questionID).
		First(&progress).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &progress, nil
}
