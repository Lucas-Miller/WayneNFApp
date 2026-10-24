// components/map/PointInfoCard.tsx - details for a tapped/searched point, with copy and save

import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  distanceMiles,
  ForestArea,
  formatCoordinates,
  formatDistance,
  formatDMS,
} from '@/shared/pointInfo';
import { Coordinate } from '@/types';

type PointInfoCardProps = {
  point: Coordinate;
  forestArea: ForestArea | null;
  myLocation: Coordinate | null;
  signedIn: boolean;
  saving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
  onSignIn: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

export const PointInfoCard: React.FC<PointInfoCardProps> = ({
  point,
  forestArea,
  myLocation,
  signedIn,
  saving,
  onSave,
  onClose,
  onSignIn,
  onLayout,
}) => {
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const coordinates = formatCoordinates(point);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(coordinates);
    setCopied(true);
  };

  const handleSave = () => {
    if (name.trim()) onSave(name.trim());
  };

  const details = [
    forestArea?.county && `${forestArea.county} County`,
    forestArea?.huntingStatus && `Hunting ${forestArea.huntingStatus.toLowerCase()}`,
    myLocation && formatDistance(distanceMiles(myLocation, point)),
  ].filter(Boolean);

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.header}>
        <View style={[styles.chip, forestArea ? styles.chipInside : styles.chipOutside]}>
          <Text style={[styles.chipText, forestArea ? styles.chipTextInside : styles.chipTextOutside]}>
            {forestArea ? '✓ Inside Wayne NF' : '✗ Outside Wayne NF'}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
          <MaterialIcons name="close" size={24} color="#666" />
        </Pressable>
      </View>

      {details.length > 0 && <Text style={styles.details}>{details.join(' · ')}</Text>}

      <View style={styles.coordBox}>
        <View style={styles.coordText}>
          <Text style={styles.coordDecimal} selectable>
            {coordinates}
          </Text>
          <Text style={styles.coordDms}>{formatDMS(point)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
          onPress={handleCopy}
          accessibilityLabel="Copy coordinates"
        >
          <MaterialIcons name={copied ? 'check' : 'content-copy'} size={18} color="#2E7D32" />
          <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
        </Pressable>
      </View>

      {signedIn ? (
        <View style={styles.saveRow}>
          <TextInput
            style={styles.input}
            placeholder="Name this spot"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleSave}
            returnKeyType="done"
            maxLength={50}
          />
          {saving ? (
            <ActivityIndicator color="#2E7D32" style={styles.saveBtn} />
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                (!name.trim() || pressed) && styles.pressed,
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <MaterialIcons name="place" size={18} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Text style={styles.signInHint}>
          <Text style={styles.signInLink} onPress={onSignIn}>
            Sign in
          </Text>{' '}
          to save this spot.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipInside: {
    backgroundColor: '#e8f5e9',
  },
  chipOutside: {
    backgroundColor: '#fdecea',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextInside: {
    color: '#1B5E20',
  },
  chipTextOutside: {
    color: '#C62828',
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginTop: -4,
  },
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
  },
  coordText: {
    flex: 1,
  },
  coordDecimal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  coordDms: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 84,
    justifyContent: 'center',
  },
  copyText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
  saveRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderColor: '#e0e0e0',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 16,
    minWidth: 88,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  signInHint: {
    fontSize: 14,
    color: '#666',
  },
  signInLink: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
});
