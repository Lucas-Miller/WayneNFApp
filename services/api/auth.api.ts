// services/api/auth.api.ts

import { apiClient } from './client';
import { LoginRequest, LoginResponse, SignupRequest, SignupResponse, User } from '@/types';

/**
 * Authentication API service
 */
export const authApi = {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/login', credentials);
  },

  /**
   * Sign up a new user
   */
  async signup(credentials: SignupRequest): Promise<SignupResponse> {
    return apiClient.post<SignupResponse>('/signup', credentials);
  },

  /**
   * Get current authenticated user profile
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/me', true);
  },
};
