// Messages interfaces and API
export interface Message {
  id: string;
  customer_id: string;
  content: string;
  timestamp: string;
  starred: boolean;
  created_at: string;
  updated_at: string;
  // Derived fields (we'll populate these from customer data)
  customerName?: string;
  customerEmail?: string;
  subject?: string;
  preview?: string;
  read?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export interface RecentMessage {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  status: string;
}

export interface MessagesResponse {
  success: boolean;
  message: string;
  data: {
    messages: Message[];
    pagination: {
      has_more: boolean;
      limit: number;
      offset: number;
      total: number;
    };
  };
}

export interface RecentMessagesResponse {
  success: boolean;
  message: string;
  data: {
    messages: RecentMessage[];
  };
}

export async function getAllMessages(
  page: number = 1,
  limit: number = 20,
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
  logout: () => void,
): Promise<MessagesResponse> {
  const { apiRequest } = await import("@/lib/api");
  
  return apiRequest<MessagesResponse>(
    `http://localhost:8080/api/v1/messages?page=${page}&limit=${limit}`,
    { method: "GET" },
    getTokens,
    updateTokens,
    logout,
  );
}

export async function getMessagesByCustomer(
  customerId: string,
  page: number = 1,
  limit: number = 50,
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
  logout: () => void,
): Promise<MessagesResponse> {
  const { apiRequest } = await import("@/lib/api");
  
  return apiRequest<MessagesResponse>(
    `http://localhost:8080/api/v1/messages?page=${page}&limit=${limit}`,
    { 
      method: "GET",
      headers: {
        "X-Customer-ID": customerId
      }
    },
    getTokens,
    updateTokens,
    logout,
  );
}

export async function getRecentMessages(
  limit: number = 5,
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
  logout: () => void,
): Promise<RecentMessagesResponse> {
  const { apiRequest } = await import("@/lib/api");
  
  return apiRequest<RecentMessagesResponse>(
    `http://localhost:8080/api/v1/messages/recent?limit=${limit}`,
    { method: "GET" },
    getTokens,
    updateTokens,
    logout,
  );
}

export async function searchMessages(
  query: string,
  page: number = 1,
  limit: number = 20,
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
  logout: () => void,
): Promise<MessagesResponse> {
  const { apiRequest } = await import("@/lib/api");
  
  return apiRequest<MessagesResponse>(
    `http://localhost:8080/api/v1/messages/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    { method: "GET" },
    getTokens,
    updateTokens,
    logout,
  );
}