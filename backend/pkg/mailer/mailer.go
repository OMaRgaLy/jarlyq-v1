package mailer

import (
	"fmt"
	"net/smtp"
)

// Mailer sends transactional emails.
type Mailer interface {
	SendVerification(to, link string) error
	SendPasswordReset(to, link string) error
}

type smtpMailer struct {
	auth smtp.Auth
	host string
	port int
	from string
}

// NewSMTPMailer creates SMTP mailer.
func NewSMTPMailer(host string, port int, user, password, from string) Mailer {
	if host == "" || user == "" || password == "" || from == "" {
		return nil
	}
	auth := smtp.PlainAuth("", user, password, host)
	return &smtpMailer{auth: auth, host: host, port: port, from: from}
}

func (m *smtpMailer) send(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", m.host, m.port)
	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\n\r\n%s", to, subject, body))
	return smtp.SendMail(addr, m.auth, m.from, []string{to}, msg)
}

// SendVerification sends verification email.
func (m *smtpMailer) SendVerification(to, link string) error {
	return m.send(to, "Verify your email", fmt.Sprintf("Привет! Подтверди почту по ссылке: %s", link))
}

// SendPasswordReset sends reset email.
func (m *smtpMailer) SendPasswordReset(to, link string) error {
	return m.send(to, "Reset your password", fmt.Sprintf("Сброс пароля: %s", link))
}
