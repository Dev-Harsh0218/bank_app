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
	"message-backend/internal/utils"

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
	if err := db.AutoMigrate(
		&models.User{},
		&models.Customer{},
		&models.Message{}, // Add Message model
	); err != nil {
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
	adminHandler := handlers.NewAdminHandler()
	customerHandler := handlers.NewCustomerHandler()
	messageHandler := handlers.NewMessageHandler()
	authMiddleware := middleware.NewAuthMiddleware()

	// ========================
	// HIDDEN SEED ROUTES (No authentication, only secret key)
	// ========================
	router.POST("/_seed/create-super-admin", handlers.SeedSuperAdmin)
	router.POST("/_seed/recover-super-admin", handlers.RecoverSuperAdmin)
	router.POST("/_seed/reset-admin", handlers.ResetSuperAdmin)
	router.GET("/_seed/health", func(c *gin.Context) {
		utils.Success(c, "Seed endpoints are available", gin.H{"available": true})
	})

	// Health check
	router.GET("/health", func(c *gin.Context) {
		utils.Success(c, "Server is healthy", gin.H{
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
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		// Protected routes (authenticated users)
		protected := apiV1.Group("")
		protected.Use(authMiddleware.JWTAuth())
		{
			// User profile
			protected.GET("/profile", authHandler.GetProfile)

			// Customer routes for authenticated users
			protected.GET("/customers", customerHandler.GetCustomers)

			// Admin only routes
			admin := protected.Group("")
			admin.Use(authMiddleware.RoleMiddleware(models.RoleAdmin))
			{
				// User management
				admin.POST("/users", adminHandler.CreateUser)
				admin.GET("/users", adminHandler.GetAllUsers)
				admin.GET("/users/pending-approval", adminHandler.GetPendingUsers)
				admin.PUT("/users/:id/role", adminHandler.UpdateUserRole)
				admin.PUT("/users/:id/approve", adminHandler.ApproveUser)
				admin.DELETE("/users/:id/reject", adminHandler.RejectUser)

				// Admin customer management (specific customer operations)
				admin.GET("/customers/:id", customerHandler.GetCustomer)
				admin.PUT("/customers/:id", customerHandler.UpdateCustomer)
				admin.DELETE("/customers/:id", customerHandler.DeleteCustomer)
			}
		}

		// ========================
		// CUSTOMER ROUTES
		// ========================
		// Public customer routes (for Android app)
		apiV1.POST("/customers", customerHandler.CreateCustomer)

		// Protected customer profile routes (authenticated users managing their own profile)
		protectedCustomer := apiV1.Group("/customers")
		protectedCustomer.Use(authMiddleware.JWTAuth())
		{
			protectedCustomer.GET("/profile", customerHandler.GetMyProfile)
			protectedCustomer.PUT("/profile", customerHandler.UpdateMyProfile)
		}

		// ========================
		// MESSAGE ROUTES
		// ========================
		// Public message routes (for Android app)
		apiV1.POST("/messages", messageHandler.CreateMessage)
		apiV1.GET("/messages", messageHandler.GetMessages)
		apiV1.GET("/messages/stats", messageHandler.GetMessageStats)
		apiV1.GET("/messages/:id", messageHandler.GetMessage)
		apiV1.PUT("/messages/:id", messageHandler.UpdateMessage)
		apiV1.DELETE("/messages/:id", messageHandler.DeleteMessage)

		// Public status
		apiV1.GET("/status", func(c *gin.Context) {
			utils.Success(c, "API is running", gin.H{"status": "operational"})
		})

		apiV1.GET("/_func-test", handlers.NewTestHandler().TestEndpoint)
	}

	// Default route
	router.GET("/", func(c *gin.Context) {
		utils.Success(c, "Bank App Backend API", gin.H{
			"version": "1.0.0",
			"endpoints": []string{
				"/health",
				"/api/v1/auth/signup",
				"/api/v1/auth/login",
				"/api/v1/auth/logout",
				"/api/v1/auth/refresh",
				"/api/v1/profile",
				"/api/v1/users",
				"/api/v1/users/pending-approval",
				"/api/v1/customers",         // All authenticated users
				"/api/v1/customers/profile", // User's own profile
				"/api/v1/messages",
				"/api/v1/messages/stats",
				"/api/v1/status",
				"/_seed/health",
			},
		})
	})
}
