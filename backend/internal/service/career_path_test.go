package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/seed"
)

func TestGetAllCareerPaths(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewCareerPathRepository(db)
	svc := NewCareerPathService(repo)

	paths, err := svc.GetAllPaths(context.Background(), 10, 0)
	require.NoError(t, err)
	require.Len(t, paths, 5)
}

func TestGetAllCareerPathsPagination(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewCareerPathRepository(db)
	svc := NewCareerPathService(repo)

	paths, err := svc.GetAllPaths(context.Background(), 2, 0)
	require.NoError(t, err)
	require.Len(t, paths, 2)

	paths2, err := svc.GetAllPaths(context.Background(), 2, 2)
	require.NoError(t, err)
	require.Len(t, paths2, 2)
	require.NotEqual(t, paths[0].ID, paths2[0].ID)
}

func TestGetCareerPathDetail(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewCareerPathRepository(db)
	svc := NewCareerPathService(repo)

	path, err := svc.GetPathDetail(context.Background(), 1)
	require.NoError(t, err)
	require.NotNil(t, path)
	require.Equal(t, "Backend разработчик", path.Title)
}

func TestGetCareerPathDetailInvalidID(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewCareerPathRepository(db)
	svc := NewCareerPathService(repo)

	_, err := svc.GetPathDetail(context.Background(), 0)
	require.Error(t, err)
}

func TestGetCareerPathStages(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewCareerPathRepository(db)
	svc := NewCareerPathService(repo)

	// Get backend path ID
	var backendPath model.CareerPath
	require.NoError(t, db.Where("title = ?", "Backend разработчик").First(&backendPath).Error)

	stages, err := svc.GetPathStages(context.Background(), backendPath.ID)
	require.NoError(t, err)
	require.Len(t, stages, 6)
	require.Equal(t, "Основы программирования", stages[0].Title)
}
