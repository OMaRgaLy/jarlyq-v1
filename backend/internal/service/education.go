package service

import (
	"context"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

// EducationService handles schools and courses.
type EducationService interface {
	ListSchools(ctx context.Context, filter repository.EducationFilter) ([]model.School, error)
	GetSchool(ctx context.Context, id uint) (*model.School, error)
	CreateSchool(ctx context.Context, school *model.School) error
	UpdateSchool(ctx context.Context, school *model.School) error
	DeleteSchool(ctx context.Context, id uint) error
	ListMasters(ctx context.Context, filter repository.MasterFilter) ([]repository.MasterCourseRow, error)
}

type educationService struct {
	schools repository.SchoolRepository
	courses repository.CourseRepository
}

// NewEducationService returns service.
func NewEducationService(schools repository.SchoolRepository, courses repository.CourseRepository) EducationService {
	return &educationService{schools: schools, courses: courses}
}

func (s *educationService) ListSchools(ctx context.Context, filter repository.EducationFilter) ([]model.School, error) {
	return s.schools.List(ctx, filter)
}

func (s *educationService) GetSchool(ctx context.Context, id uint) (*model.School, error) {
	return s.schools.FindByID(ctx, id)
}

func (s *educationService) CreateSchool(ctx context.Context, school *model.School) error {
	return s.schools.Create(ctx, school)
}

func (s *educationService) UpdateSchool(ctx context.Context, school *model.School) error {
	return s.schools.Update(ctx, school)
}

func (s *educationService) DeleteSchool(ctx context.Context, id uint) error {
	return s.schools.Delete(ctx, id)
}

func (s *educationService) ListMasters(ctx context.Context, filter repository.MasterFilter) ([]repository.MasterCourseRow, error) {
	return s.courses.ListMasters(ctx, filter)
}
