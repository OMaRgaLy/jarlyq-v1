package repository

import (
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"gorm.io/gorm"
)

type SuggestionRepository interface {
	Create(s *model.Suggestion) error
	List(status string) ([]model.Suggestion, error)
	UpdateStatus(id uint, status, notes string) error
}

type suggestionRepo struct{ db *gorm.DB }

func NewSuggestionRepository(db *gorm.DB) SuggestionRepository {
	return &suggestionRepo{db}
}

func (r *suggestionRepo) Create(s *model.Suggestion) error {
	return r.db.Create(s).Error
}

func (r *suggestionRepo) List(status string) ([]model.Suggestion, error) {
	var list []model.Suggestion
	q := r.db.Order("created_at desc")
	if status != "" {
		q = q.Where("status = ?", status)
	}
	return list, q.Find(&list).Error
}

func (r *suggestionRepo) UpdateStatus(id uint, status, notes string) error {
	return r.db.Model(&model.Suggestion{}).Where("id = ?", id).
		Updates(map[string]interface{}{"status": status, "admin_notes": notes}).Error
}
