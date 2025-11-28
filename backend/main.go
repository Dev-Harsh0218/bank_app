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
	"message-backend/internal/handlers"
	"message-backend/internal/middleware"
	"message-backend/internal/models"

	// external modules
	"github.com/gin-gonic/gin"
)

func main() {
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
		log.Fatalf("❌ Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	// Auto migrate models
	if err := db.AutoMigrate(&models.User{}); err != nil {
		log.Fatalf("❌ Failed to migrate database: %v", err)
	}

	// Gin router
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Setup routes
	setupRoutes(router)

	// Create server with timeout
	server := &http.Server{
		Addr:         cfg.ServerHost + ":" + cfg.ServerPort,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
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
	// Add CORS middleware
	router.Use(middleware.CORSMiddleware())
	
	// Initialize handlers
	authHandler := handlers.NewAuthHandler()
	authMiddleware := middleware.NewAuthMiddleware()
	
	// ========================
	// HIDDEN SEED ROUTES (No authentication, only secret key)
	// ========================
	router.POST("/_seed/super-admin", handlers.SeedSuperAdmin)
	router.POST("/_seed/reset-admin", handlers.ResetSuperAdmin)
	router.GET("/_seed/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "seed_endpoints_available"})
	})
	
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
		// Public auth routes
		auth := apiV1.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
		}
		
		// Protected routes
		protected := apiV1.Group("")
		protected.Use(authMiddleware.JWTAuth())
		{
			// User profile
			protected.GET("/profile", authHandler.GetProfile)
			
			// Admin only routes
			admin := protected.Group("")
			admin.Use(authMiddleware.RoleMiddleware(models.RoleAdmin))
			{
				admin.POST("/users", authHandler.CreateUser)
				admin.PUT("/users/:id/role", authHandler.UpdateUserRole)
			}
			
			// Add more protected routes here later
		}
		
		// Public status
		apiV1.GET("/status", func(c *gin.Context) {
			c.JSON(200, gin.H{"极sage": "API is running"})
		})
	}
	
	// Default route
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message":   "Bank App Backend API",
			"version":   "1.0.0",
			"endpoints": []string{
				"/health", 
				"/api/v1/auth/signup", 
				"/api/v1/auth/login", 
				"/api/v1/auth/logout", 
				"/api/v1/profile", 
				"/api/v1/users", 
				"/api/v1/status",
				"/_seed/health", // Hidden endpoint
			},
		})
	})
}