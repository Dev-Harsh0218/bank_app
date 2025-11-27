package models

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents administrators who can access the management panel
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;not null;size:50" json:"username"`
	Email     string    `gorm:"uniqueIndex;size:100" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Role      string    `gorm:"default:admin;size:20" json:"role"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	LastLogin time.Time `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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

// IsSuperAdmin checks if the user has super admin privileges
func (u *User) IsSuperAdmin() bool {
	return u.Role == "super_admin"
}

// BeforeCreate GORM hook for validation
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Username == "" {
		return errors.New("username is required")
	}
	if u.Password == "" {
		return errors.New("password is required")
	}
	return nil
}