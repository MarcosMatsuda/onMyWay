import { useState, useEffect } from 'react';
import { CurrentLocation } from '@domain/entities';
import { geolocationService } from '@infrastructure/geolocation';

export interface UseLocation {
  currentLocation: CurrentLocation | null;
  isTracking: boolean;
  withinPrivacyRadius: boolean;
  error: string | null;
  startTracking(schoolLocation: { lat: number; lng: number }): void;
  stopTracking(): void;
}

export const useLocation = (): UseLocation => {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [withinPrivacyRadius, setWithinPrivacyRadius] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const startTracking = (schoolLocation: { lat: number; lng: number }) => {
    setIsTracking(true);
    setError(null);

    const stopFn = geolocationService.startWatching(
      schoolLocation,
      (location, withinRadius) => {
        setCurrentLocation(location);
        setWithinPrivacyRadius(withinRadius);
      },
      (err) => {
        setError(err.message);
      },
    );

    setUnsubscribe(() => stopFn);
  };

  const stopTracking = () => {
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
    geolocationService.stopWatching();
    setIsTracking(false);
    setCurrentLocation(null);
    setWithinPrivacyRadius(false);
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      geolocationService.stopWatching();
    };
  }, [unsubscribe]);

  return {
    currentLocation,
    isTracking,
    withinPrivacyRadius,
    error,
    startTracking,
    stopTracking,
  };
};
