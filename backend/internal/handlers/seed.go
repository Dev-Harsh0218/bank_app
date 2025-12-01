package handlers

import (
	"fmt"
	"message-backend/internal/config"
	"message-backend/internal/database"
	"message-backend/internal/models"
	"message-backend/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// SeedSuperAdminRequest represents the seed request
type SeedSuperAdminRequest struct {
	SecretKey string `json:"secret_key" binding:"required"`
	Username  string `json:"username" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
}

// Add this new handler function
// RecoverSuperAdmin sends existing super admin credentials via email
func RecoverSuperAdmin(c *gin.Context) {
	var req struct {
		SecretKey string `json:"secret_key" binding:"required"`
		Username  string `json:"username"`
		Email     string `json:"email"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Custom validation: At least one of username or email is required
	if req.Username == "" && req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Either username or email is required",
			"details": "Provide at least one identifier to recover credentials",
		})
		return
	}
	
	// Verify secret key
	cfg := config.LoadConfig()
	if req.SecretKey != cfg.SuperAdminSeedKey {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid secret key"})
		return
	}
	
	db := database.GetDB()
	
	// Find the user by username OR email
	var user models.User
	result := db.Where("username = ? OR email = ?", req.Username, req.Email).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":    "User not found",
			"username": req.Username,
		})
		return
	}
	
	// Check if user is super admin
	if user.Role != models.RoleSuperAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"error":    "User is not a super admin",
			"username": req.Username,
			"role":     user.Role,
		})
		return
	}
	
	// Offload email sending to goroutine for faster response
	go func(u models.User) {
		// Send credentials to the user's email (in background)
		if err := utils.SendSuperAdminCredentials(u.Username, u.Email, u.GetRawPassword()); err != nil {
			// Log the error but don't affect the HTTP response
			fmt.Printf("⚠️ Failed to send recovery email to %s: %v\n", u.Email, err)
		} else {
			fmt.Printf("✅ Recovery email sent to %s\n", u.Email)
		}
	}(user) // Pass user by value to avoid race conditions
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Super admin credentials are being sent to your email",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
		"email_sent_to": user.Email,
		"warning":       "Check your email shortly for login credentials",
		"note":          "Email is being sent in the background for faster response",
	})
}

// SeedSuperAdmin creates a super admin user via hidden route
func SeedSuperAdmin(c *gin.Context) {
	var req SeedSuperAdminRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify secret key
	cfg := config.LoadConfig()
	if req.SecretKey != cfg.SuperAdminSeedKey {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid secret key"})
		return
	}

	db := database.GetDB()

	// Check if super admin already exists
	var existingSuperAdmin models.User
	result := db.Where("role = ?", models.RoleSuperAdmin).First(&existingSuperAdmin)

	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Super admin already exists",
			"existing_admin": gin.H{
				"id":       existingSuperAdmin.ID,
				"username": existingSuperAdmin.Username,
				"email":    existingSuperAdmin.Email,
			},
		})
		return
	}

	// Create super admin
	superAdmin := &models.User{
		Username: req.Username,
		Email:    req.Email,
		Role:     models.RoleSuperAdmin,
		RawPass:  req.Password,
		IsActive: true,
	}

	if err := superAdmin.SetPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to set password: %v", err)})
		return
	}

	if err := db.Create(superAdmin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to create super admin: %v", err),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Super admin created successfully",
		"admin": gin.H{
			"id":       superAdmin.ID,
			"username": superAdmin.Username,
			"email":    superAdmin.Email,
			"role":     superAdmin.Role,
		},
		"warning": "Remember to change the SUPER_ADMIN_SEED_KEY in production!",
	})
}

// ResetSuperAdmin allows resetting super admin (with secret key)
func ResetSuperAdmin(c *gin.Context) {
	var req struct {
		SecretKey string `json:"secret_key" binding:"required"`
		UserID    uint   `json:"user_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cfg := config.LoadConfig()
	if req.SecretKey != cfg.SuperAdminSeedKey {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid secret key"})
		return
	}

	db := database.GetDB()
	var user models.User
	if err := db.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.Role = models.RoleSuperAdmin
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to promote user to super admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User promoted to super admin successfully",
		"admin": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}
