// Dashboard Statistics API
export interface StatsResponse {
    success: boolean;
    message: string;
    data: {
      totalCustomers: number;
      newCustomers: number;
      totalMessages: number;
      unreadMessages: number;
      activeCustomers: number;
      totalCreditLimit: number;
    };
  }
  
  export async function getStats(
    getTokens: () => { accessToken: string; refreshToken: string } | null,
    updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
    logout: () => void,
  ): Promise<StatsResponse> {
    const { apiRequest } = await import("@/lib/api");
    
    return apiRequest<StatsResponse>(
      "http://localhost:8080/api/v1/stats",
      { method: "GET" },
      getTokens,
      updateTokens,
      logout,
    );
  }