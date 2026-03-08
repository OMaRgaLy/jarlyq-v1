package service

import (
	"context"
	"fmt"

	"github.com/example/jarlyq/internal/model"
	"github.com/example/jarlyq/internal/repository"
)

type CareerPathService interface {
	// GetAllPaths returns all available career paths
	GetAllPaths(ctx context.Context, limit, offset int) ([]model.CareerPath, error)
	// GetPathDetail returns full path details with stages
	GetPathDetail(ctx context.Context, pathID uint) (*model.CareerPath, error)
	// GetPathStages returns all stages for a path
	GetPathStages(ctx context.Context, pathID uint) ([]model.PathStage, error)
}

type careerPathService struct {
	repo repository.CareerPathRepository
}

func NewCareerPathService(repo repository.CareerPathRepository) CareerPathService {
	return &careerPathService{repo: repo}
}

func (s *careerPathService) GetAllPaths(ctx context.Context, limit, offset int) ([]model.CareerPath, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	paths, err := s.repo.GetAll(limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get all paths: %w", err)
	}

	return paths, nil
}

func (s *careerPathService) GetPathDetail(ctx context.Context, pathID uint) (*model.CareerPath, error) {
	if pathID == 0 {
		return nil, fmt.Errorf("invalid path id")
	}

	path, err := s.repo.GetByID(pathID)
	if err != nil {
		return nil, fmt.Errorf("get path by id: %w", err)
	}

	return path, nil
}

func (s *careerPathService) GetPathStages(ctx context.Context, pathID uint) ([]model.PathStage, error) {
	if pathID == 0 {
		return nil, fmt.Errorf("invalid path id")
	}

	stages, err := s.repo.GetStages(pathID)
	if err != nil {
		return nil, fmt.Errorf("get path stages: %w", err)
	}

	return stages, nil
}
