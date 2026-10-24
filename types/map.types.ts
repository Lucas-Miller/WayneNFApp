// types/map.types.ts

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type PolygonData = {
  outer: Coordinate[];
  holes?: Coordinate[][];
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type RouteInfo = {
  etaMinutes: number;
  distanceMiles: number;
};


