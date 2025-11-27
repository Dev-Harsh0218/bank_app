package models

import (
	"time"

	"gorm.io/gorm"
)

// MessageDirection represents the direction of a message
type MessageDirection string

const (
	DirectionIncoming MessageDirection = "incoming"
	DirectionOutgoing MessageDirection = "outgoing"
)

// MessageStatus represents the delivery status of a message
type MessageStatus string

const (
	StatusSent      MessageStatus = "sent"
	StatusDelivered MessageStatus = "delivered"
	StatusFailed    MessageStatus = "failed"
	StatusRead      MessageStatus = "read"
)

// Message represents an SMS message belonging to a customer
type Message struct {
	ID          uint             `gorm:"primaryKey" json:"id"`
	CustomerID  uint             `gorm:"not null;index" json:"customer_id"` // Links to Customer
	PhoneNumber string           `gorm:"not null;size:20" json:"phone_number"`
	ContactName string           `gorm:"size:100" json:"contact_name"`
	Content     string           `gorm:"not null;type:text" json:"content"`
	Direction   MessageDirection `gorm:"not null;type:varchar(10)" json:"direction"`
	Status      MessageStatus    `gorm:"default:'sent';size:20" json:"status"`
	Timestamp   time.Time        `gorm:"not null;index" json:"timestamp"`
	IsImportant bool             `gorm:"default:false" json:"is_important"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`

	// Associations - Links to Customer
	Customer Customer `gorm:"foreignKey:CustomerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"customer"`
}

// BeforeCreate GORM hook to set default timestamp
func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.Timestamp.IsZero() {
		m.Timestamp = time.Now()
	}
	return nil
}

// IsIncoming checks if the message is incoming
func (m *Message) IsIncoming() bool {
	return m.Direction == DirectionIncoming
}

// IsOutgoing checks if the message is outgoing
func (m *Message) IsOutgoing() bool {
	return m.Direction == DirectionOutgoing
}

// MarkAsDelivered updates message status to delivered
func (m *Message) MarkAsDelivered() {
	m.Status = StatusDelivered
	m.UpdatedAt = time.Now()
}

// MarkAsRead updates message status to read
func (m *Message) MarkAsRead() {
	m.Status = StatusRead
	m.UpdatedAt = time.Now()
}

// ToggleImportance marks/unmarks message as important
func (m *Message) ToggleImportance() {
	m.IsImportant = !m.IsImportant
	m.UpdatedAt = time.Now()
}
