// lib/auth.tsx

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ApiError, authApi, tokenStorage } from './api';
import type { Credentials, User } from './types';

type AuthContextType = {
  token: string | null;
  user: User | null;
  sessionExpired: boolean;
  login: (credentials: Credentials) => Promise<void>;
  signup: (credentials: Credentials) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [sessionExpired, setSessionExpired] = useState(false);

  const profile = useQuery({
    queryKey: ['me', token],
    queryFn: authApi.getProfile,
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
  });

  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    queryClient.removeQueries({ queryKey: ['me'] });
    queryClient.removeQueries({ queryKey: ['spots'] });
  }, [queryClient]);

  // Tokens expire after 72h; drop a stale one instead of leaving a half-signed-in state
  useEffect(() => {
    if (profile.error instanceof ApiError && profile.error.status === 401) {
      setSessionExpired(true);
      logout();
    }
  }, [profile.error, logout]);

  const startSession = useCallback((newToken: string) => {
    tokenStorage.set(newToken);
    setSessionExpired(false);
    setToken(newToken);
  }, []);

  const login = useCallback(
    async (credentials: Credentials) => startSession((await authApi.login(credentials)).token),
    [startSession]
  );

  const signup = useCallback(
    async (credentials: Credentials) => startSession((await authApi.signup(credentials)).token),
    [startSession]
  );

  return (
    <AuthContext.Provider
      value={{ token, user: profile.data ?? null, sessionExpired, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
