// shared/pointInfo.ts
//
// Used by both the mobile app (imported as '@/shared/pointInfo') and the web app
// (imported as '@shared/pointInfo'). Keep this file free of dependencies and
// platform APIs so it bundles in Metro and Vite alike.

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type ForestArea = {
  county: string | null;
  huntingStatus: string | null;
};

// Ohio county FIPS codes for the counties the Wayne NF boundary data covers
const COUNTY_BY_FIPS: Record<string, string> = {
  '009': 'Athens',
  '053': 'Gallia',
  '073': 'Hocking',
  '079': 'Jackson',
  '087': 'Lawrence',
  '111': 'Monroe',
  '115': 'Morgan',
  '121': 'Noble',
  '127': 'Perry',
  '145': 'Scioto',
  '163': 'Vinton',
  '167': 'Washington',
};

/**
 * Pull the useful fields out of an Ohio DNR boundary feature's attributes
 */
export function forestAreaFromAttributes(attributes: Record<string, unknown>): ForestArea {
  const fips = typeof attributes.CNTY_FIPS === 'string' ? attributes.CNTY_FIPS : null;
  const status = typeof attributes.HUNTING_STATUS === 'string' ? attributes.HUNTING_STATUS : null;
  return {
    county: fips ? COUNTY_BY_FIPS[fips] ?? null : null,
    huntingStatus: status ? status.charAt(0) + status.slice(1).toLowerCase() : null,
  };
}

/**
 * "39.401234, -82.300456" - six decimals is ~10 cm, and pastes into Google/Apple Maps
 */
export function formatCoordinates({ latitude, longitude }: LatLng): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * 39°24'04.4"N 82°18'01.6"W
 */
export function formatDMS({ latitude, longitude }: LatLng): string {
  const part = (value: number, positive: string, negative: string) => {
    const abs = Math.abs(value);
    let degrees = Math.floor(abs);
    let minutes = Math.floor((abs - degrees) * 60);
    let seconds = Number(((abs - degrees - minutes / 60) * 3600).toFixed(1));
    if (seconds >= 60) {
      seconds = 0;
      minutes += 1;
    }
    if (minutes >= 60) {
      minutes = 0;
      degrees += 1;
    }
    const ss = seconds.toFixed(1).padStart(4, '0');
    return `${degrees}°${String(minutes).padStart(2, '0')}'${ss}"${value >= 0 ? positive : negative}`;
  };
  return `${part(latitude, 'N', 'S')} ${part(longitude, 'E', 'W')}`;
}

/**
 * Straight-line (great-circle) distance in miles
 */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * "450 ft away" / "2.3 mi away" / "41 mi away"
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) return `${Math.round(miles * 5280)} ft away`;
  if (miles < 10) return `${miles.toFixed(1)} mi away`;
  return `${Math.round(miles)} mi away`;
}
