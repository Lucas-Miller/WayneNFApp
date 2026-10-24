// components/map/MessageBanner.tsx

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Platform, StatusBar } from 'react-native';

type MessageBannerProps = {
  message: string;
  onDismiss: () => void;
};

export const MessageBanner: React.FC<MessageBannerProps> = ({ message, onDismiss }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }
  }, [message, opacity, onDismiss]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.messageBanner, { opacity }]}>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : (StatusBar.currentHeight ? StatusBar.currentHeight + 80 : 110),
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  message: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
});
