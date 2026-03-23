package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/seed"
)

func TestGetInterviewQuestions(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewInterviewQuestionRepository(db)
	svc := NewInterviewService(repo)

	questions, err := svc.GetQuestions(context.Background(), "", "", 20, 0)
	require.NoError(t, err)
	require.Len(t, questions, 8)
}

func TestGetInterviewQuestionsFilterByLevel(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewInterviewQuestionRepository(db)
	svc := NewInterviewService(repo)

	questions, err := svc.GetQuestions(context.Background(), "easy", "", 20, 0)
	require.NoError(t, err)
	for _, q := range questions {
		require.Equal(t, "easy", q.Level)
	}
}

func TestGetInterviewQuestionsFilterByTopic(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewInterviewQuestionRepository(db)
	svc := NewInterviewService(repo)

	questions, err := svc.GetQuestions(context.Background(), "", "Python", 20, 0)
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(questions), 1)
	for _, q := range questions {
		require.Equal(t, "Python", q.Topic)
	}
}

func TestGetInterviewQuestion(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewInterviewQuestionRepository(db)
	svc := NewInterviewService(repo)

	q, err := svc.GetQuestion(context.Background(), 1)
	require.NoError(t, err)
	require.NotNil(t, q)
	require.NotEmpty(t, q.Question)
	require.NotEmpty(t, q.Answer)
}

func TestGetInterviewQuestionInvalidID(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewInterviewQuestionRepository(db)
	svc := NewInterviewService(repo)

	_, err := svc.GetQuestion(context.Background(), 0)
	require.Error(t, err)
}

func TestGetInterviewTopics(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewInterviewQuestionRepository(db)
	svc := NewInterviewService(repo)

	topics, err := svc.GetTopics(context.Background())
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(topics), 1)
}

func TestGetInterviewQuestionsLimitClamping(t *testing.T) {
	db := setupTestDB(t)
	require.NoError(t, seed.Seed(db))

	repo := repository.NewInterviewQuestionRepository(db)
	svc := NewInterviewService(repo)

	// Negative limit should default to 20
	questions, err := svc.GetQuestions(context.Background(), "", "", -1, 0)
	require.NoError(t, err)
	require.NotNil(t, questions)
}
