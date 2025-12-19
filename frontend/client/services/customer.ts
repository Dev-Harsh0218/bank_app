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