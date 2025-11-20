package models

import (
	"gorm.io/gorm"
)


type Message struct {
	gorm.Model
	ID uint `gorm:"primaryKey" json:"id"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	Message string `json:"message" binding:"required"`
	Timestamp string `json:"timestamp"`
	Direction string `json:"direction"` //"incoming" or "outgoing"
	UserID uint `json:"user_id"`
	User User `json:"-" gorm:"foreignKey:UserID"`
}