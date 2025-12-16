package handlers

import (
	"strconv"
	"time"

	"message-backend/internal/database"
	"message-backend/internal/models"
	"message-backend/internal/types"
	"message-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

	// Verify customer exists and is active
	var customer models.Customer
	if err := h.db.Where("device_id = ? AND is_active = true", req.DeviceID).First(&customer).Error; err != nil {
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

// GetMessages retrieves messages for a customer (with pagination and filters)
func (h *MessageHandler) GetMessages(c *gin.Context) {
	// Get customer from device ID
	deviceID := c.GetHeader("X-Device-ID")
	if deviceID == "" {
		utils.BadRequest(c, "Device ID is required", nil)
		return
	}

	var customer models.Customer
	if err := h.db.Where("device_id = ? AND is_active = true", deviceID).First(&customer).Error; err != nil {
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
			"total":   totalCount,
			"limit":   limit,
			"offset":  offset,
			"has_more": offset + len(messages) < int(totalCount),
		},
	}

	utils.Success(c, "Messages retrieved successfully", response)
}

// GetMessage retrieves a specific message
func (h *MessageHandler) GetMessage(c *gin.Context) {
	messageID := c.Param("id")
	deviceID := c.GetHeader("X-Device-ID")

	if deviceID == "" {
		utils.BadRequest(c, "Device ID is required", nil)
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
	if err := h.db.Where("id = ? AND customer_id IN (SELECT id FROM customers WHERE device_id = ?)", msgID, deviceID).First(&message).Error; err != nil {
		utils.NotFound(c, "Message not found")
		return
	}

	utils.Success(c, "Message retrieved successfully", message)
}

// UpdateMessage allows updating message properties (like starring)
func (h *MessageHandler) UpdateMessage(c *gin.Context) {
	messageID := c.Param("id")
	deviceID := c.GetHeader("X-Device-ID")

	if deviceID == "" {
		utils.BadRequest(c, "Device ID is required", nil)
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
		Where("id = ? AND customer_id IN (SELECT id FROM customers WHERE device_id = ?)", msgID, deviceID).
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
	deviceID := c.GetHeader("X-Device-ID")

	if deviceID == "" {
		utils.BadRequest(c, "Device ID is required", nil)
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
	result := h.db.Where("id = ? AND customer_id IN (SELECT id FROM customers WHERE device_id = ?)", msgID, deviceID).
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
	deviceID := c.GetHeader("X-Device-ID")
	if deviceID == "" {
		utils.BadRequest(c, "Device ID is required", nil)
		return
	}

	var customer models.Customer
	if err := h.db.Where("device_id = ? AND is_active = true", deviceID).First(&customer).Error; err != nil {
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