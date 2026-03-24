package service

import (
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

type SuggestionService interface {
	Submit(s *model.Suggestion) error
	List(status string) ([]model.Suggestion, error)
	Review(id uint, status, notes string) error
}

type suggestionSvc struct{ repo repository.SuggestionRepository }

func NewSuggestionService(repo repository.SuggestionRepository) SuggestionService {
	return &suggestionSvc{repo}
}

func (s *suggestionSvc) Submit(sug *model.Suggestion) error {
	sug.Status = "pending"
	return s.repo.Create(sug)
}

func (s *suggestionSvc) List(status string) ([]model.Suggestion, error) {
	return s.repo.List(status)
}

func (s *suggestionSvc) Review(id uint, status, notes string) error {
	return s.repo.UpdateStatus(id, status, notes)
}
