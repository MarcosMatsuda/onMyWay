import React, { useEffect, useState } from 'react';
import { View, Text, Button, Switch, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { School } from '@domain/entities';
import { useAuth, useLocation, useSendLocation } from '../../hooks';
import { MainStackParamList } from '../../navigation/types';

type HomeScreenProps = NativeStackScreenProps<MainStackParamList, 'Home'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  schoolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  schoolLocation: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  emptyText: {
    fontSize: 16,
    color: '#92400e',
    marginBottom: 12,
  },
  toggleSection: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeGreen: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeOrange: {
    backgroundColor: '#fed7aa',
  },
  statusBadgeGray: {
    backgroundColor: '#e2e8f0',
  },
  statusTextGreen: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextOrange: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextGray: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  lastSentText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  currentLocationText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  mapButtonContainer: {
    marginBottom: 16,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  buttonContainer: {
    flex: 1,
  },
  mapButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export function HomeScreen({ navigation }: HomeScreenProps): JSX.Element {
  const { parent } = useAuth();
  const {
    currentLocation,
    isTracking,
    withinPrivacyRadius,
    startTracking,
    stopTracking,
    error: locationError,
  } = useLocation();
  const { lastSentAt, sendLocation } = useSendLocation();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Load selectedSchool from AsyncStorage on mount
  useEffect(() => {
    const loadSchool = async (): Promise<void> => {
      try {
        const schoolJson = await AsyncStorage.getItem('@onmyway:selected_school');
        if (schoolJson) {
          const school = JSON.parse(schoolJson) as School;
          setSelectedSchool(school);
        }
      } catch (error) {
        console.warn('Failed to load selected school:', error);
      }
    };

    void loadSchool();
  }, []);

  const handleToggleSharing = (value: boolean): void => {
    if (value && selectedSchool) {
      startTracking(selectedSchool.location);
    } else {
      stopTracking();
    }
  };

  useEffect(() => {
    if (isTracking && withinPrivacyRadius && currentLocation && selectedSchool) {
      void sendLocation(selectedSchool.id, currentLocation);
    }
  }, [isTracking, withinPrivacyRadius, currentLocation, selectedSchool, sendLocation]);

  const formatLastSent = (): string => {
    if (!lastSentAt) {
      return 'Not sent yet';
    }

    const date = new Date(lastSentAt);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `Last sent: ${hours}:${minutes}:${seconds}`;
  };

  const getStatusBadge = () => {
    if (!isTracking) {
      return {
        container: styles.statusBadgeGray,
        text: styles.statusTextGray,
        label: 'Not sharing',
      };
    }

    if (!withinPrivacyRadius) {
      return {
        container: styles.statusBadgeOrange,
        text: styles.statusTextOrange,
        label: 'Tracking — too far from school',
      };
    }

    return {
      container: styles.statusBadgeGreen,
      text: styles.statusTextGreen,
      label: 'Sharing location 🟢',
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome, {parent?.name || 'Parent'}!</Text>
        </View>

        {/* School Selection or Card */}
        {!selectedSchool ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No school selected</Text>
            <Text style={{ fontSize: 14, color: '#92400e', marginBottom: 12 }}>
              Please select a school to start sharing your location.
            </Text>
            <Button title="Select School" onPress={() => navigation.navigate('SchoolSelect')} />
          </View>
        ) : (
          <View style={styles.schoolCard}>
            <Text style={styles.schoolName}>{selectedSchool.name}</Text>
            <Text style={styles.schoolLocation}>
              Location:{' '}
              {selectedSchool.location?.lat != null
                ? Number(selectedSchool.location.lat).toFixed(4)
                : '—'}
              ,
              {selectedSchool.location?.lng != null
                ? Number(selectedSchool.location.lng).toFixed(4)
                : '—'}
            </Text>
          </View>
        )}

        {selectedSchool && (
          <>
            {/* Sharing Toggle */}
            <View style={styles.toggleSection}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Share my location</Text>
                <Switch value={isTracking} onValueChange={handleToggleSharing} />
              </View>
            </View>

            {/* View Map Button */}
            {selectedSchool && (
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() =>
                  navigation.navigate('Map', {
                    schoolId: selectedSchool.id,
                    currentLat: currentLocation?.lat,
                    currentLng: currentLocation?.lng,
                  })
                }
              >
                <Text style={styles.mapButtonText}>View Map</Text>
              </TouchableOpacity>
            )}

            {/* Status Badge */}
            <View style={[styles.statusBadge, statusBadge.container]}>
              <Text style={statusBadge.text}>{statusBadge.label}</Text>
            </View>

            {/* Last Sent */}
            <Text style={styles.lastSentText}>{formatLastSent()}</Text>

            {/* Current Location */}
            {currentLocation && (
              <Text style={styles.currentLocationText}>
                Current: {currentLocation.lat.toFixed(4)},{currentLocation.lng.toFixed(4)}
              </Text>
            )}

            {/* Error Message */}
            {locationError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Error: {locationError}</Text>
              </View>
            )}

            {/* View Map Button */}
            <View style={styles.mapButtonContainer}>
              <Button
                title="View Map"
                onPress={() =>
                  navigation.navigate('Map', {
                    schoolId: selectedSchool.id,
                    currentLat: currentLocation?.lat,
                    currentLng: currentLocation?.lng,
                  })
                }
              />
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              <View style={styles.buttonContainer}>
                <Button title="Change School" onPress={() => navigation.navigate('SchoolSelect')} />
              </View>
              <View style={styles.buttonContainer}>
                <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
