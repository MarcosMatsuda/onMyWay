import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { CurrentLocation } from '@domain/entities';
import { isWithinPrivacyRadius, LatLng } from './geo.utils';

const LOCATION_TASK_NAME = 'ONMYWAY_LOCATION_TASK';

export interface GeolocationService {
  getCurrentPosition(): Promise<CurrentLocation>;
  startWatching(
    schoolLocation: LatLng,
    onLocation: (location: CurrentLocation, withinPrivacyRadius: boolean) => void,
    onError: (error: Error) => void,
  ): () => void;
  stopWatching(): void;
}

export class ExpoGeolocationService implements GeolocationService {
  private schoolLocation: LatLng | null = null;
  private onLocationCallback:
    | ((location: CurrentLocation, withinPrivacyRadius: boolean) => void)
    | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private watching = false;

  async getCurrentPosition(): Promise<CurrentLocation> {
    try {
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        lat: result.coords.latitude,
        lng: result.coords.longitude,
        accuracy: result.coords.accuracy || 0,
        timestamp: result.timestamp,
      };
    } catch (error) {
      throw new Error(`Failed to get current position: ${error}`);
    }
  }

  startWatching(
    schoolLocation: LatLng,
    onLocation: (location: CurrentLocation, withinPrivacyRadius: boolean) => void,
    onError: (error: Error) => void,
  ): () => void {
    this.schoolLocation = schoolLocation;
    this.onLocationCallback = onLocation;
    this.onErrorCallback = onError;
    this.watching = true;

    // Start watching
    this.setupBackgroundTask();
    this.startForegroundUpdates();

    // Return unsubscribe function
    return () => this.stopWatching();
  }

  stopWatching(): void {
    this.watching = false;
    Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {
      // Task might not be running, ignore
    });
  }

  private startForegroundUpdates(): void {
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 0, // update every 10s regardless of distance
      },
      (location: Location.LocationObject) => {
        if (!this.watching || !this.schoolLocation) return;

        const currentLocation: CurrentLocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          timestamp: location.timestamp,
        };

        const withinRadius = isWithinPrivacyRadius(
          { lat: currentLocation.lat, lng: currentLocation.lng },
          this.schoolLocation,
        );

        this.onLocationCallback?.(currentLocation, withinRadius);
      },
    ).catch((error: unknown) => {
      this.onErrorCallback?.(new Error(`Watch position failed: ${error}`));
    });
  }

  private setupBackgroundTask(): void {
    // Define background task
    TaskManager.defineTask(
      LOCATION_TASK_NAME,
      async ({ data, error }: { data: unknown; error: unknown }) => {
        if (error) {
          this.onErrorCallback?.(new Error(`Background location error: ${error}`));
          return;
        }

        if (data) {
          const { locations } = data as { locations: Location.LocationObject[] };
          if (locations && locations.length > 0) {
            const location = locations[locations.length - 1];
            if (!this.schoolLocation) return;

            const currentLocation: CurrentLocation = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              accuracy: location.coords.accuracy || 0,
              timestamp: location.timestamp,
            };

            const withinRadius = isWithinPrivacyRadius(
              { lat: currentLocation.lat, lng: currentLocation.lng },
              this.schoolLocation,
            );

            this.onLocationCallback?.(currentLocation, withinRadius);
          }
        }
      },
    );

    // Request permissions
    Location.requestForegroundPermissionsAsync()
      .then(() => Location.requestBackgroundPermissionsAsync())
      .then(() => {
        // Start background updates
        Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 0,
          deferredUpdatesInterval: 0,
        }).catch((error: unknown) => {
          this.onErrorCallback?.(new Error(`Failed to start background tracking: ${error}`));
        });
      })
      .catch((error: unknown) => {
        this.onErrorCallback?.(new Error(`Permission denied: ${error}`));
      });
  }
}

export const geolocationService = new ExpoGeolocationService();
