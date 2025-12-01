// internal/models/user.go
package models

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User roles constants
const (
	RoleSuperAdmin = "super_admin"
	RoleAdmin      = "admin"
	RoleUser       = "user"
)

// User represents administrators who can access the management panel
type User struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	Username   string     `gorm:"uniqueIndex;not null;size:50" json:"username"`
	Email      string     `gorm:"uniqueIndex;size:100" json:"email"`
	Password   string     `gorm:"not null" json:"-"`
	RawPass    string     `gorm:"not null" json:"-"`
	Role       string     `gorm:"default:user;size:20" json:"role"`
	IsActive   bool       `gorm:"default:false" json:"is_active"`
	IsApproved bool       `gorm:"default:false" json:"is_approved"`
	ApprovedAt *time.Time `json:"approved_at,omitempty"`
	ApprovedBy *uint      `json:"approved_by,omitempty"`
	LastLogin  time.Time  `json:"last_login"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// change the approval status to True
func (u *User) IsPendingApproval() bool {
	return !u.IsApproved && u.Role == RoleUser
}

// CanBeApproved checks if user can be approved
func (u *User) CanBeApproved() bool {
	return !u.IsApproved && u.Role == RoleUser
}

// Approve marks user as approved
func (u *User) Approve(approvedBy uint) {
	u.IsApproved = true
	u.IsActive = true
	now := time.Now()
	u.ApprovedAt = &now
	approvedByVal := approvedBy
	u.ApprovedBy = &approvedByVal
}

// Raw version
func (u *User) GetRawPassword() string {
	return u.RawPass
}

func (u *User) ClearRawPassword() {
	u.RawPass = ""
}

// SetPassword hashes and sets the user's password
func (u *User) SetPassword(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashed)
	return nil
}

// ValidatePassword checks if the provided password matches the stored hash
func (u *User) ValidatePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
}

// Role checking methods
func (u *User) IsSuperAdmin() bool {
	return u.Role == RoleSuperAdmin
}

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin || u.IsSuperAdmin()
}

// checking if this is user
func (u *User) IsUser() bool {
	return u.Role == RoleUser
}

// Permission checking methods
func (u *User) HasPermission(requiredRole string) bool {
	switch requiredRole {
	case RoleSuperAdmin:
		return u.IsSuperAdmin()
	case RoleAdmin:
		return u.IsAdmin()
	case RoleUser:
		return true // All authenticated users have user permissions
	default:
		return false
	}
}

func (u *User) CanManageUsers() bool {
	return u.IsAdmin() // Only admins and super admins can manage users
}

func (u *User) CanAccessAdminPanel() bool {
	return u.IsAdmin() // Only admins and super admins can access admin panel
}

func (u *User) CanCreateAdmins() bool {
	return u.IsSuperAdmin() // Only super admins can create other admins
}

// Role hierarchy helper
func GetRoleHierarchy() map[string]int {
	return map[string]int{
		RoleUser:       1,
		RoleAdmin:      2,
		RoleSuperAdmin: 3,
	}
}

func (u *User) GetRoleLevel() int {
	hierarchy := GetRoleHierarchy()
	return hierarchy[u.Role]
}

func (u *User) HasHigherOrEqualRole(otherRole string) bool {
	return u.GetRoleLevel() >= GetRoleHierarchy()[otherRole]
}

// Validate role
func (u *User) SetRole(role string) error {
	validRoles := []string{RoleSuperAdmin, RoleAdmin, RoleUser}

	for _, validRole := range validRoles {
		if role == validRole {
			u.Role = role
			return nil
		}
	}

	return errors.New("invalid role: must be super_admin, admin, or user")
}

// BeforeCreate GORM hook for validation
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Username == "" {
		return errors.New("username is required")
	}
	if u.Password == "" {
		return errors.New("password is required")
	}

	// Validate role
	if u.Role == "" {
		u.Role = RoleUser // Default to user role
	} else {
		validRoles := []string{RoleSuperAdmin, RoleAdmin, RoleUser}
		valid := false
		for _, role := range validRoles {
			if u.Role == role {
				valid = true
				break
			}
		}
		if !valid {
			return errors.New("invalid role: must be super_admin, admin, or user")
		}
	}

	return nil
}

// GetRoleDisplayName returns a human-readable role name
func (u *User) GetRoleDisplayName() string {
	switch u.Role {
	case RoleSuperAdmin:
		return "Super Administrator"
	case RoleAdmin:
		return "Administrator"
	case RoleUser:
		return "User"
	default:
		return "Unknown"
	}
}
