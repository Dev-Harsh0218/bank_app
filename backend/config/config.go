package config

import (
	"os"
	"strconv"
	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort string
	ServerHost string
	DB_HOST string
	DB_PORT string
	DB_USER string
	DB_PASS string
	DB_NAME string
	JWT_SECRET string
	AppENV string
	AppDebug bool
}

func LoadConfig() *Config {
	godotenv.Load()
	return &Config{
		ServerPort: getEnv("SERVER_PORT", "8080"),
		ServerHost: getEnv("SERVER_HOST", "localhost"),
		DB_HOST: getEnv("DB_HOST", "localhost"),
		DB_PORT: getEnv("DB_PORT", "5432"),
		DB_USER: getEnv("DB_USER", "postgres"),
		DB_PASS: getEnv("DB_PASS", "postgres"),
		DB_NAME: getEnv("DB_NAME", "message_db"),
		JWT_SECRET: getEnv("JWT_SECRET", "your_secret_key"),
		AppENV: getEnv("APP_ENV", "development"),
		AppDebug: getEnvBool("APP_DEBUG", false),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
