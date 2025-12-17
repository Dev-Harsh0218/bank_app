package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Message represents an incoming SMS message belonging to a customer
type Message struct {
	ID         uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CustomerID uuid.UUID `gorm:"type:uuid;not null;index" json:"customer_id"` // Links to Customer
	Content    string    `gorm:"not null;type:text" json:"content"`           // The SMS message content
	Timestamp  time.Time `gorm:"not null;index" json:"timestamp"`             // When message was received
	Starred    bool      `gorm:"default:false" json:"starred"`                // User can star important messages
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// BeforeCreate GORM hook to set default timestamp
func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.Timestamp.IsZero() {
		m.Timestamp = time.Now()
	}
	return nil
}

// ToggleStar toggles the starred status of the message
func (m *Message) ToggleStar() {
	m.Starred = !m.Starred
	m.UpdatedAt = time.Now()
}

// Star marks the message as starred
func (m *Message) Star() {
	m.Starred = true
	m.UpdatedAt = time.Now()
}

// Unstar removes the star from the message
func (m *Message) Unstar() {
	m.Starred = false
	m.UpdatedAt = time.Now()
}

// IsStarred checks if the message is starred
func (m *Message) IsStarred() bool {
	return m.Starred
}

// GetPreview returns a short preview of the message content
func (m *Message) GetPreview(length int) string {
	if len(m.Content) <= length {
		return m.Content
	}
	return m.Content[:length] + "..."
}

// IsRecent checks if message is from the last 24 hours
func (m *Message) IsRecent() bool {
	return time.Since(m.Timestamp) < 24*time.Hour
}
