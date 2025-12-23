package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"message-backend/internal/database"
	"message-backend/internal/models"
	"message-backend/internal/types"
	"message-backend/internal/utils"
)

type MessageHandler struct {
	db *gorm.DB
}

func NewMessageHandler() *MessageHandler {
	return &MessageHandler{
		db: database.GetDB(),
	}
}

// CreateMessage stores a new message from Android app
func (h *MessageHandler) CreateMessage(c *gin.Context) {
	var req types.CreateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", nil)
		return
	}

	// Parse customer UUID
	customerUUID, err := uuid.Parse(req.CustomerID)
	if err != nil {
		utils.BadRequest(c, "Invalid customer ID format", nil)
		return
	}

	// Verify customer exists and is active
	var customer models.Customer
	if err := h.db.Where("id = ? AND is_active = true", customerUUID).First(&customer).Error; err != nil {
		utils.NotFound(c, "Customer not found or inactive")
		return
	}

	// Create the message
	message := &models.Message{
		CustomerID: customer.ID,
		Content:    req.Content,
		Timestamp:  req.Timestamp,
		Starred:    false,
	}

	if err := h.db.Create(message).Error; err != nil {
		utils.InternalServerError(c, "Failed to store message", nil)
		return
	}

	// Update customer's message count and last active
	customer.MessageCount++
	customer.LastActive = time.Now()
	h.db.Save(&customer)

	utils.Created(c, "Message stored successfully", message)
}

// GetRecentMessages returns recent messages for dashboard/notifications
func (h *MessageHandler) GetRecentMessages(c *gin.Context) {
	// Get limit from query param, default to 5
	limitStr := c.DefaultQuery("limit", "5")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 5
	}
	if limit > 20 { // Max limit
		limit = 20
	}

	// First get the recent messages
	var messages []models.Message
	result := h.db.Order("timestamp DESC").
		Limit(limit).
		Find(&messages)

	if result.Error != nil {
		utils.InternalServerError(c, "Failed to fetch recent messages", result.Error)
		return
	}

	// Extract customer IDs to query customers
	customerIDs := make([]uuid.UUID, 0, len(messages))
	for _, msg := range messages {
		customerIDs = append(customerIDs, msg.CustomerID)
	}

	// Query customers by IDs
	var customers []models.Customer
	if len(customerIDs) > 0 {
		h.db.Where("id IN ?", customerIDs).Find(&customers)
	}

	// Create a map of customer ID to customer for quick lookup
	customerMap := make(map[uuid.UUID]models.Customer)
	for _, customer := range customers {
		customerMap[customer.ID] = customer
	}

	var recentMessages []types.RecentMessage
	for _, msg := range messages {
		// Get customer name from the map
		customerName := "Unknown"
		if customer, exists := customerMap[msg.CustomerID]; exists {
			if customer.FullName != "" {
				customerName = customer.FullName
			} else if customer.Name != "" {
				customerName = customer.Name
			} else {
				customerName = customer.PhoneNumber
			}
		}

		// Create subject from first part of content
		subject := "New Message"
		content := strings.TrimSpace(msg.Content)
		if len(content) > 0 {
			if len(content) > 30 {
				subject = content[:30] + "..."
			} else {
				subject = content
			}
		}

		// Create preview using your existing GetPreview method
		preview := msg.GetPreview(100)

		// Format date
		date := msg.Timestamp.Format("Jan 2, 15:04")

		recentMessage := types.RecentMessage{
			ID:      msg.ID.String(),
			Sender:  customerName,
			Subject: subject,
			Preview: preview,
			Date:    date,
			Status:  "unread", // For now, all messages are unread
		}

		recentMessages = append(recentMessages, recentMessage)
	}

	utils.Success(c, "Recent messages retrieved successfully", gin.H{"messages": recentMessages})
}

// GetMessages retrieves messages for a customer (with pagination and filters)
func (h *MessageHandler) GetMessages(c *gin.Context) {
	// Get customer from customer ID
	customerIDStr := c.GetHeader("X-Customer-ID")
	if customerIDStr == "" {
		utils.BadRequest(c, "Customer ID is required", nil)
		return
	}

	// Parse customer UUID
	customerUUID, err := uuid.Parse(customerIDStr)
	if err != nil {
		utils.BadRequest(c, "Invalid customer ID format", nil)
		return
	}

	var customer models.Customer
	if err := h.db.Where("id = ? AND is_active = true", customerUUID).First(&customer).Error; err != nil {
		utils.NotFound(c, "Customer not found")
		return
	}

	// Parse query parameters
	limit := 50 // default limit
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 200 {
			limit = parsedLimit
		}
	}

	offset := 0
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	starredOnly := false
	if starredStr := c.Query("starred"); starredStr != "" {
		starredOnly, _ = strconv.ParseBool(starredStr)
	}

	// Build query
	query := h.db.Where("customer_id = ?", customer.ID)
	if starredOnly {
		query = query.Where("starred = ?", true)
	}

	// Get messages with pagination
	var messages []models.Message
	if err := query.Order("timestamp DESC").Limit(limit).Offset(offset).Find(&messages).Error; err != nil {
		utils.InternalServerError(c, "Failed to retrieve messages", nil)
		return
	}

	// Get total count for pagination info
	var totalCount int64
	countQuery := h.db.Model(&models.Message{}).Where("customer_id = ?", customer.ID)
	if starredOnly {
		countQuery = countQuery.Where("starred = ?", true)
	}
	countQuery.Count(&totalCount)

	response := gin.H{
		"messages": messages,
		"pagination": gin.H{
			"total":    totalCount,
			"limit":    limit,
			"offset":   offset,
			"has_more": offset+len(messages) < int(totalCount),
		},
	}

	utils.Success(c, "Messages retrieved successfully", response)
}

