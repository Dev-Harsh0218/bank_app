import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, AuthContextType, AuthTokens } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    const stored = localStorage.getItem('tokens');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((userArg: User, tokensArg: AuthTokens | null = null) => {
    setUser(userArg);
    localStorage.setItem('user', JSON.stringify(userArg));

    setTokens(tokensArg);
    if (tokensArg) {
      localStorage.setItem('tokens', JSON.stringify(tokensArg));
    } else {
      localStorage.removeItem('tokens');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        login,
        logout,
        isAuthenticated: !!user && !!tokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}