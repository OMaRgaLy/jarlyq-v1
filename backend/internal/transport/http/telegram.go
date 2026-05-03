package http

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/middleware"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/model"
	"github.com/OMaRgaLy/jarlyq-v1/backend/internal/auth"
)

func newTelegramRoutes(group *gin.RouterGroup, handler *Handler, jwt auth.Manager) {
	// Authenticated: user requests a link code
	group.POST("/link-code", middleware.JWTAuth(jwt), handler.telegramGenLinkCode)
	// Authenticated: user disconnects Telegram
	group.DELETE("/link", middleware.JWTAuth(jwt), handler.telegramUnlink)
	// Authenticated: status (is linked?)
	group.GET("/status", middleware.JWTAuth(jwt), handler.telegramStatus)
	// Public: called by Telegram servers (webhook)
	group.POST("/webhook", handler.telegramWebhook)
}

// ─── POST /telegram/link-code — generate a short-lived link code ─────────────

func (h *Handler) telegramGenLinkCode(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Expire any existing codes for this user
	h.Services.DB.Where("user_id = ?", userID).Delete(&model.TelegramLinkCode{})

	code := fmt.Sprintf("JARLYQ-%s", randomUpperCode(6))
	linkCode := model.TelegramLinkCode{
		UserID:    userID,
		Code:      code,
		ExpiresAt: time.Now().Add(15 * time.Minute),
	}
	if err := h.Services.DB.Create(&linkCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate code"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":       code,
		"expires_in": 900, // seconds
		"bot_url":    "https://t.me/" + h.Config.TelegramBotToken, // overridden in frontend with actual bot username
	})
}

// ─── GET /telegram/status ────────────────────────────────────────────────────

func (h *Handler) telegramStatus(c *gin.Context) {
	userID := c.GetUint("user_id")
	var user model.User
	h.Services.DB.Select("telegram_chat_id").First(&user, userID)
	c.JSON(http.StatusOK, gin.H{"linked": user.TelegramChatID != ""})
}

// ─── DELETE /telegram/link — disconnect Telegram ─────────────────────────────

func (h *Handler) telegramUnlink(c *gin.Context) {
	userID := c.GetUint("user_id")
	h.Services.DB.Model(&model.User{}).Where("id = ?", userID).Update("telegram_chat_id", "")
	c.JSON(http.StatusOK, gin.H{"status": "unlinked"})
}

// ─── POST /telegram/webhook — receives updates from Telegram ─────────────────

type tgUpdate struct {
	UpdateID int64 `json:"update_id"`
	Message  *struct {
		MessageID int64 `json:"message_id"`
		From      struct {
			ID        int64  `json:"id"`
			Username  string `json:"username"`
			FirstName string `json:"first_name"`
		} `json:"from"`
		Chat struct {
			ID int64 `json:"id"`
		} `json:"chat"`
		Text string `json:"text"`
	} `json:"message"`
}

func (h *Handler) telegramWebhook(c *gin.Context) {
	// Optional webhook secret header check
	if secret := h.Config.TelegramWebhookSecret; secret != "" {
		if c.GetHeader("X-Telegram-Bot-Api-Secret-Token") != secret {
			c.Status(http.StatusUnauthorized)
			return
		}
	}

	var update tgUpdate
	if err := c.ShouldBindJSON(&update); err != nil || update.Message == nil {
		c.Status(http.StatusOK) // always 200 to Telegram
		return
	}

	text := strings.TrimSpace(update.Message.Text)
	chatID := update.Message.Chat.ID
	firstName := update.Message.From.FirstName

	// /start command
	if text == "/start" {
		h.tgSend(chatID, fmt.Sprintf(
			"Привет, %s!\n\nЯ бот Jarlyq — платформы стажировок и возможностей.\n\n"+
				"Чтобы получать уведомления о новых стажировках, отправь свой код из профиля на jarlyq.kz.\n"+
				"Код выглядит так: JARLYQ-XXXXXX", firstName))
		c.Status(http.StatusOK)
		return
	}

	// Try to match as a link code
	if strings.HasPrefix(strings.ToUpper(text), "JARLYQ-") {
		code := strings.ToUpper(text)
		var linkCode model.TelegramLinkCode
		err := h.Services.DB.
			Where("code = ? AND expires_at > ?", code, time.Now()).
			First(&linkCode).Error
		if err != nil {
			h.tgSend(chatID, "Код не найден или истёк. Сгенерируй новый в профиле на jarlyq.kz.")
			c.Status(http.StatusOK)
			return
		}

		// Save chat_id to user
		h.Services.DB.Model(&model.User{}).
			Where("id = ?", linkCode.UserID).
			Update("telegram_chat_id", fmt.Sprintf("%d", chatID))

		// Delete used code
		h.Services.DB.Delete(&linkCode)

		h.tgSend(chatID, "Telegram успешно подключён к Jarlyq!\n\nТеперь ты будешь получать уведомления о новых стажировках по твоим технологиям.")
		c.Status(http.StatusOK)
		return
	}

	// Unknown message
	h.tgSend(chatID, "Отправь свой код JARLYQ-XXXXXX из профиля на jarlyq.kz.")
	c.Status(http.StatusOK)
}

