// hooks/useNetworkStatus.ts

import { useNetInfo } from '@react-native-community/netinfo';

/**
 * Whether the device is offline. Unknown states (null) count as online so we
 * don't flash an offline badge at startup.
 */
export const useNetworkStatus = () => {
  const { isConnected, isInternetReachable } = useNetInfo();
  return { isOffline: isConnected === false || isInternetReachable === false };
};
