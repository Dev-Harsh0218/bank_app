package types

import "time"

// CreateMessageRequest for storing new messages from Android app
type CreateMessageRequest struct {
	CustomerID string    `json:"customer_id" binding:"required"` // Use customer UUID directly
	Content    string    `json:"content" binding:"required"`     // SMS content
	Timestamp  time.Time `json:"timestamp"`                      // When SMS was received (optional)
}

// UpdateMessageRequest for updating message properties
type UpdateMessageRequest struct {
	Starred *bool `json:"starred"` // Nullable boolean for starring/unstarring
}

// RecentMessage represents a message for display
type RecentMessage struct {
	ID      string `json:"id"`
	Sender  string `json:"sender"`
	Subject string `json:"subject"`
	Preview string `json:"preview"`
	Date    string `json:"date"`
	Status  string `json:"status"`
}
