package http

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

func TestNormCountry(t *testing.T) {
	for in, want := range map[string]string{"": "", "kz": "KZ", " UZ ": "UZ", "Казахстан": "KZ", "kyrgyzstan": "KG"} {
		got, err := normCountry(in)
		require.NoError(t, err, in)
		require.Equal(t, want, got, in)
	}
	_, err := normCountry("Narnia")
	require.Error(t, err)
}

func TestNormTypeAndWorkFormat(t *testing.T) {
	for in, want := range map[string]string{"": "internship", "Стажировка": "internship", "vacancy": "vacancy", "Вакансия": "vacancy"} {
		got, err := normType(in)
		require.NoError(t, err, in)
		require.Equal(t, want, got, in)
	}
	_, err := normType("gig")
	require.Error(t, err)

	for in, want := range map[string]string{"": "", "Офис": "office", "гибрид": "hybrid", "Удалённо": "remote", "remote": "remote"} {
		got, err := normWorkFormat(in)
		require.NoError(t, err, in)
		require.Equal(t, want, got, in)
	}
	_, err = normWorkFormat("teleport")
	require.Error(t, err)
}

func TestParseImportDate(t *testing.T) {
	d, err := parseImportDate("31.12.2026")
	require.NoError(t, err)
	require.Equal(t, "2026-12-31", d.Format("2006-01-02"))

	d, err = parseImportDate("2026-01-05")
	require.NoError(t, err)
	require.Equal(t, "2026-01-05", d.Format("2006-01-02"))

	d, err = parseImportDate("  ")
	require.NoError(t, err)
	require.Nil(t, d)

	_, err = parseImportDate("tomorrow")
	require.Error(t, err)
}

func TestSplitListAcceptsAnySeparator(t *testing.T) {
	require.Equal(t, []string{"Go", "PostgreSQL", "Redis"}, splitList("Go; PostgreSQL, Redis |"))
	require.Empty(t, splitList("  "))
}

func TestApplyPremiumWindow(t *testing.T) {
	opp := &model.Opportunity{}

	applyPremiumWindow(opp, nil)
	require.Nil(t, opp.PremiumUntil, "nil leaves it unchanged")

	h := 24
	applyPremiumWindow(opp, &h)
	require.NotNil(t, opp.PremiumUntil)
	require.WithinDuration(t, time.Now().Add(24*time.Hour), *opp.PremiumUntil, time.Minute)

	zero := 0
	applyPremiumWindow(opp, &zero)
	require.Nil(t, opp.PremiumUntil, "0 removes the lock")

	huge := 100000
	applyPremiumWindow(opp, &huge)
	require.WithinDuration(t, time.Now().Add(168*time.Hour), *opp.PremiumUntil, time.Minute, "capped at one week")
}

func newImportTestHandler(t *testing.T) (*Handler, *gorm.DB) {
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, model.AutoMigrate(db))
	return &Handler{}, db
}

func TestImportOneIsIdempotentAndSafe(t *testing.T) {
	h, db := newImportTestHandler(t)

	row := importRow{
		Company: "Acme", CompanyCountry: "Казахстан", CompanyStacks: "Go; PostgreSQL",
		Title: "Backend Intern", ApplyURL: "https://acme.test/apply", Deadline: "31.12.2026",
		WorkFormat: "гибрид", Stacks: "Go",
	}

	status, err := h.importOne(db, row)
	require.NoError(t, err)
	require.Equal(t, "created", status)

	// Same row again (even with a differently-cased company) must update, not duplicate.
	row.Company = "ACME"
	row.City = "Алматы"
	status, err = h.importOne(db, row)
	require.NoError(t, err)
	require.Equal(t, "updated", status)

	var companies, opps int64
	db.Model(&model.Company{}).Count(&companies)
	db.Model(&model.Opportunity{}).Count(&opps)
	require.EqualValues(t, 1, companies)
	require.EqualValues(t, 1, opps)

	var opp model.Opportunity
	require.NoError(t, db.First(&opp).Error)
	require.Equal(t, "Алматы", opp.City)
	require.Equal(t, "hybrid", opp.WorkFormat)
	require.True(t, opp.IsActive)

	// A dangerous link is rejected before anything is written.
	_, err = h.importOne(db, importRow{Company: "Evil Co", Title: "x", ApplyURL: "javascript:alert(1)"})
	require.Error(t, err)
	var evil int64
	db.Model(&model.Company{}).Where("name = ?", "Evil Co").Count(&evil)
	require.EqualValues(t, 0, evil, "validation must happen before the company is created")
}
