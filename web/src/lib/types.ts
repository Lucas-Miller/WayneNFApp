// lib/types.ts - mirrors the Go API (wayne-nf-api/main.go)

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type User = {
  id: number;
  email: string;
  created_at: string;
};

export type Spot = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

export type CreateSpotRequest = {
  name: string;
  latitude: number;
  longitude: number;
};

export type Credentials = {
  email: string;
  password: string;
};

export type TokenResponse = {
  token: string;
};

export type RouteInfo = {
  etaMinutes: number;
  distanceMiles: number;
};
