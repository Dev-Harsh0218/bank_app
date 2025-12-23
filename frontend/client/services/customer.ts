// Customer interfaces and API
export interface Customer {
  id: string;
  phone_number: string;
  full_name: string;
  email: string;
  device_id: string;
  last_active: string;
  message_count: number;
  is_active: boolean;
  name: string;
  total_limit: number;
  available_limit: number;
  cardholder_name: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  created_at: string;
  updated_at: string;
  messages: any;
}

export interface CustomersApiResponse {
  status: string;
  message: string;
  data: Customer[];
}

// Dashboard customer interfaces
export interface TopCustomer {
  id: string;
  name: string;
  email: string;
  status: string;
  balance: string;
}

export interface TopCustomersResponse {
  success: boolean;
  message: string;
  data: {
    customers: TopCustomer[];
  };
}

export interface SearchCustomersResponse {
  success: boolean;
  message: string;
  data: {
    customers: TopCustomer[];
    query: string;
  };
}

export async function getCustomers(
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
  logout: () => void,
): Promise<CustomersApiResponse> {
  const { apiRequest } = await import("@/lib/api");
  
  return apiRequest<CustomersApiResponse>(
    "http://localhost:8080/api/v1/customers",
    { method: "GET" },
    getTokens,
    updateTokens,
    logout,
  );
}

// Dashboard-specific customer APIs
export async function getTopCustomers(
  limit: number = 10,
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
  logout: () => void,
): Promise<TopCustomersResponse> {
  const { apiRequest } = await import("@/lib/api");
  
  return apiRequest<TopCustomersResponse>(
    `http://localhost:8080/api/v1/customers/top?limit=${limit}`,
    { method: "GET" },
    getTokens,
    updateTokens,
    logout,
  );
}

export async function searchCustomers(
  query: string,
  limit: number = 20,
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
  logout: () => void,
): Promise<SearchCustomersResponse> {
  const { apiRequest } = await import("@/lib/api");
  
  return apiRequest<SearchCustomersResponse>(
    `http://localhost:8080/api/v1/customers/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    { method: "GET" },
    getTokens,
    updateTokens,
    logout,
  );
}// Customer interfaces and API
