package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/seed"
)

func TestGetAllProjectIdeas(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.SeedProjectIdeas(db))

	repo := repository.NewProjectIdeaRepository(db)
	svc := NewProjectIdeaService(repo)

	ideas, err := svc.GetAll(context.Background(), "", "", 50, 0)
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(ideas), 36)
}

func TestGetProjectIdeasByDirection(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.SeedProjectIdeas(db))

	repo := repository.NewProjectIdeaRepository(db)
	svc := NewProjectIdeaService(repo)

	ideas, err := svc.GetAll(context.Background(), "backend", "", 20, 0)
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(ideas), 3)
	for _, idea := range ideas {
		require.Equal(t, "backend", idea.Direction)
	}
}

func TestGetProjectIdeasByDifficulty(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.SeedProjectIdeas(db))

	repo := repository.NewProjectIdeaRepository(db)
	svc := NewProjectIdeaService(repo)

	ideas, err := svc.GetAll(context.Background(), "", "beginner", 20, 0)
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(ideas), 3)
	for _, idea := range ideas {
		require.Equal(t, "beginner", idea.Difficulty)
	}
}

func TestGetProjectIdeasByDirectionAndDifficulty(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.SeedProjectIdeas(db))

	repo := repository.NewProjectIdeaRepository(db)
	svc := NewProjectIdeaService(repo)

	ideas, err := svc.GetAll(context.Background(), "frontend", "beginner", 20, 0)
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(ideas), 1)
	for _, idea := range ideas {
		require.Equal(t, "frontend", idea.Direction)
		require.Equal(t, "beginner", idea.Difficulty)
	}
}

func TestGetProjectIdeaByID(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.SeedProjectIdeas(db))

	repo := repository.NewProjectIdeaRepository(db)
	svc := NewProjectIdeaService(repo)

	idea, err := svc.GetByID(context.Background(), 1)
	require.NoError(t, err)
	require.NotNil(t, idea)
	require.NotEmpty(t, idea.Title)
	require.NotEmpty(t, idea.TechStack)
	require.NotEmpty(t, idea.WhyGood)
}

func TestGetProjectIdeaInvalidID(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewProjectIdeaRepository(db)
	svc := NewProjectIdeaService(repo)

	_, err := svc.GetByID(context.Background(), 0)
	require.Error(t, err)
}

func TestGetProjectDirections(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.SeedProjectIdeas(db))

	repo := repository.NewProjectIdeaRepository(db)
	svc := NewProjectIdeaService(repo)

	directions, err := svc.GetDirections(context.Background())
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(directions), 14)
}

func TestGetPopularProjectIdeas(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.SeedProjectIdeas(db))

	repo := repository.NewProjectIdeaRepository(db)
	svc := NewProjectIdeaService(repo)

	ideas, err := svc.GetPopular(context.Background(), 5)
	require.NoError(t, err)
	require.Len(t, ideas, 5)
	// Most liked first
	require.GreaterOrEqual(t, ideas[0].Likes, ideas[1].Likes)
}
