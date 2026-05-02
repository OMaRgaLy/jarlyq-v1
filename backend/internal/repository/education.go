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
	Delete(ctx context.Context, id uint) error
}

// CourseRepository handles courses.
type CourseRepository interface {
	ListBySchool(ctx context.Context, schoolID uint) ([]model.Course, error)
	FindByID(ctx context.Context, id uint) (*model.Course, error)
	Create(ctx context.Context, course *model.Course) error
	Update(ctx context.Context, course *model.Course) error
	Delete(ctx context.Context, id uint) error
	ListMasters(ctx context.Context, filter MasterFilter) ([]MasterCourseRow, error)
}

// EducationFilter filters schools/courses.
type EducationFilter struct {
	StackIDs  []uint
	RegionIDs []uint
	Limit     int
	Offset    int
}

// MasterFilter filters master programs.
type MasterFilter struct {
	Country     string
	Language    string
	Scholarship bool
	Limit       int
	Offset      int
}

// MasterCourseRow is a flat projection for the /masters endpoint.
type MasterCourseRow struct {
	CourseID             uint   `json:"courseId"`
	CourseTitle          string `json:"courseTitle"`
	Description          string `json:"description,omitempty"`
	ExternalURL          string `json:"externalURL,omitempty"`
	Price                int    `json:"price,omitempty"`
	PriceCurrency        string `json:"priceCurrency,omitempty"`
	DurationWeeks        int    `json:"durationWeeks,omitempty"`
	Format               string `json:"format,omitempty"`
	Language             string `json:"language,omitempty"`
	ScholarshipAvailable bool   `json:"scholarshipAvailable"`
	ApplicationDeadline  string `json:"applicationDeadline,omitempty"`
	SchoolID             uint   `json:"schoolId"`
	SchoolName           string `json:"schoolName"`
	SchoolLogoURL        string `json:"schoolLogoURL,omitempty"`
	SchoolCountry        string `json:"schoolCountry,omitempty"`
	SchoolType           string `json:"schoolType,omitempty"`
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
	query := r.db.WithContext(ctx).Model(&model.School{}).Where("is_active = ?", true).Preload("Courses").Preload("Courses.Stack").Preload("Courses.Regions")
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
	if err := r.db.WithContext(ctx).Where("is_active = ?", true).Preload("Courses").Preload("Courses.Stack").Preload("Courses.Regions").First(&school, id).Error; err != nil {
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

func (r *schoolRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.School{}, id).Error
}

func (r *courseRepo) ListBySchool(ctx context.Context, schoolID uint) ([]model.Course, error) {
	var courses []model.Course
	if err := r.db.WithContext(ctx).Where("school_id = ?", schoolID).Preload("Stack").Preload("Regions").Find(&courses).Error; err != nil {
		return nil, err
	}
	return courses, nil
}

func (r *courseRepo) FindByID(ctx context.Context, id uint) (*model.Course, error) {
	var course model.Course
	if err := r.db.WithContext(ctx).Preload("Stack").Preload("Regions").First(&course, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &course, nil
}

func (r *courseRepo) Create(ctx context.Context, course *model.Course) error {
	return r.db.WithContext(ctx).Create(course).Error
}

func (r *courseRepo) Update(ctx context.Context, course *model.Course) error {
	return r.db.WithContext(ctx).Save(course).Error
}

func (r *courseRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Course{}, id).Error
}

func (r *courseRepo) ListMasters(ctx context.Context, filter MasterFilter) ([]MasterCourseRow, error) {
	query := r.db.WithContext(ctx).
		Table("courses").
		Select(`courses.id AS course_id, courses.title AS course_title,
			courses.description, courses.external_url, courses.price,
			courses.price_currency, courses.duration_weeks, courses.format,
			courses.language, courses.scholarship_available, courses.application_deadline,
			schools.id AS school_id, schools.name AS school_name,
			schools.logo_url AS school_logo_url, schools.country AS school_country,
			schools.type AS school_type`).
		Joins("JOIN schools ON schools.id = courses.school_id").
		Where("courses.level = ?", "master")

	if filter.Country != "" {
		query = query.Where("schools.country = ?", filter.Country)
	}
	if filter.Language != "" {
		query = query.Where("courses.language = ?", filter.Language)
	}
	if filter.Scholarship {
		query = query.Where("courses.scholarship_available = true")
	}

	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var rows []MasterCourseRow
	return rows, query.Order("schools.country, schools.name").Offset(filter.Offset).Limit(limit).Scan(&rows).Error
}
