// Member interfaces and API
export interface PendingUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  is_approved: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface PendingUsersApiResponse {
  status: string;
  message: string;
  data: {
    count: number;
    users: PendingUser[];
  };
}

export interface UserActionResponse {
  status: string;
  message: string;
}

export async function getPendingUsers(
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) => void,
  logout: () => void,
): Promise<PendingUsersApiResponse> {
  const { apiRequest } = await import("@/lib/api");

  return apiRequest<PendingUsersApiResponse>(
    "http://localhost:8080/api/v1/users/pending-approval",
    { method: "GET" },
    getTokens,
    updateTokens,
    logout,
  );
}

export async function approveUser(
  userId: string,
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) => void,
  logout: () => void,
): Promise<UserActionResponse> {
  const { apiRequest } = await import("@/lib/api");

  return apiRequest<UserActionResponse>(
    `http://localhost:8080/api/v1/users/${userId}/approve`,
    { method: "PUT" },
    getTokens,
    updateTokens,
    logout,
  );
}

export async function rejectUser(
  userId: string,
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) => void,
  logout: () => void,
): Promise<UserActionResponse> {
  const { apiRequest } = await import("@/lib/api");

  // Assuming reject endpoint follows similar pattern - adjust if different
  return apiRequest<UserActionResponse>(
    `http://localhost:8080/api/v1/users/${userId}/reject`,
    { method: "DELETE" },
    getTokens,
    updateTokens,
    logout,
  );
}

export async function getAllMembers(
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) => void,
  logout: () => void,
): Promise<PendingUsersApiResponse> {
  const { apiRequest } = await import("@/lib/api");

  return apiRequest<PendingUsersApiResponse>(
    "http://localhost:8080/api/v1/users",
    { method: "GET" },
    getTokens,
    updateTokens,
    logout,
  );
}
