package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// StackRepository handles stack operations.
type StackRepository interface {
	List(ctx context.Context) ([]model.Stack, error)
	IncrementPopularity(ctx context.Context, stackID uint, delta uint) error
}

type stackRepo struct {
	db *gorm.DB
}

// NewStackRepository creates repository.
func NewStackRepository(db *gorm.DB) StackRepository {
	return &stackRepo{db: db}
}

func (r *stackRepo) List(ctx context.Context) ([]model.Stack, error) {
	var stacks []model.Stack
	if err := r.db.WithContext(ctx).Order("popularity desc").Find(&stacks).Error; err != nil {
		return nil, err
	}
	return stacks, nil
}

func (r *stackRepo) IncrementPopularity(ctx context.Context, stackID uint, delta uint) error {
	return r.db.WithContext(ctx).Model(&model.Stack{}).Where("id = ?", stackID).UpdateColumn("popularity", gorm.Expr("popularity + ?", delta)).Error
}
