declare module 'expo-location' {
  export interface LocationObject {
    coords: { latitude: number; longitude: number; accuracy: number | null };
    timestamp: number;
  }

  export interface LocationAccuracy {
    Balanced: number;
    BestForNavigation: number;
    Best: number;
    Lowest: number;
  }

  export const Accuracy: LocationAccuracy;

  export function getCurrentPositionAsync(options: { accuracy: number }): Promise<LocationObject>;

  export function watchPositionAsync(
    options: {
      accuracy: number;
      timeInterval: number;
      distanceInterval: number;
    },
    callback: (location: LocationObject) => void,
  ): Promise<() => void>;

  export function requestForegroundPermissionsAsync(): Promise<{
    status: string;
  }>;

  export function requestBackgroundPermissionsAsync(): Promise<{
    status: string;
  }>;

  export function startLocationUpdatesAsync(
    taskName: string,
    options: {
      accuracy: number;
      timeInterval: number;
      distanceInterval: number;
      deferredUpdatesInterval: number;
    },
  ): Promise<void>;

  export function stopLocationUpdatesAsync(taskName: string): Promise<void>;
}

declare module 'expo-task-manager' {
  export function defineTask(
    taskName: string,
    handler: (data: { data: unknown; error: unknown }) => Promise<void>,
  ): void;
}
