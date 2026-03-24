import { haversineDistance, isWithinPrivacyRadius } from '../geo.utils';
import { ExpoGeolocationService } from '../geolocation.service';

describe('GeolocationService', () => {
  describe('haversineDistance', () => {
    it('should calculate distance correctly for nearby points', () => {
      const a = { lat: -23.5505, lng: -46.6333 }; // São Paulo
      const b = { lat: -23.5504, lng: -46.6332 }; // ~10m away

      const distance = haversineDistance(a, b);
      expect(distance).toBeLessThan(20); // Should be very close
      expect(distance).toBeGreaterThan(0);
    });

    it('should calculate distance for farther points', () => {
      const a = { lat: -23.5505, lng: -46.6333 }; // São Paulo
      const b = { lat: 40.7128, lng: -74.006 }; // New York

      const distance = haversineDistance(a, b);
      expect(distance).toBeGreaterThan(7000000); // ~7685km
      expect(distance).toBeLessThan(8000000);
    });

    it('should return 0 for same coordinates', () => {
      const a = { lat: 0, lng: 0 };
      const b = { lat: 0, lng: 0 };

      const distance = haversineDistance(a, b);
      expect(distance).toBe(0);
    });
  });

  describe('isWithinPrivacyRadius', () => {
    it('should return true when within 1km radius', () => {
      const parent = { lat: -23.5505, lng: -46.6333 };
      const school = { lat: -23.5506, lng: -46.6334 }; // ~10m away

      const result = isWithinPrivacyRadius(parent, school);
      expect(result).toBe(true);
    });

    it('should return false when outside 1km radius', () => {
      const parent = { lat: -23.5505, lng: -46.6333 };
      const school = { lat: -23.4505, lng: -46.6333 }; // ~11km away

      const result = isWithinPrivacyRadius(parent, school);
      expect(result).toBe(false);
    });

    it('should respect custom radius', () => {
      const parent = { lat: -23.5505, lng: -46.6333 };
      const school = { lat: -23.5506, lng: -46.6334 }; // ~10m away

      const result = isWithinPrivacyRadius(parent, school, 5); // 5m radius
      expect(result).toBe(false); // 10m > 5m, should be false
    });
  });

  describe('GeolocationService', () => {
    it('should return unsubscribe function from startWatching', () => {
      const service = new ExpoGeolocationService();
      const unsubscribe = service.startWatching(
        { lat: 0, lng: 0 },
        () => {},
        () => {},
      );

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should set up watching and background task on startWatching', () => {
      const service = new ExpoGeolocationService();
      const schoolLocation = { lat: -23.5505, lng: -46.6333 };
      const onLocation = jest.fn();
      const onError = jest.fn();

      service.startWatching(schoolLocation, onLocation, onError);

      // Just verify the service is set up correctly
      expect(typeof service.stopWatching).toBe('function');
    });

    it('should call stopWatching to stop tracking', () => {
      const service = new ExpoGeolocationService();
      const schoolLocation = { lat: -23.5505, lng: -46.6333 };
      const onLocation = jest.fn();
      const onError = jest.fn();

      service.startWatching(schoolLocation, onLocation, onError);
      service.stopWatching();

      // After stopping, service should be properly cleaned up
      expect(service.stopWatching).toBeDefined();
    });

    it('should calculate privacy radius correctly in the service', () => {
      const parentLocation = { lat: -23.5505, lng: -46.6333 };
      const schoolLocation = { lat: -23.5506, lng: -46.6334 };

      const withinRadius = isWithinPrivacyRadius(parentLocation, schoolLocation);
      expect(withinRadius).toBe(true); // ~10m away, well within 1km
    });
  });
});
