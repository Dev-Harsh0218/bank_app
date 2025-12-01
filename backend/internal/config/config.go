// Package config handles loading and parsing all environment-based configuration
// used by the application, including server, database, JWT, and app-level settings.
package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	// Server Configuration
	ServerPort         string
	ServerHost         string
	ServerReadTimeout  time.Duration
	ServerWriteTimeout time.Duration

	// Database Configuration (PostgreSQL)
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// JWT Configuration
	JWTSecret            string
	JWTAccessExpiration  time.Duration
	JWTRefreshExpiration time.Duration

	// Application Configuration
	AppEnv   string
	AppDebug bool

	// Super admin Seed Configuration
	SuperAdminSeedKey string

	// SMTP Configuration
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string

	AdminEmail string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {

	// Load .env file if it exists (ignores errors for production)
	godotenv.Load()

	return &Config{
		// Server settings
		ServerPort:         getEnv("SERVER_PORT", "8080"),
		ServerHost:         getEnv("SERVER_HOST", "localhost"),
		ServerReadTimeout:  getEnvDuration("SERVER_READ_TIMEOUT", 30*time.Second),
		ServerWriteTimeout: getEnvDuration("SERVER_WRITE_TIMEOUT", 30*time.Second),

		// Database settings
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "message_db"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		// JWT settings
		JWTSecret:            getEnv("JWT_SECRET", "change-this-in-production"),
		JWTAccessExpiration:  getEnvDuration("JWT_ACCESS_EXPIRATION", 15*time.Minute),
		JWTRefreshExpiration: getEnvDuration("JWT_REFRESH_EXPIRATION", 7*24*time.Hour),

		// Application settings
		AppEnv:   getEnv("APP_ENV", "development"),
		AppDebug: getEnvBool("APP_DEBUG", true),

		// Super Admin Seed Key
		SuperAdminSeedKey: getEnv("SUPER_ADMIN_SEED_KEY", "change-this-to-a-very-secure-random-key"),

		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnv("SMTP_PORT", ""),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		AdminEmail:   getEnv("ADMIN_EMAIL", ""),
	}
}

// getEnv gets environment variable or returns default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvBool gets environment variable as boolean
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// getEnvDuration gets environment variable as time.Duration
func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

// getEnvInt gets environment variable as integer
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
