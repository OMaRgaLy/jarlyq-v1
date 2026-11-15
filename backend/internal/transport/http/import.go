package http

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// importRow is one spreadsheet line. Every value arrives as a string because it
// comes from a CSV; the handler validates and converts it.
type importRow struct {
	Company            string `json:"company"`
	CompanyCountry     string `json:"company_country"`
	CompanyWebsite     string `json:"company_website"`
	CompanyLogoURL     string `json:"company_logo_url"`
	CompanyDescription string `json:"company_description"`
	CompanyStacks      string `json:"company_stacks"` // "Go; Python; PostgreSQL"
	Type               string `json:"type"`
	Title              string `json:"title"`
	ApplyURL           string `json:"apply_url"`
	City               string `json:"city"`
	Country            string `json:"country"`
	WorkFormat         string `json:"work_format"`
	Level              string `json:"level"`
	SalaryMin          string `json:"salary_min"`
	SalaryMax          string `json:"salary_max"`
	SalaryCurrency     string `json:"salary_currency"`
	Deadline           string `json:"deadline"`
	YearRound          string `json:"year_round"`
	Stacks             string `json:"stacks"`
	Description        string `json:"description"`
	Requirements       string `json:"requirements"`
	PremiumHours       string `json:"premium_hours"`
}

type importRequest struct {
	DryRun bool        `json:"dry_run"`
	Rows   []importRow `json:"rows"`
}

type importResult struct {
	Row     int    `json:"row"` // spreadsheet line number (header is line 1)
	Status  string `json:"status"` // created | updated | error
	Message string `json:"message,omitempty"`
}

var countryAliases = map[string]string{
	"kazakhstan": "KZ", "казахстан": "KZ", "uzbekistan": "UZ", "узбекистан": "UZ",
	"kyrgyzstan": "KG", "кыргызстан": "KG", "киргизия": "KG", "tajikistan": "TJ", "таджикистан": "TJ",
	"turkmenistan": "TM", "туркменистан": "TM", "russia": "RU", "россия": "RU", "belarus": "BY", "беларусь": "BY",
	"georgia": "GE", "грузия": "GE", "armenia": "AM", "армения": "AM", "azerbaijan": "AZ", "азербайджан": "AZ",
	"turkey": "TR", "турция": "TR", "usa": "US", "сша": "US", "uk": "GB", "великобритания": "GB",
	"germany": "DE", "германия": "DE", "poland": "PL", "польша": "PL", "uae": "AE", "оаэ": "AE",
}

func normCountry(s string) (string, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return "", nil
	}
	if code, ok := countryAliases[strings.ToLower(s)]; ok {
		return code, nil
	}
	if len(s) == 2 {
		return strings.ToUpper(s), nil
	}
	return "", fmt.Errorf("unknown country %q (use a 2-letter code like KZ)", s)
}

func normType(s string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "", "internship", "стажировка", "intern":
		return "internship", nil
	case "vacancy", "вакансия", "job", "работа":
		return "vacancy", nil
	}
	return "", fmt.Errorf("type must be internship or vacancy, got %q", s)
}

func normWorkFormat(s string) (string, error) {
	v := strings.ToLower(strings.TrimSpace(s))
	switch {
	case v == "":
		return "", nil
	case v == "office" || strings.HasPrefix(v, "офис"):
		return "office", nil
	case v == "remote" || strings.HasPrefix(v, "удал"):
		return "remote", nil
	case v == "hybrid" || strings.HasPrefix(v, "гибрид"):
		return "hybrid", nil
	}
	return "", fmt.Errorf("work_format must be office, remote or hybrid, got %q", s)
}

func parseImportDate(s string) (*time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, nil
	}
	for _, layout := range []string{"2006-01-02", "02.01.2006", "2.1.2006"} {
		if t, err := time.Parse(layout, s); err == nil {
			return &t, nil
		}
	}
	return nil, fmt.Errorf("deadline %q: use YYYY-MM-DD or DD.MM.YYYY", s)
}

