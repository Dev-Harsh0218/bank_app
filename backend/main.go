package main

import (
	// standard-modules
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	// local-modules
	"message-backend/internal/config"
	"message-backend/internal/database"
	"message-backend/internal/models"

	//internal modules
	"github.com/gin-gonic/gin"
)

func main(){
	// Load configuration from environment variables
	cfg := config.LoadConfig()

    // set Gin mode based on environment
    if cfg.AppEnv == "production" {
        gin.SetMode(gin.ReleaseMode)
    } else {
        gin.SetMode(gin.DebugMode)
    }



    db, err := database.InitDB()
    if err != nil {
        log.Fatalf("X Failed to initialize database: %v", err)
    }
    defer database.CloseDB()

    // Auto migrate models
    if err := db.AutoMigrate(&models.User{}, &models.Message{}); err != nil {
        log.Fatalf("X Failed to migrate database: %v", err)
    }

    //Gin router
    router := gin.New()
    router.Use(gin.Logger())
    router.Use(gin.Recovery())

    // setup routes
    setupRoutes(router)

    //create server with timeout
    server := &http.Server{
        Addr: cfg.ServerHost + ":" + cfg.ServerPort,
        Handler: router,
        ReadTimeout: 30 * time.Second,
		WriteTimeout: 30 * time.Second,
        IdleTimeout: 60 * time.Second,
    }

    // Starting server in goroutine
    go func() {
		log.Printf("🚀 Server starting on %s:%s", cfg.ServerHost, cfg.ServerPort)
		log.Printf("📊 Environment: %s", cfg.AppEnv)
		log.Printf("🔧 Debug mode: %t", cfg.AppDebug)
		
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Failed to start server: %v", err)
		}
	}()

    // Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("❌ Server forced to shutdown: %v", err)
	}
	log.Println("✅ Server exited properly")
}

func setupRoutes(router *gin.Engine) {
	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
		})
	})

	// API v1 routes
	apiV1 := router.Group("/api/v1")
	{
		// Public routes
		apiV1.GET("/status", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "API is running"})
		})

		// We'll add auth and message routes here later
	}

	// Default route
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message":   "Message Backend API",
			"version":   "1.0.0",
			"endpoints": []string{"/health", "/api/v1/status"},
		})
	})
}
