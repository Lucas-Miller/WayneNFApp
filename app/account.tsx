// app/account.tsx

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { isNetworkError, spotsApi } from '@/services/api';
import { PendingSpot, spotsStore } from '@/services/offline';
import { Spot } from '@/types';

type ListItem = (Spot & { pending?: false }) | (PendingSpot & { pending: true });

export default function AccountScreen() {
  const router = useRouter();
  const { user, token, login, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [pending, setPending] = useState<PendingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showingOfflineCopy, setShowingOfflineCopy] = useState(false);

  // login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  const loadLocal = useCallback(async () => {
    if (userId === undefined) return;
    const [cached, queued] = await Promise.all([
      spotsStore.getCached(userId),
      spotsStore.getPending(userId),
    ]);
    setSpots(cached);
    setPending(queued);
  }, [userId]);

  // Show the on-device copy first, then refresh from the server if we can
  useEffect(() => {
    if (!token || userId === undefined) return;

    const loadSpots = async () => {
      await loadLocal();
      setLoading(true);
      try {
        const data = await spotsApi.getSpots();
        setSpots(data);
        setShowingOfflineCopy(false);
        await spotsStore.setCached(userId, data);
      } catch (err) {
        setShowingOfflineCopy(true);
        if (!isNetworkError(err)) console.error('Failed to fetch spots:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSpots();
    // Pending spots uploaded in the background
    return spotsStore.subscribe(loadLocal);
  }, [token, userId, loadLocal]);

  // if not logged in, show login form
  if (!token) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginTitle}>Sign In</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={emailInput}
          onChangeText={setEmailInput}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={passwordInput}
          onChangeText={setPasswordInput}
          secureTextEntry
        />
        <Button
          title="Login"
          onPress={async () => {
            setError(null);
            try {
              await login(emailInput, passwordInput);
            } catch (err) {
              setError(
                isNetworkError(err)
                  ? "You're offline. Connect to the internet to sign in."
                  : 'Invalid credentials'
              );
            }
          }}
        />
      </View>
    );
  }

  const items: ListItem[] = [
    ...pending.map((p) => ({ ...p, pending: true as const })),
    ...spots,
  ];

  // logged in view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="account-circle" size={48} />
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity onPress={logout}>
          <MaterialIcons name="logout" size={28} />
        </TouchableOpacity>
      </View>

      {showingOfflineCopy && (
        <View style={styles.notice}>
          <MaterialIcons name="cloud-off" size={18} color="#8a5a00" />
          <Text style={styles.noticeText}>Offline — showing spots saved on this device</Text>
        </View>
      )}

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          keyExtractor={(item) => (item.pending ? `pending-${item.localId}` : item.id.toString())}
          ListEmptyComponent={<Text style={styles.empty}>No saved spots yet</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push(`/?destLat=${item.latitude}&destLng=${item.longitude}`)
              }
            >
              <View style={styles.spot}>
                <View style={styles.spotText}>
                  <Text style={styles.spotName}>{item.name}</Text>
                  <Text style={styles.spotCoords}>
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                </View>
                {item.pending && (
                  <View style={styles.pendingBadge}>
                    <MaterialIcons name="cloud-upload" size={14} color="#8a5a00" />
                    <Text style={styles.pendingText}>Waiting to sync</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: 'black',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    color: 'black',
    backgroundColor: '#fff',
  },
  error: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },

  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  email: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff4e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  noticeText: {
    color: '#8a5a00',
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
    color: 'gray',
  },
  spot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  spotText: {
    flex: 1,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  spotCoords: {
    color: '#666',
    marginTop: 2,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff4e0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingText: {
    color: '#8a5a00',
    fontSize: 12,
    fontWeight: '600',
  },
});
