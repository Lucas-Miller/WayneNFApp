// services/api/client.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api.config';
import { ApiRequestConfig } from '@/types';

/**
 * Error from the API. status is the HTTP status, or 0 when the request never got
 * a response (offline, DNS failure, timeout).
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * True when a request failed because there was no connection, as opposed to the
 * server rejecting it
 */
export const isNetworkError = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 0;

/**
 * Base API client with authentication support
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Get the stored authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }

  /**
   * Make an authenticated or public API request
   */
  async request<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      requiresAuth = false,
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add auth token if required
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      const timedOut = error instanceof Error && error.name === 'AbortError';
      throw new ApiError(timedOut ? 'Request timeout' : 'Network request failed', 0);
    }
    clearTimeout(timeoutId);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorText = isJson ? await response.json() : await response.text();
      throw new ApiError(
        typeof errorText === 'string'
          ? errorText.trim() || 'Request failed'
          : errorText.message || 'Request failed',
        response.status
      );
    }

    if (response.status === 204) return undefined as T;
    return (isJson ? await response.json() : await response.text()) as T;
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requiresAuth });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, requiresAuth });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, requiresAuth });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
