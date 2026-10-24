// config/api.config.ts

export const API_CONFIG = {
  BASE_URL: 'https://wayneapi.lucasmiller.dev',
  // Set in .env.local locally and as an EAS environment variable for builds
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  TIMEOUT: 10000,
};
