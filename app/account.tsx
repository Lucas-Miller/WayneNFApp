// app/account.tsx

import { useAuth } from '@/context/AuthContext';
import { useSpots } from '@/hooks/useSpots';
import { isNetworkError } from '@/services/api';
import { PendingSpot } from '@/services/offline';
import { Spot } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ListItem = (Spot & { pending?: false }) | (PendingSpot & { pending: true });

export default function AccountScreen() {
  const router = useRouter();
  const { user, token, login, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const {spots, pending, loading, showingOfflineCopy} = useSpots();


  // login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  

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
