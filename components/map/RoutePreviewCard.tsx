// components/map/RoutePreviewCard.tsx

import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteInfo } from '@/types';

type RoutePreviewCardProps = {
  routeInfo: RouteInfo | null;
  onNavigate: () => void;
  onCancel: () => void;
};

export const RoutePreviewCard: React.FC<RoutePreviewCardProps> = ({
  routeInfo,
  onNavigate,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  if (!routeInfo) return null;

  return (
    <View style={[styles.previewCard, { bottom: 24 + insets.bottom }]}>
      <View style={styles.previewHeader}>
        <MaterialIcons name="directions-car" size={24} color="#2E7D32" />
        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle}>Route to Camping Spot</Text>
          <Text style={styles.previewStats}>
            {routeInfo.etaMinutes} min • {routeInfo.distanceMiles} mi
          </Text>
        </View>
      </View>
      <View style={styles.previewActions}>
        <Pressable
          style={({ pressed }) => [
            styles.previewBtn,
            styles.cancelBtn,
            pressed && styles.buttonPressed,
          ]}
          onPress={onCancel}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.previewBtn,
            styles.goBtn,
            pressed && styles.buttonPressed,
          ]}
          onPress={onNavigate}
        >
          <MaterialIcons name="navigation" size={18} color="#fff" />
          <Text style={styles.goBtnText}>Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  previewCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  previewStats: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  cancelBtn: {
    backgroundColor: '#f5f5f5',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  goBtn: {
    backgroundColor: '#2E7D32',
  },
  goBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
