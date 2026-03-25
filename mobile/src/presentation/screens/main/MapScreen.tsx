import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocation, useArrivals } from '@presentation/hooks';
import { schoolRepository } from '@data/repositories';
import { decodePolyline } from '@infrastructure/geolocation';
import { School } from '@domain/entities';
import { MainStackParamList } from '@presentation/navigation/types';

type MapScreenProps = NativeStackScreenProps<MainStackParamList, 'Map'>;

export const MapScreen: React.FC<MapScreenProps> = ({ route }) => {
  const { schoolId, currentLat, currentLng } = route.params;
  const { currentLocation: liveLocation, error: locationError } = useLocation();
  const currentLocation = liveLocation ?? (currentLat && currentLng ? { lat: currentLat, lng: currentLng, accuracy: 0, timestamp: Date.now() } : null);
  const { eta, isLoading: etaLoading, error: etaError, refresh } = useArrivals();
  const [school, setSchool] = useState<School | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [polylineCoords, setPolylineCoords] = useState<{ latitude: number; longitude: number }[]>(
    [],
  );

  // Load school data on mount
  useEffect(() => {
    const loadSchool = async () => {
      try {
        const schoolData = await schoolRepository.getSchool(schoolId);
        setSchool(schoolData);
      } catch (err) {
        console.error('Failed to load school:', err);
      } finally {
        setSchoolLoading(false);
      }
    };

    loadSchool();
  }, [schoolId]);

  // Refresh ETA on mount and every 15 seconds
  useEffect(() => {
    refresh(schoolId);
    const interval = setInterval(() => refresh(schoolId), 15000);
    return () => clearInterval(interval);
  }, [schoolId, refresh]);

  // Decode polyline when ETA changes
  useEffect(() => {
    if (eta?.routePolyline) {
      const coords = decodePolyline(eta.routePolyline);
      setPolylineCoords(
        coords.map((coord) => ({
          latitude: coord.lat,
          longitude: coord.lng,
        })),
      );
    }
  }, [eta?.routePolyline]);

  if (schoolLoading || !school || !currentLocation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          {!currentLocation && <Text style={styles.waitingText}>Waiting for GPS...</Text>}
          {(schoolLoading || etaLoading) && <ActivityIndicator size="large" color="#2563eb" />}
        </View>
      </SafeAreaView>
    );
  }

  const mapRegion = {
    latitude: (currentLocation.lat + school.location.lat) / 2,
    longitude: (currentLocation.lng + school.location.lng) / 2,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MapView style={styles.map} region={mapRegion}>
        {/* Parent marker (blue) */}
        <Marker
          coordinate={{
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
          }}
          title="Your Location"
          pinColor="blue"
        />

        {/* School marker (red) */}
        <Marker
          coordinate={{
            latitude: school.location.lat,
            longitude: school.location.lng,
          }}
          title={school.name}
          pinColor="red"
        />

        {/* Route polyline */}
        {polylineCoords.length > 0 && (
          <Polyline coordinates={polylineCoords} strokeColor="#2563eb" strokeWidth={3} />
        )}
      </MapView>

      {/* ETA Card */}
      <View style={styles.etaCard}>
        {etaError && <Text style={styles.errorText}>{etaError}</Text>}
        {locationError && <Text style={styles.errorText}>{locationError}</Text>}
        {eta ? (
          <>
            <Text style={styles.etaTitle}>Arriving in {eta.durationMinutes} min</Text>
            <Text style={styles.etaDistance}>
              Distance: {(eta.distanceMeters / 1000).toFixed(1)} km
            </Text>
          </>
        ) : (
          <Text style={styles.etaUnavailable}>ETA not available</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  etaCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  etaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  etaDistance: {
    fontSize: 14,
    color: '#64748b',
  },
  etaUnavailable: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 8,
  },
});
