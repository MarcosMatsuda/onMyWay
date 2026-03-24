export const Accuracy = {
  Balanced: 3,
  BestForNavigation: 0,
  Best: 1,
  Lowest: 4,
};

export const getCurrentPositionAsync = jest.fn().mockResolvedValue({
  coords: {
    latitude: 0,
    longitude: 0,
    accuracy: 10,
  },
  timestamp: Date.now(),
});

export const watchPositionAsync = jest.fn().mockResolvedValue(() => {});

export const requestForegroundPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
});

export const requestBackgroundPermissionsAsync = jest.fn().mockResolvedValue({
  status: 'granted',
});

export const startLocationUpdatesAsync = jest.fn().mockResolvedValue(undefined);

export const stopLocationUpdatesAsync = jest.fn().mockResolvedValue(undefined);
