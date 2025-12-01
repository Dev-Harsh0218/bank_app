package handlers

import (
	"fmt"
	"net/http"
	"time"

	"message-backend/internal/auth"
	"message-backend/internal/config"
	"message-backend/internal/database"
	"message-backend/internal/models"

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

// SignupRequest represents the signup request payload
type SignupRequest struct {
	Username string `json:"username" binding:"required,min=5,max=50"`
	Email    string `json:"email" binding:"required,email,max=100"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role,omitempty"` // Optional, defaults to "user"
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// CreateUserRequest for admin creating users
type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email,max=100"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required,oneof=super_admin admin user"`
}

// AuthResponse represents the authentication response with both tokens
type AuthResponse struct {
	User         *models.User `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"`
}

// Signup handles user registration (creates regular users)
func (h *AuthHandler) Signup(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Default role for public signup is "user"
	role := models.RoleUser
	if req.Role != "" {
		// Only allow role specification if provided, but validate it
		if req.Role != models.RoleUser {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Public signup can only create user accounts"})
			return
		}
		role = req.Role
	}

	fmt.Print("Pasword i m getting here", req.Password)
	// Create new user
	user := &models.User{
		Username: req.Username,
		Email:    req.Email,
		RawPass:  req.Password,
		Role:     role,
		IsActive: true,
	}

	// Hash password
	if err := user.SetPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Save user
	if err := h.db.Create(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate both access and refresh tokens
	tokens, err := h.jwtService.GenerateTokenPair(user, h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	response := AuthResponse{
		User:         user,
		AccessToken:  tokens["access_token"],
		RefreshToken: tokens["refresh_token"],
		ExpiresIn:    int(h.cfg.JWTAccessExpiration.Seconds()),
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"data":    response,
	})
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by username
	var user models.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is deactivated"})
		return
	}

	// Validate password
	if err := user.ValidatePassword(req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Update last login
	h.db.Model(&user).Update("last_login", time.Now())

	// Generate both access and refresh tokens
	tokens, err := h.jwtService.GenerateTokenPair(&user, h.cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"极ror": "Failed to generate tokens"})
		return
	}

	response := AuthResponse{
		User:         &user,
		AccessToken:  tokens["access_token"],
		RefreshToken: tokens["refresh_token"],
		ExpiresIn:    int(h.cfg.JWTAccessExpiration.Seconds()),
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"data":    response,
	})
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate refresh token and generate new access token
	newAccessToken, err := h.jwtService.RefreshAccessToken(req.RefreshToken, h.cfg)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
		"data": gin.H{
			"access_token": newAccessToken,
			"expires_in":   int(h.cfg.JWTAccessExpiration.Seconds()),
		},
	})
}

// Logout handles user logout (client-side token removal)
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a stateless JWT system, logout is handled client-side by removing the token
	// For server-side logout, you might want to implement a token blacklist

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// GetProfile returns the current user's profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	// Get user from context (set by auth middleware)
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user type"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": userModel,
	})
}

// CreateUser handles admin creating users with specific roles
func (h *AuthHandler) CreateUser(c *gin.Context) {
	// Get current user from context
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	user, ok := currentUser.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user type"})
		return
	}

	// Check if current user can create users
	if !user.CanManageUsers() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions to create users"})
		return
	}

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Check if current user can create the requested role
	if req.Role == models.RoleSuperAdmin && !user.IsSuperAdmin() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only super admins can create super admin accounts"})
		return
	}

	if req.Role == models.RoleAdmin && !user.IsSuperAdmin() {
		c.JSON(http.StatusForbidden, gin.H{"error": "极ly super admins can create admin accounts"})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Create new user
	newUser := &models.User{
		Username: req.Username,
		Email:    req.Email,
		Role:     req.Role,
		IsActive: true,
	}

	// Hash password
	if err := newUser.SetPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Save user
	if err := h.db.Create(newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully by " + user.Username,
		"data":    newUser,
	})
}

// UpdateUserRole allows admins to update user roles
func (h *AuthHandler) UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")

	// Get current user from context
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	user, ok := currentUser.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user type"})
		return
	}

	// Check permissions
	if !user.CanManageUsers() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		return
	}

	var req struct {
		Role string `json:"role" binding:"required,oneof=super_admin admin user"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find target user
	var targetUser models.User
	if err := h.db.First(&targetUser, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Prevent users from modifying their own role or higher roles
	if targetUser.ID == user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot modify your own role"})
		return
	}

	// Check if current user can assign this role
	if req.Role == models.RoleSuperAdmin && !user.IsSuperAdmin() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only super admins can assign super admin role"})
		return
	}

	if req.Role == models.RoleAdmin && !user.IsSuperAdmin() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only super admins can assign admin role"})
		return
	}

	// Update role
	if err := h.db.Model(&targetUser).Update("role", req.Role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User role updated successfully",
		"data":    targetUser,
	})
}
