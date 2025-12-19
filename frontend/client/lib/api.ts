// API Middleware for automatic token refresh
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  getTokens: () => { accessToken: string; refreshToken: string } | null,
  updateTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void,
  logout: () => void,
): Promise<T> {
  const makeRequest = (token: string) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  };

  const tokens = getTokens();
  if (!tokens) {
    throw new Error("No tokens available");
  }

  let response = await makeRequest(tokens.accessToken);

  // If token is expired (401), try to refresh
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const { refreshTokenApi } = await import("@/services/auth");
      
      refreshPromise = refreshTokenApi({ refresh_token: tokens.refreshToken })
        .then((refreshResponse) => {
          if (refreshResponse.data) {
            // Keep the existing refresh token, only update access token
            const newTokens = {
              accessToken: refreshResponse.data.access_token,
              refreshToken: tokens.refreshToken, // Keep existing refresh token
              expiresIn: refreshResponse.data.expires_in,
            };
            updateTokens(newTokens);
            return refreshResponse;
          }
          throw new Error("Invalid refresh response");
        })
        .catch((error) => {
          console.error("Token refresh failed:", error);
          logout(); // Logout user if refresh fails
          throw error;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
    }

    // Wait for refresh to complete
    const refreshResponse = await refreshPromise;
    if (refreshResponse?.data) {
      // Retry the original request with new token
      response = await makeRequest(refreshResponse.data.access_token);
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}