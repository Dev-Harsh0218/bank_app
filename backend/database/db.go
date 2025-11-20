package database

import (
	"fmt"
	"message-backend/config"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)


var DB *gorm.DB
var IsConnected bool = false

func InitDB() (*gorm.DB, error){
    cfg := config.LoadConfig()

    // Build PostgreSQL connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DB_HOST,
		cfg.DB_PORT,
		cfg.DB_USER,
		cfg.DB_PASS,
		cfg.DB_NAME,
	)
    var err error
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        IsConnected = false
        return nil, fmt.Errorf("fialed to create a database instance %v", err);
    }

    sqlDB, err := DB.DB()
    
    if err != nil {
        IsConnected = false
        return nil, fmt.Errorf("failed to get database instance: %v", err);
    }

    // Set connection pool settings
    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(time.Hour)

    if err := sqlDB.Ping(); err != nil {
        IsConnected = false
        return nil, fmt.Errorf("database ping failed: %v", err)
    }
    
    IsConnected = true
    fmt.Println("✅ Successfully connected to PostgreSQL database")
	return DB, nil
}

func GetDB() *gorm.DB {
	return DB
}


func CheckConnection() bool {
    if DB == nil {
        return false
    }

    sqlDB, err := DB.DB()
    if err != nil {
        return false
    }
    
    if err := sqlDB.Ping(); err != nil {
        IsConnected = false
        return false
    }

    IsConnected = true
    return true
}

func IsDatabaseConfigured() bool {
    cfg := config.LoadConfig()
    return cfg.DB_HOST != "" && cfg.DB_USER != "" &&  cfg.DB_NAME != ""
}
