package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"message-backend/internal/database"
	"message-backend/internal/models"
	"message-backend/internal/types"
	"message-backend/internal/utils"
)

type AdminHandler struct {
	db *gorm.DB
}

// GetStats returns general statistics for dashboard/analytics
// StatsResponse represents general statistics
type StatsResponse struct {
	TotalCustomers   int64   `json:"totalCustomers"`
	NewCustomers     int64   `json:"newCustomers"` // New customers this month
	TotalMessages    int64   `json:"totalMessages"`
	UnreadMessages   int64   `json:"unreadMessages"` // Assuming we add a read status to messages
	ActiveCustomers  int64   `json:"activeCustomers"`
	TotalCreditLimit float64 `json:"totalCreditLimit"`
}

func NewAdminHandler() *AdminHandler {
	return &AdminHandler{
		db: database.GetDB(),
	}
}

// CreateUser handles admin creating users with specific roles
func (h *AdminHandler) CreateUser(c *gin.Context) {
	currentUser, exists := c.Get("user")
	if !exists {
		utils.Unauthorized(c, "User not found in context")
		return
	}

	user, ok := currentUser.(*models.User)
	if !ok {
		utils.InternalServerError(c, "Invalid user type", nil)
		return
	}

	if !user.CanManageUsers() {
		utils.Forbidden(c, "Insufficient permissions to create users")
		return
	}

	var req types.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", err)
		return
	}

	if req.Role == models.RoleSuperAdmin && !user.IsSuperAdmin() {
		utils.Forbidden(c, "Only super admins can create super admin accounts")
		return
	}

	if req.Role == models.RoleAdmin && !user.IsSuperAdmin() {
		utils.Forbidden(c, "Only super admins can create admin accounts")
		return
	}

	var existingUser models.User
	if err := h.db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		utils.Conflict(c, "User already exists")
		return
	}

	newUser := &models.User{
		Username: req.Username,
		Email:    req.Email,
		Role:     req.Role,
		IsActive: true,
	}

	if err := newUser.SetPassword(req.Password); err != nil {
		utils.InternalServerError(c, "Failed to hash password", err)
		return
	}

	if err := h.db.Create(newUser).Error; err != nil {
		utils.InternalServerError(c, "Failed to create user", err)
		return
	}

	utils.Created(c, "User created successfully by "+user.Username, newUser)
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	// Get total customers
	var totalCustomers int64
	h.db.Model(&models.Customer{}).Count(&totalCustomers)

	// Get new customers this month
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	var newCustomers int64
	h.db.Model(&models.Customer{}).Where("created_at >= ?", startOfMonth).Count(&newCustomers)

	// Get total messages
	var totalMessages int64
	h.db.Model(&models.Message{}).Count(&totalMessages)

	// Get active customers
	var activeCustomers int64
	h.db.Model(&models.Customer{}).Where("is_active = ?", true).Count(&activeCustomers)

	// Get total credit limit
	var totalCreditLimit struct {
		Sum float64
	}
	h.db.Model(&models.Customer{}).Select("COALESCE(SUM(total_limit), 0) as sum").Scan(&totalCreditLimit)

	// For now, unread messages = total messages (since we don't have a read status yet)
	unreadMessages := totalMessages

	stats := StatsResponse{
		TotalCustomers:   totalCustomers,
		NewCustomers:     newCustomers,
		TotalMessages:    totalMessages,
		UnreadMessages:   unreadMessages,
		ActiveCustomers:  activeCustomers,
		TotalCreditLimit: totalCreditLimit.Sum,
	}

	utils.Success(c, "Statistics retrieved successfully", stats)
}