func parseImportInt(field, s string) (int, error) {
	s = strings.ReplaceAll(strings.TrimSpace(s), " ", "")
	if s == "" {
		return 0, nil
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 0 {
		return 0, fmt.Errorf("%s must be a non-negative whole number", field)
	}
	return n, nil
}

func truthy(s string) bool {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "1", "true", "yes", "y", "да", "+":
		return true
	}
	return false
}

func splitList(s string) []string {
	var out []string
	for _, part := range strings.FieldsFunc(s, func(r rune) bool { return r == ';' || r == ',' || r == '|' }) {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	return out
}

// ensureStacks finds stacks by name (case-insensitive), creating missing ones.
func ensureStacks(tx *gorm.DB, names []string) ([]model.Stack, error) {
	var out []model.Stack
	for _, name := range names {
		if len(name) > 120 {
			return nil, fmt.Errorf("stack name too long: %q", name)
		}
		var s model.Stack
		err := tx.Where("LOWER(name) = ?", strings.ToLower(name)).First(&s).Error
		if err == gorm.ErrRecordNotFound {
			s = model.Stack{Name: name}
			err = tx.Create(&s).Error
		}
		if err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, nil
}

// POST /admin/import — create or update companies and their postings from spreadsheet rows.
// With dry_run=true everything runs inside a transaction that is rolled back, so the
// admin sees exactly what would happen before committing. Re-importing the same sheet
// updates postings (matched by company + title + type) instead of duplicating them.
func (h *Handler) adminImport(c *gin.Context) {
	var req importRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request data"})
		return
	}
	if len(req.Rows) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no rows"})
		return
	}
	if len(req.Rows) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "max 500 rows per import"})
		return
	}

	tx := h.Services.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to start import"})
		return
	}

	results := make([]importResult, 0, len(req.Rows))
	created, updated, failed := 0, 0, 0
	for i, row := range req.Rows {
		res := importResult{Row: i + 2}
		// Nested Transaction = SAVEPOINT: one bad row never poisons the rest.
		err := tx.Transaction(func(sp *gorm.DB) error {
			status, err := h.importOne(sp, row)
			res.Status = status
			return err
		})
		if err != nil {
			res.Status = "error"
			res.Message = err.Error()
			failed++
		} else if res.Status == "created" {
			created++
		} else {
			updated++
		}
		results = append(results, res)
	}

	if req.DryRun {
		tx.Rollback()
	} else if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save import"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"dry_run": req.DryRun, "created": created, "updated": updated, "errors": failed, "results": results,
	})
}

