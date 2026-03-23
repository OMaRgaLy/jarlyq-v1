package repository

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// SchoolRepository handles school persistence.
type SchoolRepository interface {
	List(ctx context.Context, filter EducationFilter) ([]model.School, error)
	FindByID(ctx context.Context, id uint) (*model.School, error)
	Create(ctx context.Context, school *model.School) error
	Update(ctx context.Context, school *model.School) error
}

// CourseRepository handles courses.
type CourseRepository interface {
	ListBySchool(ctx context.Context, schoolID uint) ([]model.Course, error)
	Create(ctx context.Context, course *model.Course) error
}

// EducationFilter filters schools/courses.
type EducationFilter struct {
	StackIDs  []uint
	RegionIDs []uint
	Limit     int
	Offset    int
}

type schoolRepo struct {
	db *gorm.DB
}

type courseRepo struct {
	db *gorm.DB
}

// NewSchoolRepository returns repo.
func NewSchoolRepository(db *gorm.DB) SchoolRepository {
	return &schoolRepo{db: db}
}

// NewCourseRepository returns repo.
func NewCourseRepository(db *gorm.DB) CourseRepository {
	return &courseRepo{db: db}
}

func (r *schoolRepo) List(ctx context.Context, filter EducationFilter) ([]model.School, error) {
	query := r.db.WithContext(ctx).Model(&model.School{}).Preload("Courses").Preload("Courses.Stack").Preload("Courses.Regions")
	if len(filter.StackIDs) > 0 {
		query = query.Joins("JOIN courses ON courses.school_id = schools.id").Joins("JOIN course_stacks cs ON cs.course_id = courses.id").Where("cs.stack_id IN ?", filter.StackIDs).Group("schools.id")
	}
	if len(filter.RegionIDs) > 0 {
		query = query.Joins("JOIN course_regions cr ON cr.course_id = courses.id").Where("cr.region_id IN ?", filter.RegionIDs).Group("schools.id")
	}
	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	query = query.Offset(filter.Offset).Limit(limit)

	var schools []model.School
	if err := query.Find(&schools).Error; err != nil {
		return nil, err
	}
	return schools, nil
}

func (r *schoolRepo) FindByID(ctx context.Context, id uint) (*model.School, error) {
	var school model.School
	if err := r.db.WithContext(ctx).Preload("Courses").Preload("Courses.Stack").Preload("Courses.Regions").First(&school, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &school, nil
}

func (r *schoolRepo) Create(ctx context.Context, school *model.School) error {
	return r.db.WithContext(ctx).Create(school).Error
}

func (r *schoolRepo) Update(ctx context.Context, school *model.School) error {
	return r.db.WithContext(ctx).Session(&gorm.Session{FullSaveAssociations: true}).Save(school).Error
}

func (r *courseRepo) ListBySchool(ctx context.Context, schoolID uint) ([]model.Course, error) {
	var courses []model.Course
	if err := r.db.WithContext(ctx).Where("school_id = ?", schoolID).Preload("Stack").Preload("Regions").Find(&courses).Error; err != nil {
		return nil, err
	}
	return courses, nil
}

func (r *courseRepo) Create(ctx context.Context, course *model.Course) error {
	return r.db.WithContext(ctx).Create(course).Error
}
