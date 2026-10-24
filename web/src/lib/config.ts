// lib/config.ts

export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  GOOGLE_MAP_ID: import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID',
  TIMEOUT: 10000,
};

export const DEFAULT_CENTER = { lat: 39.4, lng: -82.3 };