// ─── Notification sender ──────────────────────────────────────────────────────

// NotifyNewOpportunity sends a Telegram notification to all users whose
// preferred stacks overlap with the opportunity's company stacks.
func (h *Handler) NotifyNewOpportunity(opp *model.Opportunity) {
	if h.Config.TelegramBotToken == "" {
		return
	}

	// Get company stacks
	type stackRow struct{ StackID uint }
	var companyStacks []stackRow
	h.Services.DB.Raw(
		"SELECT stack_id FROM company_stacks WHERE company_id = ?", opp.CompanyID,
	).Scan(&companyStacks)
	if len(companyStacks) == 0 {
		return
	}
	stackIDs := make([]uint, len(companyStacks))
	for i, s := range companyStacks {
		stackIDs[i] = s.StackID
	}

	// Find users with matching preferred stacks and linked Telegram
	type userRow struct {
		TelegramChatID string
		FirstName      string
	}
	var users []userRow
	h.Services.DB.Raw(`
		SELECT DISTINCT u.telegram_chat_id, u.first_name
		FROM users u
		JOIN user_preferred_stacks ups ON ups.user_id = u.id
		WHERE ups.stack_id IN ? AND u.telegram_chat_id != ''
	`, stackIDs).Scan(&users)

	if len(users) == 0 {
		return
	}

	// Build message
	oppType := "Стажировка"
	if opp.Type == "vacancy" {
		oppType = "Вакансия"
	}
	var companyName string
	h.Services.DB.Table("companies").Select("name").Where("id = ?", opp.CompanyID).Scan(&companyName)

	msg := fmt.Sprintf(
		"🆕 *%s на Jarlyq*\n\n*%s*\n%s",
		oppType, opp.Title, companyName,
	)
	if opp.City != "" {
		msg += "\n📍 " + opp.City
	}
	if opp.WorkFormat != "" {
		msg += " · " + opp.WorkFormat
	}
	msg += fmt.Sprintf("\n\nhttps://jarlyq.kz/internships/%d", opp.ID)
	if opp.Type == "vacancy" {
		msg = fmt.Sprintf(
			"🆕 *%s на Jarlyq*\n\n*%s*\n%s",
			oppType, opp.Title, companyName,
		)
		msg += fmt.Sprintf("\n\nhttps://jarlyq.kz/jobs/%d", opp.ID)
	}

	for _, u := range users {
		h.tgSendMD(u.TelegramChatID, msg)
	}
}

// ─── Bot API helpers ──────────────────────────────────────────────────────────

func (h *Handler) tgSend(chatID int64, text string) {
	h.tgRequest("sendMessage", map[string]interface{}{
		"chat_id": chatID,
		"text":    text,
	})
}

func (h *Handler) tgSendMD(chatID string, text string) {
	h.tgRequest("sendMessage", map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "Markdown",
	})
}

func (h *Handler) tgRequest(method string, payload map[string]interface{}) {
	if h.Config.TelegramBotToken == "" {
		return
	}
	url := fmt.Sprintf("https://api.telegram.org/bot%s/%s", h.Config.TelegramBotToken, method)
	body, _ := json.Marshal(payload)
	resp, err := http.Post(url, "application/json", bytes.NewReader(body)) //nolint:gosec
	if err == nil {
		resp.Body.Close()
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const codeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no O/0/I/1 to avoid confusion

func randomUpperCode(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = codeChars[rand.Intn(len(codeChars))] //nolint:gosec
	}
	return string(b)
}