func (h *Handler) importOne(tx *gorm.DB, row importRow) (string, error) {
	name := strings.TrimSpace(row.Company)
	title := strings.TrimSpace(row.Title)
	if name == "" {
		return "", fmt.Errorf("company is required")
	}
	if title == "" {
		return "", fmt.Errorf("title is required")
	}
	if len([]rune(name)) > 255 || len([]rune(title)) > 255 {
		return "", fmt.Errorf("company/title too long (max 255)")
	}
	typ, err := normType(row.Type)
	if err != nil {
		return "", err
	}
	wf, err := normWorkFormat(row.WorkFormat)
	if err != nil {
		return "", err
	}
	country, err := normCountry(row.Country)
	if err != nil {
		return "", err
	}
	companyCountry, err := normCountry(row.CompanyCountry)
	if err != nil {
		return "", err
	}
	deadline, err := parseImportDate(row.Deadline)
	if err != nil {
		return "", err
	}
	salaryMin, err := parseImportInt("salary_min", row.SalaryMin)
	if err != nil {
		return "", err
	}
	salaryMax, err := parseImportInt("salary_max", row.SalaryMax)
	if err != nil {
		return "", err
	}
	if salaryMax > 0 && salaryMin > salaryMax {
		return "", fmt.Errorf("salary_min is greater than salary_max")
	}
	hours := 0
	if strings.TrimSpace(row.PremiumHours) != "" {
		if hours, err = parseImportInt("premium_hours", row.PremiumHours); err != nil {
			return "", err
		}
	}
	for field, val := range map[string]string{
		"apply_url": row.ApplyURL, "company_website": row.CompanyWebsite, "company_logo_url": row.CompanyLogoURL,
	} {
		if strings.TrimSpace(val) != "" && safeURL(val) == "" {
			return "", fmt.Errorf("%s must start with http:// or https://", field)
		}
	}
	oppStacks, err := ensureStacks(tx, splitList(row.Stacks))
	if err != nil {
		return "", err
	}
	companyStacks, err := ensureStacks(tx, splitList(row.CompanyStacks))
	if err != nil {
		return "", err
	}

	// Company: reuse by case-insensitive name; fill only the blanks of an existing one.
	var company model.Company
	err = tx.Where("LOWER(name) = ?", strings.ToLower(name)).First(&company).Error
	if err == gorm.ErrRecordNotFound {
		company = model.Company{
			Name:        name,
			Country:     companyCountry,
			LogoURL:     safeURL(row.CompanyLogoURL),
			Description: strings.TrimSpace(row.CompanyDescription),
			IsActive:    true,
			Source:      "import",
		}
		company.Contacts.Website = safeURL(row.CompanyWebsite)
		err = tx.Create(&company).Error
	} else if err == nil {
		fill := map[string]interface{}{}
		if company.Country == "" && companyCountry != "" {
			fill["country"] = companyCountry
		}
		if company.LogoURL == "" && safeURL(row.CompanyLogoURL) != "" {
			fill["logo_url"] = safeURL(row.CompanyLogoURL)
		}
		if company.Description == "" && strings.TrimSpace(row.CompanyDescription) != "" {
			fill["description"] = strings.TrimSpace(row.CompanyDescription)
		}
		if company.Contacts.Website == "" && safeURL(row.CompanyWebsite) != "" {
			fill["contact_website"] = safeURL(row.CompanyWebsite)
		}
		if len(fill) > 0 {
			err = tx.Model(&company).Updates(fill).Error
		}
	}
	if err != nil {
		return "", err
	}
	if len(companyStacks) > 0 {
		if err := tx.Model(&company).Association("Stack").Append(companyStacks); err != nil {
			return "", err
		}
	}

	// Opportunity: same company + title + type → update, otherwise create.
	status := "updated"
	var opp model.Opportunity
	err = tx.Where("company_id = ? AND LOWER(title) = ? AND type = ?", company.ID, strings.ToLower(title), typ).First(&opp).Error
	if err == gorm.ErrRecordNotFound {
		status = "created"
		opp = model.Opportunity{CompanyID: company.ID, Type: typ, Title: title, IsActive: true, Source: "import"}
	} else if err != nil {
		return "", err
	}
	opp.Description = strings.TrimSpace(row.Description)
	opp.Requirements = strings.TrimSpace(row.Requirements)
	opp.ApplyURL = safeURL(row.ApplyURL)
	opp.City = strings.TrimSpace(row.City)
	opp.Country = country
	opp.WorkFormat = wf
	opp.Level = strings.TrimSpace(row.Level)
	opp.SalaryMin, opp.SalaryMax = salaryMin, salaryMax
	opp.SalaryCurrency = strings.ToUpper(strings.TrimSpace(row.SalaryCurrency))
	opp.Deadline = deadline
	opp.IsYearRound = truthy(row.YearRound)
	if strings.TrimSpace(row.PremiumHours) != "" {
		applyPremiumWindow(&opp, &hours)
	}
	if err := tx.Save(&opp).Error; err != nil {
		return "", err
	}
	if len(oppStacks) > 0 {
		if err := tx.Model(&opp).Association("Stack").Replace(oppStacks); err != nil {
			return "", err
		}
	}
	return status, nil
}
