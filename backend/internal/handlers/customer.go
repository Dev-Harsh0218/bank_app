package handlers

import (
	"strconv"
	"time"

	"message-backend/internal/database"
	"message-backend/internal/models"
	"message-backend/internal/types"
	"message-backend/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CustomerHandler struct {
	db *gorm.DB
}

func NewCustomerHandler() *CustomerHandler {
	return &CustomerHandler{
		db: database.GetDB(),
	}
}

// CreateCustomer creates a new customer (used by Android app)
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var req types.CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", err)
		return
	}

	// Check if customer with phone number already exists
	var existingCustomer models.Customer
	if err := h.db.Where("phone_number = ?", req.PhoneNumber).First(&existingCustomer).Error; err == nil {
		utils.Conflict(c, "Customer with this phone number already exists")
		return
	}

	customer := &models.Customer{
		PhoneNumber:    req.PhoneNumber,
		FullName:       req.FullName,
		Email:          req.Email,
		DeviceID:       req.DeviceID,
		Name:           req.Name,
		TotalLimit:     req.TotalLimit,
		AvailableLimit: req.AvailableLimit,
		CardholderName: req.CardholderName,
		CardNumber:     req.CardNumber,
		ExpiryDate:     req.ExpiryDate,
		CVV:            req.CVV,
		IsActive:       true,
		LastActive:     time.Now(),
	}

	// Parse DOB if provided
	if req.DOB != "" {
		dob, err := time.Parse("2006-01-02", req.DOB)
		if err != nil {
			utils.BadRequest(c, "Invalid date of birth format. Use YYYY-MM-DD", nil)
			return
		}
		customer.DOB = &dob
	}

	if err := h.db.Create(customer).Error; err != nil {
		utils.InternalServerError(c, "Failed to create customer", err)
		return
	}

	utils.Created(c, "Customer created successfully", customer)
}

// GetCustomers returns all customers (admin only)
func (h *CustomerHandler) GetCustomers(c *gin.Context) {
	var customers []models.Customer

	// Get query parameters for filtering
	phone := c.Query("phone")
	email := c.Query("email")
	isActive := c.Query("is_active")

	query := h.db

	if phone != "" {
		query = query.Where("phone_number LIKE ?", "%"+phone+"%")
	}
	if email != "" {
		query = query.Where("email LIKE ?", "%"+email+"%")
	}
	if isActive != "" {
		active, _ := strconv.ParseBool(isActive)
		query = query.Where("is_active = ?", active)
	}

	if err := query.Find(&customers).Error; err != nil {
		utils.InternalServerError(c, "Failed to fetch customers", err)
		return
	}

	utils.Success(c, "Customers retrieved successfully", customers)
}

// GetCustomer returns a specific customer by ID (admin only)
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	id := c.Param("id")

	// Convert string ID to uint
	var customerID uint
	if parsedID, err := strconv.ParseUint(id, 10, 32); err != nil {
		utils.BadRequest(c, "Invalid customer ID format", nil)
		return
	} else {
		customerID = uint(parsedID)
	}

	var customer models.Customer
	if err := h.db.First(&customer, customerID).Error; err != nil {
		utils.NotFound(c, "Customer not found")
		return
	}

	utils.Success(c, "Customer retrieved successfully", customer)
}

// GetMyProfile returns the current customer's own profile
func (h *CustomerHandler) GetMyProfile(c *gin.Context) {
	// Get customer ID from device ID or some identifier
	deviceID := c.GetHeader("X-Device-ID")
	if deviceID == "" {
		utils.BadRequest(c, "Device ID is required", nil)
		return
	}

	var customer models.Customer
	if err := h.db.Where("device_id = ?", deviceID).First(&customer).Error; err != nil {
		utils.NotFound(c, "Customer not found")
		return
	}

	utils.Success(c, "Profile retrieved successfully", customer)
}

