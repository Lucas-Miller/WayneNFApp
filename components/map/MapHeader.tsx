// components/map/MapHeader.tsx

import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MapHeaderProps = {
  offline?: boolean;
  onAccountPress: () => void;
};

export const MapHeader: React.FC<MapHeaderProps> = ({ offline = false, onAccountPress }) => {
  return (
    <View style={styles.headerSafeArea}>
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandingContainer}>
            <MaterialIcons name="terrain" size={24} color="#2E7D32" />
            <Text style={styles.brandText}>Wayne NF</Text>
            {offline && (
              <View style={styles.offlineBadge}>
                <MaterialIcons name="cloud-off" size={14} color="#8a5a00" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.accountButton}
            onPress={onAccountPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-circle" size={32} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 56,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff4e0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a5a00',
  },
  accountButton: {
    padding: 8,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
