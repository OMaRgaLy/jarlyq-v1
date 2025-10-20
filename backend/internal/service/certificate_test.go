package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/example/jarlyq/internal/model"
	"github.com/example/jarlyq/internal/repository"
)

func TestCertificateVerify(t *testing.T) {
	db := setupTestDB(t)
	repo := repository.NewCertificateRepository(db)
	svc := NewCertificateService(repo)

	cert := &model.Certificate{Code: "ABC123", Type: "school", IssuerName: "Test School", IssuerType: "school", Recipient: "Dana", IssuedDate: time.Now()}
	require.NoError(t, repo.Create(context.Background(), cert))

	fetched, err := svc.Verify(context.Background(), "ABC123")
	require.NoError(t, err)
	require.Equal(t, cert.ID, fetched.ID)

	_, err = svc.Verify(context.Background(), "missing")
	require.Error(t, err)
}
