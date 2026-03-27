import { renderHook, act, waitFor } from '@testing-library/react';
import { useArrivals } from '../useArrivals';
import { Arrival } from '@/types';

// Mock socket.io-client
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockDisconnect = jest.fn();

const mockIoFn = jest.fn();

jest.mock('socket.io-client', () => ({
  io: (...args: any[]) => {
    mockIoFn(...args);
    return {
      on: mockOn,
      emit: mockEmit,
      disconnect: mockDisconnect,
    };
  },
}));

// Mock auth module
jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(),
}));

import { getToken as mockGetToken } from '@/lib/auth';

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
    (mockGetToken as jest.Mock).mockReturnValue('mock-jwt-token');
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

  it('should emit joinSchool with JWT token on connect event', () => {
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

    expect(mockEmit).toHaveBeenCalledWith('joinSchool', {
      schoolId,
      token: 'mock-jwt-token',
    });
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

  it('should pass JWT token in socket connection auth', () => {
    renderHook(() => useArrivals(schoolId, initialArrivals));

    expect(mockIoFn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        autoConnect: true,
        auth: {
          token: 'mock-jwt-token',
        },
      }),
    );
  });

  it('should use secure WebSocket protocol for production URLs', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;

    // Test production URL gets converted to wss://
    process.env.NEXT_PUBLIC_WS_URL = 'ws://api.example.com';
    renderHook(() => useArrivals(schoolId, initialArrivals));

    expect(mockIoFn).toHaveBeenCalledWith(
      'wss://api.example.com',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });

  it('should keep ws:// protocol for localhost', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;

    process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:3000';
    renderHook(() => useArrivals(schoolId, initialArrivals));

    expect(mockIoFn).toHaveBeenCalledWith(
      'ws://localhost:3000',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });

  it('should keep ws:// protocol for 127.0.0.1', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;

    process.env.NEXT_PUBLIC_WS_URL = 'ws://127.0.0.1:3000';
    renderHook(() => useArrivals(schoolId, initialArrivals));

    expect(mockIoFn).toHaveBeenCalledWith(
      'ws://127.0.0.1:3000',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });

  it('should initialise with empty arrivals when no initialArrivals provided', () => {
    const { result } = renderHook(() => useArrivals(schoolId, []));

    expect(result.current.arrivals).toHaveLength(0);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdatedAt).toBeNull();
  });

  it('should convert https:// to wss:// for production', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;

    process.env.NEXT_PUBLIC_WS_URL = 'https://api.example.com';
    renderHook(() => useArrivals(schoolId, initialArrivals));

    expect(mockIoFn).toHaveBeenCalledWith(
      'wss://api.example.com',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });
});
