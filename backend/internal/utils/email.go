package utils

import (
	"fmt"
	"message-backend/internal/config"
	"net/smtp"
)

// SendSuperAdminCredentials sends real emails via SMTP
func SendSuperAdminCredentials(username, email, password string) error {
	cfg := config.LoadConfig()

	//Email content
	subject := "Super Admin Credentials Generated"
	body := fmt.Sprintf(`
	Super Admin Account:
	Username: %s
	Email: %s
	Password: %s

	This is an automated message. Do not reply.`, username, email, password)

	// SMTP authenticated
	auth := smtp.PlainAuth("", cfg.SMTPUsername, cfg.SMTPPassword, cfg.SMTPHost)

	// Email message
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s\r\n", cfg.AdminEmail, subject, body))

	// send email
	err := smtp.SendMail(
		fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort),
		auth,
		cfg.SMTPUsername,
		[]string{cfg.AdminEmail},
		msg,
	)
	return err
}
