package service

import (
	"context"
	"fmt"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

type ProjectIdeaService interface {
	GetAll(ctx context.Context, direction, difficulty string, limit, offset int) ([]model.ProjectIdea, error)
	GetByID(ctx context.Context, id uint) (*model.ProjectIdea, error)
	GetDirections(ctx context.Context) ([]string, error)
	GetByDirection(ctx context.Context, direction string, limit, offset int) ([]model.ProjectIdea, error)
	GetPopular(ctx context.Context, limit int) ([]model.ProjectIdea, error)
}

type projectIdeaService struct {
	repo repository.ProjectIdeaRepository
}

func NewProjectIdeaService(repo repository.ProjectIdeaRepository) ProjectIdeaService {
	return &projectIdeaService{repo: repo}
}

func (s *projectIdeaService) GetAll(ctx context.Context, direction, difficulty string, limit, offset int) ([]model.ProjectIdea, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	ideas, err := s.repo.GetAll(direction, difficulty, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get project ideas: %w", err)
	}
	return ideas, nil
}

func (s *projectIdeaService) GetByID(ctx context.Context, id uint) (*model.ProjectIdea, error) {
	if id == 0 {
		return nil, fmt.Errorf("invalid idea id")
	}

	idea, err := s.repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("get project idea: %w", err)
	}
	return idea, nil
}

func (s *projectIdeaService) GetDirections(ctx context.Context) ([]string, error) {
	directions, err := s.repo.GetDirections()
	if err != nil {
		return nil, fmt.Errorf("get directions: %w", err)
	}
	return directions, nil
}

func (s *projectIdeaService) GetByDirection(ctx context.Context, direction string, limit, offset int) ([]model.ProjectIdea, error) {
	if direction == "" {
		return nil, fmt.Errorf("direction required")
	}
	if limit <= 0 {
		limit = 20
	}

	ideas, err := s.repo.GetByDirection(direction, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get ideas by direction: %w", err)
	}
	return ideas, nil
}

func (s *projectIdeaService) GetPopular(ctx context.Context, limit int) ([]model.ProjectIdea, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	ideas, err := s.repo.GetPopular(limit)
	if err != nil {
		return nil, fmt.Errorf("get popular ideas: %w", err)
	}
	return ideas, nil
}
