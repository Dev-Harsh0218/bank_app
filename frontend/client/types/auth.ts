export type UserRole = 'admin' | 'super-admin' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  login: (user: User, tokens?: AuthTokens | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
}