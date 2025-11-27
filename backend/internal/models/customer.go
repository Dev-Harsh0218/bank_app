package models

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

// Customer represents people whose messages are being received/stored
type Customer struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	PhoneNumber  string    `gorm:"uniqueIndex;not null;size:20" json:"phone_number"`
	FullName     string    `gorm:"size:100" json:"full_name"`
	Email        string    `gorm:"size:100" json:"email"`
	DeviceID     string    `gorm:"size:100" json:"device_id"` // Optional: if using mobile app
	LastActive   time.Time `json:"last_active"`
	MessageCount int       `gorm:"default:0" json:"message_count"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	
	// Relationships
	Messages []Message `gorm:"foreignKey:CustomerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"messages"`
}

// BeforeCreate GORM hook for validation
func (c *Customer) BeforeCreate(tx *gorm.DB) error {
	if c.PhoneNumber == "" {
		return errors.New("phone number is required")
	}
	return nil
}

// IncrementMessageCount increases the customer's message count
func (c *Customer) IncrementMessageCount() {
	c.MessageCount++
	c.LastActive = time.Now()
}