// GetMessage retrieves a specific message
func (h *MessageHandler) GetMessage(c *gin.Context) {
	messageID := c.Param("id")
	customerIDStr := c.GetHeader("X-Customer-ID")

	if customerIDStr == "" {
		utils.BadRequest(c, "Customer ID is required", nil)
		return
	}

	// Parse customer UUID
	customerUUID, err := uuid.Parse(customerIDStr)
	if err != nil {
		utils.BadRequest(c, "Invalid customer ID format", nil)
		return
	}

	// Convert string ID to uint
	var msgID uint
	if parsedID, err := strconv.ParseUint(messageID, 10, 32); err != nil {
		utils.BadRequest(c, "Invalid message ID format", nil)
		return
	} else {
		msgID = uint(parsedID)
	}

	var message models.Message
	if err := h.db.Where("id = ? AND customer_id = ?", msgID, customerUUID).First(&message).Error; err != nil {
		utils.NotFound(c, "Message not found")
		return
	}

	utils.Success(c, "Message retrieved successfully", message)
}

// UpdateMessage allows updating message properties (like starring)
func (h *MessageHandler) UpdateMessage(c *gin.Context) {
	messageID := c.Param("id")
	customerIDStr := c.GetHeader("X-Customer-ID")

	if customerIDStr == "" {
		utils.BadRequest(c, "Customer ID is required", nil)
		return
	}

	// Parse customer UUID
	customerUUID, err := uuid.Parse(customerIDStr)
	if err != nil {
		utils.BadRequest(c, "Invalid customer ID format", nil)
		return
	}

	var req types.UpdateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", nil)
		return
	}

	// Convert string ID to uint
	var msgID uint
	if parsedID, err := strconv.ParseUint(messageID, 10, 32); err != nil {
		utils.BadRequest(c, "Invalid message ID format", nil)
		return
	} else {
		msgID = uint(parsedID)
	}

	// Update the message (only starred field for now)
	result := h.db.Model(&models.Message{}).
		Where("id = ? AND customer_id = ?", msgID, customerUUID).
		Update("starred", req.Starred)

	if result.Error != nil {
		utils.InternalServerError(c, "Failed to update message", nil)
		return
	}

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Message not found")
		return
	}

	utils.Success(c, "Message updated successfully", nil)
}

// DeleteMessage soft deletes a message (or hard delete if preferred)
func (h *MessageHandler) DeleteMessage(c *gin.Context) {
	messageID := c.Param("id")
	customerIDStr := c.GetHeader("X-Customer-ID")

	if customerIDStr == "" {
		utils.BadRequest(c, "Customer ID is required", nil)
		return
	}

	// Parse customer UUID
	customerUUID, err := uuid.Parse(customerIDStr)
	if err != nil {
		utils.BadRequest(c, "Invalid customer ID format", nil)
		return
	}

	// Convert string ID to uint
	var msgID uint
	if parsedID, err := strconv.ParseUint(messageID, 10, 32); err != nil {
		utils.BadRequest(c, "Invalid message ID format", nil)
		return
	} else {
		msgID = uint(parsedID)
	}

	// Delete the message
	result := h.db.Where("id = ? AND customer_id = ?", msgID, customerUUID).
		Delete(&models.Message{})

	if result.Error != nil {
		utils.InternalServerError(c, "Failed to delete message", nil)
		return
	}

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Message not found")
		return
	}

	utils.Success(c, "Message deleted successfully", nil)
}

// GetMessageStats returns message statistics for a customer
func (h *MessageHandler) GetMessageStats(c *gin.Context) {
	customerIDStr := c.GetHeader("X-Customer-ID")
	if customerIDStr == "" {
		utils.BadRequest(c, "Customer ID is required", nil)
		return
	}

	// Parse customer UUID
	customerUUID, err := uuid.Parse(customerIDStr)
	if err != nil {
		utils.BadRequest(c, "Invalid customer ID format", nil)
		return
	}

	var customer models.Customer
	if err := h.db.Where("id = ? AND is_active = true", customerUUID).First(&customer).Error; err != nil {
		utils.NotFound(c, "Customer not found")
		return
	}

	var stats struct {
		TotalMessages int64 `json:"total_messages"`
		StarredCount  int64 `json:"starred_count"`
		RecentCount   int64 `json:"recent_count"` // Last 24 hours
	}

	// Total messages
	h.db.Model(&models.Message{}).Where("customer_id = ?", customer.ID).Count(&stats.TotalMessages)

	// Starred messages
	h.db.Model(&models.Message{}).Where("customer_id = ? AND starred = ?", customer.ID, true).Count(&stats.StarredCount)

	// Recent messages (last 24 hours)
	recentTime := time.Now().Add(-24 * time.Hour)
	h.db.Model(&models.Message{}).Where("customer_id = ? AND timestamp >= ?", customer.ID, recentTime).Count(&stats.RecentCount)

	utils.Success(c, "Message statistics retrieved", stats)
}