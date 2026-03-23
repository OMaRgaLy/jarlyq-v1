package repository

import (
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

type InterviewQuestionRepository interface {
	// GetAll returns all interview questions with filters
	GetAll(level, topic string, limit, offset int) ([]model.InterviewQuestion, error)
	// GetByID returns a single question with all details
	GetByID(id uint) (*model.InterviewQuestion, error)
	// GetByPathID returns questions for a specific career path
	GetByPathID(pathID uint, limit, offset int) ([]model.InterviewQuestion, error)
	// GetByStageID returns questions for a specific path stage
	GetByStageID(stageID uint) ([]model.InterviewQuestion, error)
	// GetTopTopics returns most popular interview topics
	GetTopTopics() ([]string, error)
}

type interviewQuestionRepo struct {
	db *gorm.DB
}

func NewInterviewQuestionRepository(db *gorm.DB) InterviewQuestionRepository {
	return &interviewQuestionRepo{db: db}
}

func (r *interviewQuestionRepo) GetAll(level, topic string, limit, offset int) ([]model.InterviewQuestion, error) {
	var questions []model.InterviewQuestion
	query := r.db

	if level != "" {
		query = query.Where("level = ?", level)
	}

	if topic != "" {
		query = query.Where("topic = ?", topic)
	}

	if err := query.
		Limit(limit).
		Offset(offset).
		Order("times_asked DESC, created_at DESC").
		Find(&questions).Error; err != nil {
		return nil, err
	}

	return questions, nil
}

func (r *interviewQuestionRepo) GetByID(id uint) (*model.InterviewQuestion, error) {
	var question model.InterviewQuestion
	if err := r.db.
		Preload("Paths").
		Preload("Stack").
		First(&question, id).Error; err != nil {
		return nil, err
	}
	return &question, nil
}

func (r *interviewQuestionRepo) GetByPathID(pathID uint, limit, offset int) ([]model.InterviewQuestion, error) {
	var questions []model.InterviewQuestion
	if err := r.db.
		Joins("JOIN interview_question_paths ON interview_questions.id = interview_question_paths.interview_question_id").
		Where("interview_question_paths.career_path_id = ?", pathID).
		Limit(limit).
		Offset(offset).
		Order("interview_questions.times_asked DESC").
		Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *interviewQuestionRepo) GetByStageID(stageID uint) ([]model.InterviewQuestion, error) {
	var questions []model.InterviewQuestion
	if err := r.db.
		Joins("JOIN path_stage_questions ON interview_questions.id = path_stage_questions.interview_question_id").
		Where("path_stage_questions.path_stage_id = ?", stageID).
		Order("interview_questions.difficulty, interview_questions.times_asked DESC").
		Find(&questions).Error; err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *interviewQuestionRepo) GetTopTopics() ([]string, error) {
	var topics []string
	if err := r.db.
		Model(&model.InterviewQuestion{}).
		Select("topic").
		Group("topic").
		Order("COUNT(*) DESC").
		Limit(10).
		Pluck("topic", &topics).Error; err != nil {
		return nil, err
	}
	return topics, nil
}