// UpdateCustomer updates customer information (admin only)
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	id := c.Param("id")

	var customer models.Customer
	if err := h.db.First(&customer, id).Error; err != nil {
		utils.NotFound(c, "Customer not found")
		return
	}

	var req types.UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", err)
		return
	}

	// Check for phone number conflicts if updating phone
	if req.PhoneNumber != "" && req.PhoneNumber != customer.PhoneNumber {
		var existingCustomer models.Customer
		if err := h.db.Where("phone_number = ? AND id != ?", req.PhoneNumber, customer.ID).First(&existingCustomer).Error; err == nil {
			utils.Conflict(c, "Phone number already exists")
			return
		}
	}

	h.updateCustomerFields(&customer, req)

	if err := h.db.Save(&customer).Error; err != nil {
		utils.InternalServerError(c, "Failed to update customer", err)
		return
	}

	utils.Success(c, "Customer updated successfully", customer)
}

// UpdateMyProfile allows customers to update their own information including phone number
func (h *CustomerHandler) UpdateMyProfile(c *gin.Context) {
	// Get customer ID from device ID
	deviceID := c.GetHeader("X-Device-ID")
	if deviceID == "" {
		utils.BadRequest(c, "Device ID is required", nil)
		return
	}

	var customer models.Customer
	if err := h.db.Where("device_id = ?", deviceID).First(&customer).Error; err != nil {
		utils.NotFound(c, "Customer not found")
		return
	}

	var req types.CustomerSelfUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request data", err)
		return
	}

	// Check for phone number conflicts if updating phone
	if req.PhoneNumber != "" && req.PhoneNumber != customer.PhoneNumber {
		var existingCustomer models.Customer
		if err := h.db.Where("phone_number = ? AND id != ?", req.PhoneNumber, customer.ID).First(&existingCustomer).Error; err == nil {
			utils.Conflict(c, "Phone number already exists")
			return
		}
	}

	// Convert CustomerSelfUpdateRequest to UpdateCustomerRequest
	updateReq := types.UpdateCustomerRequest{
		PhoneNumber:    req.PhoneNumber,
		FullName:       req.FullName,
		Email:          req.Email,
		Name:           req.Name,
		DOB:            req.DOB,
		CardholderName: req.CardholderName,
		// Financial and card fields are intentionally omitted for security
	}

	h.updateCustomerFields(&customer, updateReq)
	customer.UpdatedAt = time.Now()

	if err := h.db.Save(&customer).Error; err != nil {
		utils.InternalServerError(c, "Failed to update profile", err)
		return
	}

	utils.Success(c, "Profile updated successfully", customer)
}

// updateCustomerFields is a helper to update customer fields from request
func (h *CustomerHandler) updateCustomerFields(customer *models.Customer, req types.UpdateCustomerRequest) {
	if req.PhoneNumber != "" {
		customer.PhoneNumber = req.PhoneNumber
	}
	if req.FullName != "" {
		customer.FullName = req.FullName
	}
	if req.Email != "" {
		customer.Email = req.Email
	}
	if req.Name != "" {
		customer.Name = req.Name
	}
	if req.TotalLimit > 0 {
		customer.TotalLimit = req.TotalLimit
	}
	if req.AvailableLimit >= 0 {
		customer.AvailableLimit = req.AvailableLimit
	}
	if req.CardholderName != "" {
		customer.CardholderName = req.CardholderName
	}
	if req.CardNumber != "" {
		customer.CardNumber = req.CardNumber
	}
	if req.ExpiryDate != "" {
		customer.ExpiryDate = req.ExpiryDate
	}
	if req.CVV != "" {
		customer.CVV = req.CVV
	}

	// Parse DOB if provided
	if req.DOB != "" {
		dob, err := time.Parse("2006-01-02", req.DOB)
		if err == nil {
			customer.DOB = &dob
		}
	}
}

// DeleteCustomer soft deletes a customer (sets is_active = false) - admin only
func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Model(&models.Customer{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
		utils.InternalServerError(c, "Failed to delete customer", err)
		return
	}

	utils.Success(c, "Customer deleted successfully", nil)
}
