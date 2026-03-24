import React, { useState, useEffect } from 'react';
import { View, Text, Button, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { School } from '@domain/entities';
import { useAuth, useLocation, useSendLocation } from '@presentation/hooks';
import { MainStackParamList } from '@presentation/navigation/types';

// Note: AsyncStorage is typically provided by @react-native-async-storage/async-storage
// For type checking purposes, we define a local interface matching the expected API
interface AsyncStorageAPI {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// Mock implementation - in production, replace with actual AsyncStorage import
const AsyncStorage: AsyncStorageAPI = {
  async getItem(key: string): Promise<string | null> {
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {},
  async removeItem(key: string): Promise<void> {},
};

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { parent } = useAuth();
  const {
    currentLocation,
    isTracking,
    withinPrivacyRadius,
    startTracking,
    stopTracking,
    error: locationError,
  } = useLocation();
  const { isSending, lastSentAt, sendLocation } = useSendLocation();

  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(true);

  // Load selected school from AsyncStorage on mount
  useEffect(() => {
    const loadSelectedSchool = async () => {
      try {
        const schoolJson = await AsyncStorage.getItem('selected_school');
        if (schoolJson) {
          const school = JSON.parse(schoolJson) as School;
          setSelectedSchool(school);
        }
      } catch (error) {
        console.error('Failed to load selected school:', error);
      } finally {
        setIsLoadingSchool(false);
      }
    };

    loadSelectedSchool();
  }, []);

  // Auto-send location when within privacy radius
  useEffect(() => {
    if (isTracking && withinPrivacyRadius && currentLocation && selectedSchool && !isSending) {
      sendLocation(selectedSchool.id, currentLocation);
    }
  }, [currentLocation, withinPrivacyRadius, isTracking, selectedSchool, isSending, sendLocation]);

  const handleToggleTracking = (value: boolean) => {
    if (value && selectedSchool) {
      startTracking(selectedSchool.location);
    } else {
      stopTracking();
    }
  };

  const formatLastSent = (timestamp: number | null): string => {
    if (!timestamp) return 'Not sent yet';

    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `Last sent: ${hours}:${minutes}:${seconds}`;
  };

  if (isLoadingSchool) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // No school selected
  if (!selectedSchool) {
    return (
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Home</Text>

          <Text style={{ marginBottom: 16, fontSize: 16 }}>
            No school selected. Please select a school to start sharing your location.
          </Text>

          <Button title="Select School" onPress={() => navigation.navigate('SchoolSelect')} />
        </View>
      </ScrollView>
    );
  }

  // School selected
  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Home</Text>

        {/* Parent info */}
        {parent && (
          <View
            style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4 }}
          >
            <Text style={{ fontWeight: '600', marginBottom: 4 }}>Welcome, {parent.name}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>{parent.email}</Text>
          </View>
        )}

        {/* School info */}
        <View
          style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4 }}
        >
          <Text style={{ fontWeight: '600', marginBottom: 4 }}>School: {selectedSchool.name}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            Location: {selectedSchool.location.lat.toFixed(4)},{' '}
            {selectedSchool.location.lng.toFixed(4)}
          </Text>
        </View>

        {/* Sharing toggle */}
        <View
          style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 4 }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: '600', fontSize: 16 }}>Share Location</Text>
            <Switch value={isTracking} onValueChange={handleToggleTracking} />
          </View>

          <Text style={{ fontSize: 14, marginBottom: 8 }}>
            Status: {isTracking ? 'Sharing' : 'Not sharing'}
          </Text>

          <Text
            style={{
              fontSize: 14,
              marginBottom: 8,
              color: withinPrivacyRadius ? '#2ecc71' : '#e74c3c',
            }}
          >
            Privacy:{' '}
            {withinPrivacyRadius ? 'Near school (sharing active)' : 'Too far — location not shared'}
          </Text>

          <Text style={{ fontSize: 14, marginBottom: 8 }}>{formatLastSent(lastSentAt)}</Text>

          {currentLocation && (
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              Current: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </Text>
          )}

          {isSending && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginRight: 8 }}>Sending...</Text>
              <ActivityIndicator size="small" />
            </View>
          )}
        </View>

        {/* Errors */}
        {locationError && (
          <View
            style={{ marginBottom: 16, padding: 12, backgroundColor: '#ffe0e0', borderRadius: 4 }}
          >
            <Text style={{ color: '#ff6b6b' }}>Error: {locationError}</Text>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={{ marginBottom: 16 }}>
          <Button title="Change School" onPress={() => navigation.navigate('SchoolSelect')} />
        </View>

        <View>
          <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
        </View>
      </View>
    </ScrollView>
  );
};
