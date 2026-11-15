package http

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gorm.io/gorm/clause"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
)

// reminderDays are the "N days before the deadline" moments a saved
// opportunity triggers a Telegram nudge.
var reminderDays = []int{7, 3, 1}

// StartDeadlineReminders launches a background worker that checks hourly and
// sends each reminder at most once. It does nothing when no Telegram bot is configured.
func (h *Handler) StartDeadlineReminders(ctx context.Context) {
	if h.Config.TelegramBotToken == "" {
		return
	}
	go func() {
		// Short delay so startup (migrations, seed) finishes first.
		timer := time.NewTimer(30 * time.Second)
		defer timer.Stop()
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-timer.C:
				h.runDeadlineReminders()
			case <-ticker.C:
				h.runDeadlineReminders()
			}
		}
	}()
}

type reminderRow struct {
	UserID        uint
	OpportunityID uint
	ChatID        string
	Title         string
	CompanyName   string
	Type          string
	DaysLeft      int
}

func (h *Handler) runDeadlineReminders() {
	var rows []reminderRow
	err := h.Services.DB.Raw(`
		SELECT ua.user_id, ua.opportunity_id, u.telegram_chat_id AS chat_id,
		       o.title, c.name AS company_name, o.type,
		       (o.deadline::date - CURRENT_DATE) AS days_left
		FROM user_applications ua
		JOIN users u ON u.id = ua.user_id AND u.telegram_chat_id <> ''
		JOIN opportunities o ON o.id = ua.opportunity_id AND o.is_active = true
		LEFT JOIN companies c ON c.id = o.company_id
		WHERE ua.status = 'saved'
		  AND o.is_year_round = false
		  AND o.deadline IS NOT NULL
		  AND (o.deadline::date - CURRENT_DATE) IN ?`, reminderDays).Scan(&rows).Error
	if err != nil {
		h.Logger.Warnf("deadline reminders: %v", err)
		return
	}
	for _, r := range rows {
		rec := model.DeadlineReminder{UserID: r.UserID, OpportunityID: r.OpportunityID, DaysBefore: r.DaysLeft}
		res := h.Services.DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&rec)
		if res.Error != nil || res.RowsAffected == 0 {
			continue // already reminded for this threshold
		}
		page := "internships"
		if r.Type == "vacancy" {
			page = "jobs"
		}
		day := "дн."
		if r.DaysLeft == 1 {
			day = "день"
		}
		text := fmt.Sprintf("⏰ Дедлайн через %d %s\n\n%s — %s\n\nОткликнись, пока не закрылось: %s/%s/%d",
			r.DaysLeft, day, r.Title, r.CompanyName, h.Config.AppBaseURL, page, r.OpportunityID)
		h.tgSendPlain(r.ChatID, text)
	}
}

// tgSendPlain sends a message without Markdown parsing (titles may contain _ * [ ).
func (h *Handler) tgSendPlain(chatID, text string) {
	if h.Config.TelegramBotToken == "" {
		return
	}
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", h.Config.TelegramBotToken)
	body, _ := json.Marshal(map[string]interface{}{"chat_id": chatID, "text": text})
	resp, err := http.Post(url, "application/json", bytes.NewReader(body)) //nolint:gosec
	if err == nil {
		resp.Body.Close()
	}
}
