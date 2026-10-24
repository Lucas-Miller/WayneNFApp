// types/spot.types.ts

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

export type CreateSpotResponse = Spot;
