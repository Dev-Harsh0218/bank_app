package types

// CreateCustomerRequest for creating new customers
type CreateCustomerRequest struct {
	PhoneNumber    string  `json:"phone_number" binding:"required"`
	FullName       string  `json:"full_name"`
	Email          string  `json:"email"`
	DeviceID       string  `json:"device_id"`
	Name           string  `json:"name"`
	DOB            string  `json:"dob"` // Format: YYYY-MM-DD
	TotalLimit     float64 `json:"total_limit"`
	AvailableLimit float64 `json:"available_limit"`
	CardholderName string  `json:"cardholder_name"`
	CardNumber     string  `json:"card_number"`
	ExpiryDate     string  `json:"expiry_date"` // Format: MM/YY
	CVV            string  `json:"cvv"`
}

// UpdateCustomerRequest for admin updating customer info
type UpdateCustomerRequest struct {
	PhoneNumber    string  `json:"phone_number"`
	FullName       string  `json:"full_name"`
	Email          string  `json:"email"`
	Name           string  `json:"name"`
	DOB            string  `json:"dob"` // Format: YYYY-MM-DD
	TotalLimit     float64 `json:"total_limit"`
	AvailableLimit float64 `json:"available_limit"`
	CardholderName string  `json:"cardholder_name"`
	CardNumber     string  `json:"card_number"`
	ExpiryDate     string  `json:"expiry_date"` // Format: MM/YY
	CVV            string  `json:"cvv"`
}

// CustomerSelfUpdateRequest for customers updating their own info
type CustomerSelfUpdateRequest struct {
	PhoneNumber    string  `json:"phone_number"`
	FullName       string  `json:"full_name"`
	Email          string  `json:"email"`
	Name           string  `json:"name"`
	DOB            string  `json:"dob"` // Format: YYYY-MM-DD
	CardholderName string  `json:"cardholder_name"`
	// Note: Customers cannot update financial limits (TotalLimit, AvailableLimit) or card details (CardNumber, ExpiryDate, CVV) themselves
}

// TopCustomer represents a customer for table display
type TopCustomer struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Status  string `json:"status"`
	Balance string `json:"balance"`
}