// context/AuthContext.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError, authApi } from '@/services/api';
import { AuthContextType, User } from '@/types';

const AuthContext = createContext<AuthContextType>(null!);

const TOKEN_KEY = 'token';
// Profile copy so the account screen and offline spot storage work without a connection
const USER_KEY = 'user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  /**
   * Logout user and clear stored token
   */
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Refresh the user profile. Only a 401 ends the session; being offline or a
   * server hiccup keeps the cached profile.
   */
  const fetchProfile = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        Alert.alert('Session expired', 'Please sign in again.');
        await logout();
      }
    }
  }, [logout]);

  // Load token & user on mount
  useEffect(() => {
    const loadAuth = async () => {
      const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
      if (!storedToken) return;

      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore a corrupt copy; fetchProfile will replace it
        }
      }
      await fetchProfile();
    };

    loadAuth();
  }, [fetchProfile]);

  /**
   * Login user with email and password
   */
  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    await AsyncStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
