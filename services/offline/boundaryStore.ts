// services/offline/boundaryStore.ts
//
// Keeps the Wayne NF boundary on the device so the map and in/out checks work
// with no connection. The file is ~1.5 MB, too big for AsyncStorage on Android,
// so it lives in the document directory.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import { API_CONFIG } from '@/config/api.config';
import { fetchLatestBoundary, ForestBoundary, parseBoundary } from '@/shared/forestBoundary';

const ETAG_KEY = 'forestBoundaryEtag';
const cacheFile = () => new File(Paths.document, 'forest-boundary.json');

/**
 * The snapshot shipped inside the app (shared/wayne-forest-boundary.esrijson, an
 * Esri JSON file bundled as an asset). Regenerate with npm run update-forest-snapshot.
 */
async function loadBundledSnapshot(): Promise<ForestBoundary> {
  const [asset] = await Asset.loadAsync(require('@/shared/wayne-forest-boundary.esrijson'));
  return parseBoundary(JSON.parse(await new File(asset.localUri!).text()))!;
}

export const boundaryStore = {
  /**
   * Last downloaded copy, or the snapshot bundled with the app. Never needs network.
   */
  async loadLocal(): Promise<ForestBoundary> {
    try {
      const file = cacheFile();
      if (file.exists) {
        const cached = parseBoundary(JSON.parse(await file.text()));
        if (cached) return cached;
      }
    } catch (error) {
      console.warn('Ignoring unreadable boundary cache:', error);
    }
    return loadBundledSnapshot();
  },

  /**
   * Download a newer copy if there is one and save it. Resolves null when the local
   * copy is already current; throws when offline or every source fails.
   */
  async refresh(): Promise<ForestBoundary | null> {
    const file = cacheFile();
    const etag = file.exists ? await AsyncStorage.getItem(ETAG_KEY) : null;
    const result = await fetchLatestBoundary(API_CONFIG.BASE_URL, { etag });
    if (result.status === 'not-modified') return null;

    if (!file.exists) file.create();
    file.write(JSON.stringify(result.boundary));
    if (result.etag) {
      await AsyncStorage.setItem(ETAG_KEY, result.etag);
    } else {
      await AsyncStorage.removeItem(ETAG_KEY);
    }
    return result.boundary;
  },
};
