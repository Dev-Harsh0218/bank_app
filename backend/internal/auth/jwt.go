package auth

import (
	"errors"
	"time"

	"message-backend/internal/config"
	"message-backend/internal/models"

	"github.com/dgrijalva/jwt-go"
)

type Claims struct {
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"` // "access" or "refresh"
	jwt.StandardClaims
}

type JWTService struct {
	secretKey string
}

func NewJWTService(cfg *config.Config) *JWTService {
	return &JWTService{
		secretKey: cfg.JWTSecret,
	}
}

// GenerateAccessToken creates a short-lived access token
func (j *JWTService) GenerateAccessToken(user *models.User, cfg *config.Config) (string, error) {
	expirationTime := time.Now().Add(cfg.JWTAccessExpiration)

	claims := &Claims{
		UserID:    user.ID,
		Username:  user.Username,
		Role:      user.Role,
		TokenType: "access",
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.secretKey))
}

// GenerateRefreshToken creates a long-lived refresh token
func (j *JWTService) GenerateRefreshToken(user *models.User, cfg *config.Config) (string, error) {
	expirationTime := time.Now().Add(cfg.JWTRefreshExpiration)

	claims := &Claims{
		UserID:    user.ID,
		TokenType: "refresh",
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.secretKey))
}

// GenerateTokenPair creates both access and refresh tokens
func (j *JWTService) GenerateTokenPair(user *models.User, cfg *config.Config) (map[string]string, error) {
	accessToken, err := j.GenerateAccessToken(user, cfg)
	if err != nil {
		return nil, err
	}

	refreshToken, err := j.GenerateRefreshToken(user, cfg)
	if err != nil {
		return nil, err
	}

	return map[string]string{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	}, nil
}

func (j *JWTService) ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(j.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// ValidateAccessToken validates an access token specifically
func (j *JWTService) ValidateAccessToken(tokenString string) (*Claims, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != "access" {
		return nil, errors.New("not an access token")
	}

	return claims, nil
}

// ValidateRefreshToken validates a refresh token specifically
func (j *JWTService) ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != "refresh" {
		return nil, errors.New("not a refresh token")
	}

	return claims, nil
}

func (j *JWTService) ExtractTokenFromHeader(authHeader string) (string, error) {
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		return "", errors.New("invalid authorization header format")
	}
	return authHeader[7:], nil
}

// RefreshAccessToken creates new access token from refresh token
func (j *JWTService) RefreshAccessToken(refreshToken string, cfg *config.Config) (string, error) {
	claims, err := j.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", err
	}

	// Create user struct for generating new access token
	user := &models.User{
		ID:       claims.UserID,
		Username: claims.Username,
		Role:     claims.Role,
	}

	return j.GenerateAccessToken(user, cfg)
}
