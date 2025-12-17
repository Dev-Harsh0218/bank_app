// services/auth.ts
export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

export interface SignupUser {
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

export interface SignupApiResponse {
  status: string; // "success" | "error" (depending on backend)
  message: string;
  data?: {
    user: SignupUser;
  };
}

export async function signup(
  payload: SignupPayload,
): Promise<SignupApiResponse> {
  const res = await fetch("http://localhost:8080/api/v1/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as SignupApiResponse | null;

  if (!res.ok || !data) {
    throw new Error(data?.message || "Failed to create account");
  }

  return data;
}

// services/auth.ts
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginApiResponse {
  status: string;
  message: string;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      is_active: boolean;
      is_approved: boolean;
      last_login: string;
      created_at: string;
      updated_at: string;
    };
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export async function loginApi(
  payload: LoginPayload,
): Promise<LoginApiResponse> {
  const res = await fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as LoginApiResponse | null;

  if (!data) {
    throw new Error("Failed to login");
  }

  if (!res.ok) {
    throw new Error(data.message || "Failed to login");
  }

  return data;
}
