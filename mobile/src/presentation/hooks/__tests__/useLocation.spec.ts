import { renderHook, act } from '@testing-library/react-native';
import { useLocation } from '../useLocation';

// Mock geolocation service
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@infrastructure/geolocation', () => ({
  geolocationService: {
    startWatching: jest.fn(
      (
        schoolLocation: { lat: number; lng: number },
        onLocation: (location: { lat: number; lng: number; accuracy: number; timestamp: number }, withinPrivacyRadius: boolean) => void,
        onError: (error: Error) => void,
      ) => {
      // Simulate location update after a small delay
      setTimeout(() => {
        const mockLocation = {
          lat: -23.5505,
          lng: -46.6333,
          accuracy: 10,
          timestamp: Date.now(),
        };
        onLocation(mockLocation, true); // within privacy radius
      }, 10);

      // Return unsubscribe function
      return jest.fn();
    }),
    stopWatching: jest.fn(),
  },
}));

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLocation());

    expect(result.current.currentLocation).toBeNull();
    expect(result.current.isTracking).toBe(false);
    expect(result.current.withinPrivacyRadius).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should start tracking and receive location updates', async () => {
    const { result } = renderHook(() => useLocation());
    const schoolLocation = { lat: -23.5505, lng: -46.6333 };

    await act(async () => {
      result.current.startTracking(schoolLocation);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.isTracking).toBe(true);
    expect(result.current.currentLocation).not.toBeNull();
    expect(result.current.currentLocation?.lat).toBe(-23.5505);
  });

  it('should reflect withinPrivacyRadius from geolocation service', async () => {
    const { result } = renderHook(() => useLocation());
    const schoolLocation = { lat: -23.5505, lng: -46.6333 };

    await act(async () => {
      result.current.startTracking(schoolLocation);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.withinPrivacyRadius).toBe(true);
  });

  it('should stop tracking and cleanup', async () => {
    const { result } = renderHook(() => useLocation());
    const schoolLocation = { lat: -23.5505, lng: -46.6333 };

    await act(async () => {
      result.current.startTracking(schoolLocation);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.isTracking).toBe(true);

    await act(async () => {
      result.current.stopTracking();
    });

    expect(result.current.isTracking).toBe(false);
    expect(result.current.currentLocation).toBeNull();
    expect(result.current.withinPrivacyRadius).toBe(false);
  });

  it('should handle geolocation errors', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { geolocationService } = require('@infrastructure/geolocation');

    geolocationService.startWatching.mockImplementationOnce(
      (
        schoolLocation: { lat: number; lng: number },
        onLocation: (location: { lat: number; lng: number; accuracy: number; timestamp: number }, withinPrivacyRadius: boolean) => void,
        onError: (error: Error) => void,
      ) => {
        setTimeout(() => {
          onError(new Error('Location permission denied'));
        }, 10);
        return jest.fn();
      },
    );

    const { result } = renderHook(() => useLocation());
    const schoolLocation = { lat: -23.5505, lng: -46.6333 };

    await act(async () => {
      result.current.startTracking(schoolLocation);
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.error).toBe('Location permission denied');
  });

  it('should cleanup on unmount', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { geolocationService } = require('@infrastructure/geolocation');
    const { result, unmount } = renderHook(() => useLocation());
    const schoolLocation = { lat: -23.5505, lng: -46.6333 };

    await act(async () => {
      result.current.startTracking(schoolLocation);
    });

    unmount();

    expect(geolocationService.stopWatching).toHaveBeenCalled();
  });
});
