// types/api.types.ts

export type ApiError = {
  message: string;
  statusCode?: number;
};

export type ApiRequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
};

export type ApiResponse<T = any> = {
  data: T;
  error?: ApiError;
};
