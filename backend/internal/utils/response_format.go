package utils

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

// Response represents a standardized API response
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// SuccessResponse sends a successful response
func SuccessResponse(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, Response{
		Status:  "success",
		Message: message,
		Data:    data,
	})
}

// ErrorResponse sends an error response
func ErrorResponse(c *gin.Context, statusCode int, message string, err error) {
	response := Response{
		Status:  "error",
		Message: message,
	}
	
	if err != nil {
		response.Data = gin.H{"error": err.Error()}
	}
	
	c.JSON(statusCode, response)
}

// Success sends a 200 OK success response
func Success(c *gin.Context, message string, data interface{}) {
	SuccessResponse(c, http.StatusOK, message, data)
}

// Created sends a 201 Created success response
func Created(c *gin.Context, message string, data interface{}) {
	SuccessResponse(c, http.StatusCreated, message, data)
}

// BadRequest sends a 400 Bad Request error response
func BadRequest(c *gin.Context, message string, err error) {
	ErrorResponse(c, http.StatusBadRequest, message, err)
}

// Unauthorized sends a 401 Unauthorized error response
func Unauthorized(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusUnauthorized, message, nil)
}

// Forbidden sends a 403 Forbidden error response
func Forbidden(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusForbidden, message, nil)
}

// NotFound sends a 404 Not Found error response
func NotFound(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusNotFound, message, nil)
}

// InternalServerError sends a 500 Internal Server Error response
func InternalServerError(c *gin.Context, message string, err error) {
	ErrorResponse(c, http.StatusInternalServerError, message, err)
}

// Conflict sends a 409 Conflict response
func Conflict(c *gin.Context, message string) {
	ErrorResponse(c, http.StatusConflict, message, nil)
}