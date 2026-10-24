// hooks/map/useSpotManagement.ts

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isNetworkError, spotsApi } from '@/services/api';
import { spotsStore } from '@/services/offline';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Coordinate } from '@/types';

// 'queued' means saved on the device and waiting for a connection to upload
export type SaveSpotResult = 'saved' | 'queued' | 'failed';

/**
 * Hook to manage camping spot creation
 */
export const useSpotManagement = () => {
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [saving, setSaving] = useState(false);

  /**
   * Save a new camping spot, falling back to the offline outbox with no connection
   */
  const saveSpot = useCallback(
    async (coords: Coordinate, name: string): Promise<SaveSpotResult> => {
      if (!name.trim()) return 'failed';
      const spot = { name: name.trim(), latitude: coords.latitude, longitude: coords.longitude };

      setSaving(true);
      try {
        // Known offline: queue right away instead of waiting for a timeout
        if (isOffline && user) {
          await spotsStore.addPending(user.id, spot);
          return 'queued';
        }
        try {
          await spotsApi.createSpot(spot);
          return 'saved';
        } catch (error) {
          if (isNetworkError(error) && user) {
            await spotsStore.addPending(user.id, spot);
            return 'queued';
          }
          throw error;
        }
      } catch (error) {
        console.error('Failed to save spot:', error);
        return 'failed';
      } finally {
        setSaving(false);
      }
    },
    [isOffline, user]
  );

  return {
    saving,
    saveSpot,
  };
};
