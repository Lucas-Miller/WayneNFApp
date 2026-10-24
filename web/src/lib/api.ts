// lib/api.ts

import { CONFIG } from './config';
import type {
  CreateSpotRequest,
  Credentials,
  Spot,
  TokenResponse,
  User,
} from './types';

const TOKEN_KEY = 'token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable (private mode); session stays in memory only
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

/**
 * Call the Go API. Errors from http.Error come back as plain text.
 */
async function request<T>(endpoint: string, { method = 'GET', body, auth = false }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = tokenStorage.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(CONFIG.TIMEOUT),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('Request timeout', 0);
    }
    throw new ApiError('Network error', 0);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');

  if (!response.ok) {
    const text = (await response.text()).trim();
    throw new ApiError(text || 'Request failed', response.status);
  }

  if (response.status === 204) return undefined as T;
  return (isJson ? response.json() : response.text()) as Promise<T>;
}

export const authApi = {
  login: (credentials: Credentials) =>
    request<TokenResponse>('/login', { method: 'POST', body: credentials }),
  signup: (credentials: Credentials) =>
    request<TokenResponse>('/signup', { method: 'POST', body: credentials }),
  getProfile: () => request<User>('/me', { auth: true }),
};

export const spotsApi = {
  // The API encodes an empty list as null
  getSpots: async () => (await request<Spot[] | null>('/spots', { auth: true })) ?? [],
  createSpot: (spot: CreateSpotRequest) =>
    request<Spot>('/spots', { method: 'POST', body: spot, auth: true }),
  deleteSpot: (spotId: number) =>
    request<void>(`/spots/${spotId}`, { method: 'DELETE', auth: true }),
};
