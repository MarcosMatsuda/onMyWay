import { renderHook, act, waitFor } from '@testing-library/react';
import { useArrivals } from '../useArrivals';
import { Arrival } from '@/types';

// Mock socket.io-client
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockDisconnect = jest.fn();
const mockSocket = {
  on: mockOn,
  emit: mockEmit,
  disconnect: mockDisconnect,
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

describe('useArrivals', () => {
  const schoolId = 'school-123';
  const initialArrivals: Arrival[] = [
    {
      parentId: 'parent-1',
      distanceMeters: 500,
      durationMinutes: 10,
      routePolyline: '',
    },
    {
      parentId: 'parent-2',
      distanceMeters: 1000,
      durationMinutes: 5,
      routePolyline: '',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render initial arrivals sorted by durationMinutes', () => {
    const { result } = renderHook(() =>
      useArrivals(schoolId, initialArrivals),
    );

    expect(result.current.arrivals).toHaveLength(2);
    expect(result.current.arrivals[0].parentId).toBe('parent-2'); // 5 min
    expect(result.current.arrivals[1].parentId).toBe('parent-1'); // 10 min
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdatedAt).toBeNull();
  });

  it('should emit joinSchool on connect event', () => {
    renderHook(() => useArrivals(schoolId, initialArrivals));

    // Find the connect callback
    const connectCallback = mockOn.mock.calls.find(
      (call) => call[0] === 'connect',
    )?.[1];

    expect(connectCallback).toBeDefined();

    // Simulate connect event
    act(() => {
      connectCallback();
    });

    expect(mockEmit).toHaveBeenCalledWith('joinSchool', { schoolId });
  });

  it('should update arrivals state on arrivals:updated event', async () => {
    const { result } = renderHook(() =>
      useArrivals(schoolId, initialArrivals),
    );

    // Find the arrivals:updated callback
    const arrivalsUpdatedCallback = mockOn.mock.calls.find(
      (call) => call[0] === 'arrivals:updated',
    )?.[1];

    expect(arrivalsUpdatedCallback).toBeDefined();

    const updatedArrivals: Arrival[] = [
      {
        parentId: 'parent-3',
        distanceMeters: 200,
        durationMinutes: 15,
        routePolyline: '',
      },
      {
        parentId: 'parent-4',
        distanceMeters: 300,
        durationMinutes: 3,
        routePolyline: '',
      },
    ];

    // Simulate arrivals:updated event
    act(() => {
      arrivalsUpdatedCallback(updatedArrivals);
    });

    await waitFor(() => {
      expect(result.current.arrivals).toHaveLength(2);
      expect(result.current.arrivals[0].parentId).toBe('parent-4'); // 3 min (sorted)
      expect(result.current.arrivals[1].parentId).toBe('parent-3'); // 15 min
      expect(result.current.lastUpdatedAt).toBeInstanceOf(Date);
    });
  });

  it('should toggle isConnected on connect/disconnect events', () => {
    const { result } = renderHook(() =>
      useArrivals(schoolId, initialArrivals),
    );

    expect(result.current.isConnected).toBe(false);

    // Find callbacks
    const connectCallback = mockOn.mock.calls.find(
      (call) => call[0] === 'connect',
    )?.[1];
    const disconnectCallback = mockOn.mock.calls.find(
      (call) => call[0] === 'disconnect',
    )?.[1];

    expect(connectCallback).toBeDefined();
    expect(disconnectCallback).toBeDefined();

    // Simulate connect
    act(() => {
      connectCallback();
    });

    expect(result.current.isConnected).toBe(true);

    // Simulate disconnect
    act(() => {
      disconnectCallback();
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('should disconnect socket on unmount', () => {
    const { unmount } = renderHook(() =>
      useArrivals(schoolId, initialArrivals),
    );

    expect(mockDisconnect).not.toHaveBeenCalled();

    unmount();

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});