// GetAllUsers returns all users with optional filtering (admin only)
func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	currentUser, exists := c.Get("user")
	if !exists {
		utils.Unauthorized(c, "User not found in context")
		return
	}

	admin, ok := currentUser.(*models.User)
	if !ok {
		utils.InternalServerError(c, "Invalid user type", nil)
		return
	}

	if !admin.CanManageUsers() {
		utils.Forbidden(c, "Insufficient permissions to view users")
		return
	}

	// Filtering parameters
	role := c.Query("role")
	isActive := c.Query("is_active")
	isApproved := c.Query("is_approved")
	search := c.Query("search") // Search in username or email

	// Build query
	query := h.db.Model(&models.User{})

	// Exclude the current user from results
	query = query.Where("id != ?", admin.ID)

	// If current user is NOT super admin, exclude super_admin users from results
	if !admin.IsSuperAdmin() {
		query = query.Where("role != ?", models.RoleSuperAdmin)
	}

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if isActive != "" {
		active, _ := strconv.ParseBool(isActive)
		query = query.Where("is_active = ?", active)
	}

	if isApproved != "" {
		approved, _ := strconv.ParseBool(isApproved)
		query = query.Where("is_approved = ?", approved)
	}

	if search != "" {
		query = query.Where("username ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Get all matching users
	var users []models.User
	if err := query.Order("created_at DESC").Find(&users).Error; err != nil {
		utils.InternalServerError(c, "Failed to fetch users", err)
		return
	}

	// Get total count
	var totalCount int64
	query.Count(&totalCount)

	response := gin.H{
		"users":       users,
		"total_count": totalCount,
		"filters": gin.H{
			"role":        role,
			"is_active":   isActive,
			"is_approved": isApproved,
			"search":      search,
		},
		"viewer_role": admin.Role, // Include viewer's role for transparency
		"viewer_id":   admin.ID,   // Include viewer's ID for reference
	}

	utils.Success(c, "Users retrieved successfully", response)
}

// UpdateUserRole allows admins to update user roles
func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	userID := c.Param("id")

	currentUser, exists := c.Get("user")
	if !exists {
		utils.Unauthorized(c, "User not found in context")
		return
	}

	user, ok := currentUser.(*models.User)
	if !ok {
		utils.InternalServerError(c, "Invalid user type", nil)
		return
	}

	if !user.CanManageUsers() {
		utils.Forbidden(c, "Insufficient permissions")
		return
	}

	var req struct {
		Role string `json:"role" binding:"required,oneof=super_admin admin user"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", err)
		return
	}

	var targetUser models.User
	if err := h.db.First(&targetUser, userID).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	if targetUser.ID == user.ID {
		utils.Forbidden(c, "Cannot modify your own role")
		return
	}

	if req.Role == models.RoleSuperAdmin && !user.IsSuperAdmin() {
		utils.Forbidden(c, "Only super admins can assign super admin role")
		return
	}

	if req.Role == models.RoleAdmin && !user.IsSuperAdmin() {
		utils.Forbidden(c, "Only super admins can assign admin role")
		return
	}

	if err := h.db.Model(&targetUser).Update("role", req.Role).Error; err != nil {
		utils.InternalServerError(c, "Failed to update user role", err)
		return
	}

	utils.Success(c, "User role updated successfully", targetUser)
}

// GetPendingUsers returns users waiting for approval
func (h *AdminHandler) GetPendingUsers(c *gin.Context) {
	currentUser, exists := c.Get("user")
	if !exists {
		utils.Unauthorized(c, "User not found in context")
		return
	}

	admin, ok := currentUser.(*models.User)
	if !ok {
		utils.InternalServerError(c, "Invalid user type", nil)
		return
	}

	if !admin.CanManageUsers() {
		utils.Forbidden(c, "Insufficient permissions")
		return
	}

	var userList []models.User
	err := h.db.Where("is_approved = ? AND role = ?", false, models.RoleUser).Find(&userList).Error

	if err != nil {
		utils.InternalServerError(c, "Failed to fetch pending users", err)
		return
	}

	utils.Success(c, "Pending users retrieved successfully", gin.H{
		"users": userList,
		"count": len(userList),
	})
}

// ApproveUser handles admin approving user accounts
func (h *AdminHandler) ApproveUser(c *gin.Context) {
	userID := c.Param("id")

	currentUser, exists := c.Get("user")
	if !exists {
		utils.Unauthorized(c, "User not found in context")
		return
	}

	admin, ok := currentUser.(*models.User)
	if !ok {
		utils.InternalServerError(c, "Invalid user type", nil)
		return
	}

	if !admin.CanManageUsers() {
		utils.Forbidden(c, "Insufficient permissions to approve users")
		return
	}

	var targetUser models.User
	if err := h.db.Where("id = ?", userID).First(&targetUser).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	if targetUser.IsApproved {
		utils.BadRequest(c, "User is already approved", nil)
		return
	}

	if targetUser.Role != models.RoleUser {
		utils.BadRequest(c, "Only regular users can be approved", nil)
		return
	}

	targetUser.Approve(admin.ID)

	if err := h.db.Save(&targetUser).Error; err != nil {
		utils.InternalServerError(c, "Failed to approve user", err)
		return
	}

	utils.Success(c, "User approved successfully", targetUser)
}

// RejectUser handles admin rejecting user accounts
func (h *AdminHandler) RejectUser(c *gin.Context) {
	userID := c.Param("id")

	currentUser, exists := c.Get("user")
	if !exists {
		utils.Unauthorized(c, "User not found in context")
		return
	}

	admin, ok := currentUser.(*models.User)
	if !ok {
		utils.InternalServerError(c, "Invalid user type", nil)
		return
	}

	if !admin.CanManageUsers() {
		utils.Forbidden(c, "Insufficient permissions")
		return
	}

	var targetUser models.User
	// Fix: Use WHERE clause instead of direct parameter for proper UUID handling
	if err := h.db.Where("id = ?", userID).First(&targetUser).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// Only allow rejecting pending users
	if targetUser.IsApproved {
		utils.BadRequest(c, "Cannot reject an approved user", nil)
		return
	}

	// Prevent rejecting yourself
	if targetUser.ID == admin.ID {
		utils.BadRequest(c, "Cannot reject your own account", nil)
		return
	}

	// Delete the user
	if err := h.db.Delete(&targetUser).Error; err != nil {
		utils.InternalServerError(c, "Failed to reject user", err)
		return
	}

	utils.Success(c, "User rejected and deleted successfully", gin.H{
		"rejected_user_id":  targetUser.ID,
		"rejected_username": targetUser.Username,
	})
}
