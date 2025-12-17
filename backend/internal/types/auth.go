package types

import (
	"message-backend/internal/models"
)

// SignupRequest represents the signup request payload
type SignupRequest struct {
	Username string `json:"username" binding:"required,min=5,max=50"`
	Email    string `json:"email" binding:"required,email,max=100"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role,omitempty"` // Optional, defaults to "user"
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
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

// AuthResponse represents the authentication response with both tokens
type SignUpResponse struct {
	User *models.User `json:"user"`
}
