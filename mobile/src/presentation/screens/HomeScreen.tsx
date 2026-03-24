import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  Switch,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { School } from '@domain/entities';
import { useLocation, useSendLocation } from '@presentation/hooks';
import { useAuth } from '@presentation/hooks';
import { MainStackParamList } from '@presentation/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  schoolCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  schoolLocation: {
    fontSize: 14,
    color: '#666',
  },
  noSchoolCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  noSchoolText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 12,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statusNotTracking: {
    backgroundColor: '#64748b',
  },
  statusOutside: {
    backgroundColor: '#ea580c',
  },
  statusSharing: {
    backgroundColor: '#16a34a',
  },
  lastSentText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  errorCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#991b1b',
  },
  errorText: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1a1a1a',
  },
  locationInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  buttonsContainer: {
    gap: 12,
  },
  buttonWrapper: {
    marginBottom: 12,
  },
});

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [isShareEnabled, setIsShareEnabled] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(true);

  const {
    currentLocation,
    isTracking,
    withinPrivacyRadius,
    error: locationError,
    startTracking,
    stopTracking,
  } = useLocation();
  const { isSending, lastSentAt, sendLocation } = useSendLocation();
  const { parent } = useAuth();

  useEffect(() => {
    const loadSelectedSchool = async () => {
      try {
        setIsLoadingSchool(true);
        const schoolJson = await AsyncStorage.getItem('@onmyway:selected_school');
        if (schoolJson) {
          const school = JSON.parse(schoolJson) as School;
          setSelectedSchool(school);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoadingSchool(false);
      }
    };

    loadSelectedSchool();
  }, []);

  const handleToggleShare = (enabled: boolean) => {
    setIsShareEnabled(enabled);

    if (enabled && selectedSchool) {
      startTracking(selectedSchool.location);
    } else {
      stopTracking();
    }
  };

  useEffect(() => {
    if (isTracking && withinPrivacyRadius && currentLocation && selectedSchool) {
      sendLocation(selectedSchool.id, currentLocation);
    }
  }, [currentLocation, isTracking, withinPrivacyRadius, selectedSchool, sendLocation]);

  const formatLastSent = (timestamp: number | null): string => {
    if (!timestamp) {
      return 'Not sent yet';
    }

    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `Last sent: ${hours}:${minutes}:${seconds}`;
  };

  const getStatusBadge = () => {
    if (!isTracking) {
      return {
        text: 'Not sharing',
        style: styles.statusNotTracking,
      };
    }

    if (withinPrivacyRadius) {
      return {
        text: 'Sharing location 🟢',
        style: styles.statusSharing,
      };
    }

    return {
      text: 'Tracking — too far from school',
      style: styles.statusOutside,
    };
  };

  if (isLoadingSchool) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  const statusBadge = getStatusBadge();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{`Hello, ${parent?.name || 'Parent'}`}</Text>
          {selectedSchool && (
            <Button
              title="Change"
              onPress={() => navigation.navigate('SchoolSelect')}
              disabled={isTracking}
              color="#2563eb"
            />
          )}
        </View>

        {/* School Card or No School Warning */}
        {!selectedSchool ? (
          <View style={styles.noSchoolCard}>
            <Text style={styles.noSchoolText}>No school selected</Text>
            <Button
              title="Select a School"
              onPress={() => navigation.navigate('SchoolSelect')}
              color="#92400e"
            />
          </View>
        ) : (
          <View style={styles.schoolCard}>
            <Text style={styles.schoolName}>{selectedSchool.name}</Text>
            <Text style={styles.schoolLocation}>
              {`Lat: ${selectedSchool.location.lat.toFixed(4)}, Lng: ${selectedSchool.location.lng.toFixed(4)}`}
            </Text>
          </View>
        )}

        {selectedSchool && (
          <>
            {/* Toggle */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Share my location</Text>
              <Switch value={isShareEnabled} onValueChange={handleToggleShare} />
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, statusBadge.style]}>
              <Text style={styles.statusBadgeText}>{statusBadge.text}</Text>
            </View>

            {/* Last Sent */}
            <Text style={styles.lastSentText}>{formatLastSent(lastSentAt)}</Text>

            {/* Error Card */}
            {locationError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Location error: {locationError}</Text>
              </View>
            )}

            {/* Loading Indicator */}
            {isSending && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text style={styles.loadingText}>Sending location...</Text>
              </View>
            )}

            {/* Current Location Info */}
            {currentLocation && isTracking && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Your location</Text>
                <Text style={styles.locationValue}>
                  {`Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)}`}
                </Text>
                <Text style={styles.locationLabel}>
                  Accuracy: {currentLocation.accuracy.toFixed(2)}m
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <View style={styles.buttonWrapper}>
                <Button
                  title="Profile"
                  onPress={() => navigation.navigate('Profile')}
                  color="#2563eb"
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
