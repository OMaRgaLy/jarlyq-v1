package service

import (
	"context"
	"fmt"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

type InterviewService interface {
	// GetQuestions returns interview questions with optional filters
	GetQuestions(ctx context.Context, level, topic string, limit, offset int) ([]model.InterviewQuestion, error)
	// GetQuestion returns a single question with detailed answer
	GetQuestion(ctx context.Context, questionID uint) (*model.InterviewQuestion, error)
	// GetPathQuestions returns questions for a specific career path
	GetPathQuestions(ctx context.Context, pathID uint, limit, offset int) ([]model.InterviewQuestion, error)
	// GetStageQuestions returns questions for a specific path stage
	GetStageQuestions(ctx context.Context, stageID uint) ([]model.InterviewQuestion, error)
	// GetTopics returns most popular interview topics
	GetTopics(ctx context.Context) ([]string, error)
}

type interviewService struct {
	repo repository.InterviewQuestionRepository
}

func NewInterviewService(repo repository.InterviewQuestionRepository) InterviewService {
	return &interviewService{repo: repo}
}

func (s *interviewService) GetQuestions(ctx context.Context, level, topic string, limit, offset int) ([]model.InterviewQuestion, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	questions, err := s.repo.GetAll(level, topic, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get questions: %w", err)
	}

	return questions, nil
}

func (s *interviewService) GetQuestion(ctx context.Context, questionID uint) (*model.InterviewQuestion, error) {
	if questionID == 0 {
		return nil, fmt.Errorf("invalid question id")
	}

	question, err := s.repo.GetByID(questionID)
	if err != nil {
		return nil, fmt.Errorf("get question: %w", err)
	}

	return question, nil
}

func (s *interviewService) GetPathQuestions(ctx context.Context, pathID uint, limit, offset int) ([]model.InterviewQuestion, error) {
	if pathID == 0 {
		return nil, fmt.Errorf("invalid path id")
	}

	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	questions, err := s.repo.GetByPathID(pathID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("get path questions: %w", err)
	}

	return questions, nil
}

func (s *interviewService) GetStageQuestions(ctx context.Context, stageID uint) ([]model.InterviewQuestion, error) {
	if stageID == 0 {
		return nil, fmt.Errorf("invalid stage id")
	}

	questions, err := s.repo.GetByStageID(stageID)
	if err != nil {
		return nil, fmt.Errorf("get stage questions: %w", err)
	}

	return questions, nil
}

func (s *interviewService) GetTopics(ctx context.Context) ([]string, error) {
	topics, err := s.repo.GetTopTopics()
	if err != nil {
		return nil, fmt.Errorf("get topics: %w", err)
	}

	return topics, nil
}
