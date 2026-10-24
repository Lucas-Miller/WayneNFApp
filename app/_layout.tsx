// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { usePendingSpotSync } from '@/hooks/usePendingSpotSync';
import { AuthProvider } from '../context/AuthContext'; // adjust path as needed

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <PendingSpotSync />
          <Stack>
            {/* your main map screen */}
            <Stack.Screen name="index" options={{ headerShown: false }} />

            {/* account screen */}
            <Stack.Screen name="account" options={{ title: 'Account' }} />

            {/* 404 handler */}
            <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
          </Stack>
        </AuthProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Uploads spots saved offline; must render inside AuthProvider
function PendingSpotSync() {
  usePendingSpotSync();
  return null;
}
