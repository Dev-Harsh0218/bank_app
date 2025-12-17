package handlers

import (
	"time"

	"message-backend/internal/auth"
	"message-backend/internal/config"
	"message-backend/internal/database"
	"message-backend/internal/models"
	"message-backend/internal/types"
	"message-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db         *gorm.DB
	jwtService *auth.JWTService
	cfg        *config.Config
}

func NewAuthHandler() *AuthHandler {
	cfg := config.LoadConfig()
	return &AuthHandler{
		db:         database.GetDB(),
		jwtService: auth.NewJWTService(cfg),
		cfg:        cfg,
	}
}

// Signup handles user registration (creates regular users)
func (h *AuthHandler) Signup(c *gin.Context) {
	var req types.SignupRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", err)
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		utils.Conflict(c, "User already exists")
		return
	}

	// Default role for public signup is "user"
	role := models.RoleUser
	if req.Role != "" {
		if req.Role != models.RoleUser {
			utils.BadRequest(c, "Public signup can only create user accounts", nil)
			return
		}
		role = req.Role
	}
	user := &models.User{
		Username: req.Username,
		Email:    req.Email,
		RawPass:  req.Password,
		Role:     role,
		IsActive: true,
	}

	if err := user.SetPassword(req.Password); err != nil {
		utils.InternalServerError(c, "Failed to hash password", err)
		return
	}

	if err := h.db.Create(user).Error; err != nil {
		utils.InternalServerError(c, "Failed to create user", err)
		return
	}

	response := types.SignUpResponse{
		User: user,
	}

	utils.Created(c, "User created successfully", response)
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	var req types.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", err)
		return
	}

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.Unauthorized(c, "Invalid credentials")
		return
	}

	// Check if user is approved (if approval system is enabled)
	if !user.IsApproved {
		utils.Unauthorized(c, "Account pending admin approval")
		return
	}

	if !user.IsActive {
		utils.Unauthorized(c, "Account is deactivated")
		return
	}

	if err := user.ValidatePassword(req.Password); err != nil {
		utils.Unauthorized(c, "Invalid credentials")
		return
	}

	h.db.Model(&user).Update("last_login", time.Now())

	tokens, err := h.jwtService.GenerateTokenPair(&user, h.cfg)
	if err != nil {
		utils.InternalServerError(c, "Failed to generate tokens", err)
		return
	}

	response := types.AuthResponse{
		User:         &user,
		AccessToken:  tokens["access_token"],
		RefreshToken: tokens["refresh_token"],
		ExpiresIn:    int(h.cfg.JWTAccessExpiration.Seconds()),
	}

	utils.Success(c, "Login successful", response)
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", err)
		return
	}

	newAccessToken, err := h.jwtService.RefreshAccessToken(req.RefreshToken, h.cfg)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, "Token refreshed successfully", gin.H{
		"access_token": newAccessToken,
		"expires_in":   int(h.cfg.JWTAccessExpiration.Seconds()),
	})
}

// Logout handles user logout (client-side token removal)
func (h *AuthHandler) Logout(c *gin.Context) {
	utils.Success(c, "Logged out successfully", nil)
}

// GetProfile returns the current user's profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		utils.Unauthorized(c, "User not found in context")
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		utils.InternalServerError(c, "Invalid user type", nil)
		return
	}

	utils.Success(c, "Profile retrieved successfully", userModel)
}
