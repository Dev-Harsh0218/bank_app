package handlers

import (
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
	if err := h.db.First(&targetUser, userID).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// Check if user can be approved
	if targetUser.IsApproved {
		utils.BadRequest(c, "User is already approved", nil)
		return
	}

	if targetUser.Role != models.RoleUser {
		utils.BadRequest(c, "Only regular users can be approved", nil)
		return
	}

	// Approve the user
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
	if err := h.db.First(&targetUser, userID).Error; err != nil {
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
		"rejected_user_id": targetUser.ID,
		"rejected_username": targetUser.Username,
	})
}