package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/repository"
)

func seedTestJobs(t *testing.T) (*jobService, repository.JobRepository) {
	db := setupTestDB(t)

	// Create test jobs directly
	jobs := []model.Job{
		{
			CompanyID:   1,
			Title:       "Go Developer",
			Description: "Build microservices",
			Level:       "junior",
			JobType:     "full-time",
			Location:    "Almaty",
			Countries:   "KZ",
			SalaryMin:   1000,
			SalaryMax:   2000,
			WorkFormat:  "Office",
			Views:       100,
		},
		{
			CompanyID:   1,
			Title:       "Python Developer",
			Description: "Data pipelines",
			Level:       "middle",
			JobType:     "full-time",
			Location:    "Remote",
			Countries:   "KZ,KG,UZ",
			SalaryMin:   2000,
			SalaryMax:   4000,
			WorkFormat:  "Remote",
			Views:       250,
		},
		{
			CompanyID:   2,
			Title:       "Frontend Intern",
			Description: "React internship",
			Level:       "intern",
			JobType:     "internship",
			Location:    "Bishkek",
			Countries:   "KG",
			SalaryMin:   0,
			SalaryMax:   500,
			WorkFormat:  "Office",
			Views:       50,
		},
	}

	for i := range jobs {
		require.NoError(t, db.Create(&jobs[i]).Error)
	}

	repo := repository.NewJobRepository(db)
	svc := &jobService{repo: repo}
	return svc, repo
}

func TestGetAllJobs(t *testing.T) {
	svc, _ := seedTestJobs(t)

	jobs, err := svc.GetAllJobs(context.Background(), repository.JobFilters{}, 20, 0)
	require.NoError(t, err)
	require.Len(t, jobs, 3)
}

func TestGetAllJobsFilterByLevel(t *testing.T) {
	svc, _ := seedTestJobs(t)

	jobs, err := svc.GetAllJobs(context.Background(), repository.JobFilters{Level: "junior"}, 20, 0)
	require.NoError(t, err)
	require.Len(t, jobs, 1)
	require.Equal(t, "Go Developer", jobs[0].Title)
}

func TestGetJobDetail(t *testing.T) {
	svc, _ := seedTestJobs(t)

	job, err := svc.GetJobDetail(context.Background(), 1)
	require.NoError(t, err)
	require.NotNil(t, job)
	require.Equal(t, "Go Developer", job.Title)
}

func TestGetJobDetailInvalidID(t *testing.T) {
	svc, _ := seedTestJobs(t)

	_, err := svc.GetJobDetail(context.Background(), 0)
	require.Error(t, err)
}

func TestGetJobsByCompany(t *testing.T) {
	svc, _ := seedTestJobs(t)

	jobs, err := svc.GetJobsByCompany(context.Background(), 1, 20, 0)
	require.NoError(t, err)
	require.Len(t, jobs, 2)
}

func TestGetPopularJobs(t *testing.T) {
	svc, _ := seedTestJobs(t)

	jobs, err := svc.GetPopularJobs(context.Background(), 2)
	require.NoError(t, err)
	require.Len(t, jobs, 2)
	// Most viewed first
	require.GreaterOrEqual(t, jobs[0].Views, jobs[1].Views)
}

func TestGetRemoteJobs(t *testing.T) {
	svc, _ := seedTestJobs(t)

	jobs, err := svc.GetRemoteJobs(context.Background(), 20, 0)
	require.NoError(t, err)
	require.Len(t, jobs, 1)
	require.Equal(t, "Python Developer", jobs[0].Title)
}

func TestGetJobsByLevel(t *testing.T) {
	svc, _ := seedTestJobs(t)

	jobs, err := svc.GetJobsByLevel(context.Background(), "intern", 20, 0)
	require.NoError(t, err)
	require.Len(t, jobs, 1)
	require.Equal(t, "Frontend Intern", jobs[0].Title)
}

func TestGetJobsByLevelEmpty(t *testing.T) {
	svc, _ := seedTestJobs(t)

	_, err := svc.GetJobsByLevel(context.Background(), "", 20, 0)
	require.Error(t, err)
}

func TestGetAllJobsLimitClamping(t *testing.T) {
	svc, _ := seedTestJobs(t)

	// Negative limit defaults to 20
	jobs, err := svc.GetAllJobs(context.Background(), repository.JobFilters{}, -5, 0)
	require.NoError(t, err)
	require.NotNil(t, jobs)

	// Over 100 clamped to 100
	jobs, err = svc.GetAllJobs(context.Background(), repository.JobFilters{}, 200, 0)
	require.NoError(t, err)
	require.NotNil(t, jobs)
}
