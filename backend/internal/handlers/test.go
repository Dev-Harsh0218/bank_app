package handlers

import (
	"message-backend/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// TestHandler provides a simple test endpoint
type TestHandler struct{}

func NewTestHandler() *TestHandler {
	return &TestHandler{}
}

// TestEndpoint is a sandbo for testing any code
func (h *TestHandler) TestEndpoint(c *gin.Context) {
	// =========================
	// Paste Your test code here for testing
	// =========================
	err := utils.SendSuperAdminCredentials(
		"testuser",
		"test@example.com",
		"testpassword 123!",
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"error":   err.Error(),
			"message": "Email test failed - check SMTP configuration",
			"details": "Make sure SMTP settings are correct in .env file",
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Test completed successfully",
		"details": "Check your email inbox for the test message",
	})
}
