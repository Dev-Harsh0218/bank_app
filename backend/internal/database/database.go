package database

import (
	"context"
	"fmt"
	"log"
	"message-backend/internal/config"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB holds the global database instance
var DB *gorm.DB

// InitDB initializes the database connection with connection pooling and proper configuration
func InitDB() (*gorm.DB, error) {
	cfg := config.LoadConfig()
	
	// Build PostgreSQL Data Source Name (DSN)
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBSSLMode,
	)
	
	// Configure GORM logger based on environment
	gormConfig := &gorm.Config{}
	if cfg.AppEnv == "development" {
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	} else {
		gormConfig.Logger = logger.Default.LogMode(logger.Error)
	}
	
	// Open database connection
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}
	
	// Get underlying sql.DB instance for connection pooling
	sqlDB, err := DB.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}
	
	// Set connection pool settings (optimized for production)
	sqlDB.SetMaxIdleConns(10)                    // Maximum idle connections
	sqlDB.SetMaxOpenConns(100)                   // Maximum open connections
	sqlDB.SetConnMaxLifetime(time.Hour)          // Maximum connection lifetime
	sqlDB.SetConnMaxIdleTime(30 * time.Minute)   // Maximum idle time
	
	// Test connection with ping
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("database ping failed: %v", err)
	}
	
	log.Printf("✅ Successfully connected to PostgreSQL database: %s@%s:%s/%s",
		cfg.DBUser, cfg.DBHost, cfg.DBPort, cfg.DBName)
	
	return DB, nil
}

// GetDB returns the global database instance
func GetDB() *gorm.DB {
	return DB
}

// CloseDB gracefully closes the database connection
func CloseDB() error {
	if DB == nil {
		return nil
	}
	
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance for closing: %v", err)
	}
	
	return sqlDB.Close()
}

// HealthCheck verifies the database connection is still alive
func HealthCheck() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}
	
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed极 get database instance: %v", err)
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	return sqlDB.PingContext(ctx)
}

// IsConnected checks if database is connected and responsive
func IsConnected() bool {
	return HealthCheck() == nil
}

// WithTransaction executes a function within a database transaction
func WithTransaction(txFunc func(*gorm.DB) error) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		return txFunc(tx)
	})
}

// MigrateModels automigrates all database models using modern 'any' type
func MigrateModels(models []any) error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}
	
	return DB.AutoMigrate(models...)
}

// CreateTablesIfNotExists creates tables only if they don't exist
func CreateTablesIfNotExists(models []any) error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}
	
	for _, model := range models {
		if !DB.Migrator().HasTable(model) {
			if err := DB.Migrator().CreateTable(model); err != nil {
				return fmt.Errorf("failed to create table: %v", err)
			}
		}
	}
	return nil
}
