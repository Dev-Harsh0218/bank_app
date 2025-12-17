package handlers

import (
	"net/http"
	"message-backend/internal/database"
	"message-backend/internal/models"
	"github.com/gin-gonic/gin"
)

type TestHandler struct{}

func NewTestHandler() *TestHandler { return &TestHandler{} }

// TestEndpoint is a sandbox for testing any code
func (h *TestHandler) TestEndpoint(c *gin.Context) {
	// =========================
	// Paste Your test code here for testing
	// =========================
	var updatedUser models.User
	err := database.GetDB().Where("is_approved = ? AND role = ?", false, models.RoleUser).Find(&updatedUser).Error

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"error":   err.Error(),
			"message": "Fetching users failed",
			"details": "A problem occurred while querying for users waiting for approval.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "success",
		"message":  "Test completed successfully",
		"details":  "All users waiting for approval are listed below.",
        "data": gin.H{"updatedUser": updatedUser },
	})
}
