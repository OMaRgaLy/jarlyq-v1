package repository

import (
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

type ProjectIdeaRepository interface {
	GetAll(direction, difficulty string, limit, offset int) ([]model.ProjectIdea, error)
	GetByID(id uint) (*model.ProjectIdea, error)
	GetDirections() ([]string, error)
	GetByDirection(direction string, limit, offset int) ([]model.ProjectIdea, error)
	GetPopular(limit int) ([]model.ProjectIdea, error)
}

type projectIdeaRepo struct {
	db *gorm.DB
}

func NewProjectIdeaRepository(db *gorm.DB) ProjectIdeaRepository {
	return &projectIdeaRepo{db: db}
}

func (r *projectIdeaRepo) GetAll(direction, difficulty string, limit, offset int) ([]model.ProjectIdea, error) {
	var ideas []model.ProjectIdea
	q := r.db.Model(&model.ProjectIdea{})

	if direction != "" {
		q = q.Where("direction = ?", direction)
	}
	if difficulty != "" {
		q = q.Where("difficulty = ?", difficulty)
	}

	if err := q.Order("likes DESC, id ASC").Limit(limit).Offset(offset).Find(&ideas).Error; err != nil {
		return nil, err
	}
	return ideas, nil
}

func (r *projectIdeaRepo) GetByID(id uint) (*model.ProjectIdea, error) {
	var idea model.ProjectIdea
	if err := r.db.First(&idea, id).Error; err != nil {
		return nil, err
	}
	return &idea, nil
}

func (r *projectIdeaRepo) GetDirections() ([]string, error) {
	var directions []string
	if err := r.db.
		Model(&model.ProjectIdea{}).
		Select("direction").
		Group("direction").
		Order("COUNT(*) DESC").
		Pluck("direction", &directions).Error; err != nil {
		return nil, err
	}
	return directions, nil
}

func (r *projectIdeaRepo) GetByDirection(direction string, limit, offset int) ([]model.ProjectIdea, error) {
	var ideas []model.ProjectIdea
	if err := r.db.
		Where("direction = ?", direction).
		Order("difficulty ASC, likes DESC").
		Limit(limit).
		Offset(offset).
		Find(&ideas).Error; err != nil {
		return nil, err
	}
	return ideas, nil
}

func (r *projectIdeaRepo) GetPopular(limit int) ([]model.ProjectIdea, error) {
	var ideas []model.ProjectIdea
	if err := r.db.
		Order("likes DESC, completed_by DESC").
		Limit(limit).
		Find(&ideas).Error; err != nil {
		return nil, err
	}
	return ideas, nil
}
