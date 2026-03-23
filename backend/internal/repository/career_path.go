package repository

import (
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

type CareerPathRepository interface {
	// GetAll returns all career paths with pagination
	GetAll(limit, offset int) ([]model.CareerPath, error)
	// GetByID returns a career path with all stages
	GetByID(id uint) (*model.CareerPath, error)
	// GetStages returns all stages for a path
	GetStages(pathID uint) ([]model.PathStage, error)
	// GetStageByOrder returns a specific stage
	GetStageByOrder(pathID uint, order int) (*model.PathStage, error)
}

type careerPathRepo struct {
	db *gorm.DB
}

func NewCareerPathRepository(db *gorm.DB) CareerPathRepository {
	return &careerPathRepo{db: db}
}

func (r *careerPathRepo) GetAll(limit, offset int) ([]model.CareerPath, error) {
	var paths []model.CareerPath
	if err := r.db.
		Preload("Stages", func(db *gorm.DB) *gorm.DB {
			return db.Order("\"order\"")
		}).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&paths).Error; err != nil {
		return nil, err
	}
	return paths, nil
}

func (r *careerPathRepo) GetByID(id uint) (*model.CareerPath, error) {
	var path model.CareerPath
	if err := r.db.
		Preload("Stages", func(db *gorm.DB) *gorm.DB {
			return db.Order("\"order\"")
		}).
		Preload("Stages.Courses").
		Preload("Stages.Questions").
		Preload("Stack").
		First(&path, id).Error; err != nil {
		return nil, err
	}
	return &path, nil
}

func (r *careerPathRepo) GetStages(pathID uint) ([]model.PathStage, error) {
	var stages []model.PathStage
	if err := r.db.
		Where("career_path_id = ?", pathID).
		Preload("Courses").
		Preload("Questions").
		Order("\"order\"").
		Find(&stages).Error; err != nil {
		return nil, err
	}
	return stages, nil
}

func (r *careerPathRepo) GetStageByOrder(pathID uint, order int) (*model.PathStage, error) {
	var stage model.PathStage
	if err := r.db.
		Where("career_path_id = ? AND \"order\" = ?", pathID, order).
		Preload("Courses").
		Preload("Questions").
		First(&stage).Error; err != nil {
		return nil, err
	}
	return &stage, nil
}
