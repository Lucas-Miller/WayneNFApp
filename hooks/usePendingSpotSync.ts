// hooks/usePendingSpotSync.ts

import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { spotsStore } from '@/services/offline';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Upload spots saved offline whenever we're signed in and online: at launch, when
 * the connection comes back, and when the app returns to the foreground.
 */
export const usePendingSpotSync = () => {
  const { token, user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const userId = user?.id;

  useEffect(() => {
    if (!token || userId === undefined || isOffline) return;

    const sync = () => {
      spotsStore.sync(userId).catch((error) => console.warn('Spot sync failed:', error));
    };
    sync();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, [token, userId, isOffline]);
};
