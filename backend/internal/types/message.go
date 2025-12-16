package types

import "time"

// CreateMessageRequest for storing new messages from Android app
type CreateMessageRequest struct {
	DeviceID  string    `json:"device_id" binding:"required"` // To identify the customer
	Content   string    `json:"content" binding:"required"`   // SMS content
	Timestamp time.Time `json:"timestamp"`                    // When SMS was received (optional, defaults to now)
}

// UpdateMessageRequest for updating message properties
type UpdateMessageRequest struct {
	Starred *bool `json:"starred"` // Nullable boolean for starring/unstarring
}
