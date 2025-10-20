package service

import (
	"context"

	"github.com/example/jarlyq/internal/model"
	"github.com/example/jarlyq/internal/repository"
)

// StackService handles stacks.
type StackService interface {
	List(ctx context.Context) ([]model.Stack, error)
}

type stackService struct {
	stacks repository.StackRepository
}

// NewStackService creates service.
func NewStackService(stacks repository.StackRepository) StackService {
	return &stackService{stacks: stacks}
}

func (s *stackService) List(ctx context.Context) ([]model.Stack, error) {
	return s.stacks.List(ctx)
}
