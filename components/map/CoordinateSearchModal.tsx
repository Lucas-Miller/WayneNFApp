// components/map/CoordinateSearchModal.tsx

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type CoordinateSearchModalProps = {
  visible: boolean;
  onSearch: (latitude: number, longitude: number) => void;
  onCancel: () => void;
};

export const CoordinateSearchModal: React.FC<CoordinateSearchModalProps> = ({
  visible,
  onSearch,
  onCancel,
}) => {
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');

  const handleSearch = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (!isNaN(lat) && !isNaN(lng)) {
      onSearch(lat, lng);
      setLatInput('');
      setLngInput('');
    }
  };

  const handleCancel = () => {
    setLatInput('');
    setLngInput('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={handleCancel}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Search by Coordinates</Text>
          <Text style={styles.modalSubtitle}>Enter latitude and longitude</Text>
          <View style={styles.coordInputContainer}>
            <View style={styles.coordInputWrapper}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <TextInput
                style={styles.coordInput}
                placeholder="39.4"
                placeholderTextColor="#999"
                value={latInput}
                onChangeText={setLatInput}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.coordInputWrapper}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <TextInput
                style={styles.coordInput}
                placeholder="-82.3"
                placeholderTextColor="#999"
                value={lngInput}
                onChangeText={setLngInput}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [
                styles.modalBtn,
                styles.modalBtnSecondary,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleCancel}
            >
              <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modalBtn,
                styles.modalBtnPrimary,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSearch}
            >
              <MaterialIcons name="search" size={18} color="#fff" />
              <Text style={styles.modalBtnPrimaryText}>Search</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  coordInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  coordInputWrapper: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordInput: {
    height: 52,
    borderColor: '#e0e0e0',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },
  modalBtnSecondary: {
    backgroundColor: '#f5f5f5',
  },
  modalBtnSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnPrimary: {
    backgroundColor: '#2E7D32',
  },
  modalBtnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
