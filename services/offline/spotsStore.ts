// services/offline/spotsStore.ts
//
// Saved spots on the device: a copy of the server list for offline viewing, and an
// outbox of spots saved while offline that get uploaded once a connection is back.
// Keyed by user so one account's pending spots never upload to another.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isNetworkError, spotsApi } from '@/services/api';
import { CreateSpotRequest, Spot } from '@/types';

export type PendingSpot = CreateSpotRequest & {
  localId: string;
  created_at: string;
};

const cachedKey = (userId: number) => `spots:${userId}`;
const pendingKey = (userId: number) => `pendingSpots:${userId}`;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

async function readList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

let syncInFlight: Promise<number> | null = null;

export const spotsStore = {
  getCached: (userId: number) => readList<Spot>(cachedKey(userId)),

  async setCached(userId: number, spots: Spot[]) {
    await AsyncStorage.setItem(cachedKey(userId), JSON.stringify(spots));
  },

  getPending: (userId: number) => readList<PendingSpot>(pendingKey(userId)),

  async addPending(userId: number, spot: CreateSpotRequest): Promise<PendingSpot> {
    const pending: PendingSpot = {
      ...spot,
      localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
    };
    const list = await readList<PendingSpot>(pendingKey(userId));
    await AsyncStorage.setItem(pendingKey(userId), JSON.stringify([...list, pending]));
    notify();
    return pending;
  },

  /**
   * Upload pending spots in order. Stops at the first failure and leaves the rest
   * queued for next time. Resolves with how many were uploaded.
   */
  sync(userId: number): Promise<number> {
    syncInFlight ??= (async () => {
      let synced = 0;
      try {
        for (const spot of await readList<PendingSpot>(pendingKey(userId))) {
          try {
            const saved = await spotsApi.createSpot({
              name: spot.name,
              latitude: spot.latitude,
              longitude: spot.longitude,
            });
            // Re-read so spots queued during the upload aren't lost
            const remaining = (await readList<PendingSpot>(pendingKey(userId))).filter(
              (p) => p.localId !== spot.localId
            );
            await AsyncStorage.setItem(pendingKey(userId), JSON.stringify(remaining));
            const cached = await readList<Spot>(cachedKey(userId));
            await AsyncStorage.setItem(cachedKey(userId), JSON.stringify([saved, ...cached]));
            synced++;
          } catch (error) {
            if (!isNetworkError(error)) console.warn('Pending spot upload failed:', error);
            break;
          }
        }
      } finally {
        syncInFlight = null;
        if (synced > 0) notify();
      }
      return synced;
    })();
    return syncInFlight;
  },

  /**
   * Called when cached or pending spots change (e.g. after a background sync)
   */
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
