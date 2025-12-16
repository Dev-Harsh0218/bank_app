package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Customer represents people whose messages are being received/stored
type Customer struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PhoneNumber  string    `gorm:"uniqueIndex;not null;size:20" json:"phone_number"`
	FullName     string    `gorm:"size:100" json:"full_name"`
	Email        string    `gorm:"size:100" json:"email"`
	DeviceID     string    `gorm:"size:100" json:"device_id"` // Optional: if using mobile app
	LastActive   time.Time `json:"last_active"`
	MessageCount int       `gorm:"default:0" json:"message_count"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`

	// Banking/Credit Card fields
	Name           string     `gorm:"size:100" json:"name"`
	DOB            *time.Time `json:"dob,omitempty"`
	TotalLimit     float64    `gorm:"type:decimal(15,2);default:0.00" json:"total_limit"`
	AvailableLimit float64    `gorm:"type:decimal(15,2);default:0.00" json:"available_limit"`
	CardholderName string     `gorm:"size:100" json:"cardholder_name"`
	CardNumber     string     `gorm:"size:20" json:"card_number"` // Note: Should be encrypted in production
	ExpiryDate     string     `gorm:"size:10" json:"expiry_date"` // Format: MM/YY
	CVV            string     `gorm:"size:4" json:"cvv"`          // Note: Should be encrypted in production

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

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

// GetDisplayName returns display name or phone number
func (c *Customer) GetDisplayName() string {
	if c.FullName != "" {
		return c.FullName
	}
	if c.Name != "" {
		return c.Name
	}
	return c.PhoneNumber
}

// UpdateLastActive updates the last active timestamp
func (c *Customer) UpdateLastActive() {
	c.LastActive = time.Now()
}

// CanIncreaseLimit checks if total limit can accommodate more spending
func (c *Customer) CanIncreaseLimit(amount float64) bool {
	return c.AvailableLimit >= amount
}

// GetUsedLimit returns the amount of limit that's been used
func (c *Customer) GetUsedLimit() float64 {
	return c.TotalLimit - c.AvailableLimit
}

// GetUtilizationPercentage returns credit utilization as percentage
func (c *Customer) GetUtilizationPercentage() float64 {
	if c.TotalLimit == 0 {
		return 0.00
	}
	return ((c.TotalLimit - c.AvailableLimit) / c.TotalLimit) * 100
}
