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

describe('useArrivals', () => {
  const schoolId = 'school-123';
  const token = 'mock-jwt-token';
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
      useArrivals(schoolId, initialArrivals, token),
    );

    expect(result.current.arrivals).toHaveLength(2);
    expect(result.current.arrivals[0].parentId).toBe('parent-2'); // 5 min
    expect(result.current.arrivals[1].parentId).toBe('parent-1'); // 10 min
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdatedAt).toBeNull();
  });

  it('should emit school:join on connect event', () => {
    renderHook(() => useArrivals(schoolId, initialArrivals, token));

    const connectCallback = mockOn.mock.calls.find(
      (call) => call[0] === 'connect',
    )?.[1];

    expect(connectCallback).toBeDefined();

    act(() => {
      connectCallback();
    });

    expect(mockEmit).toHaveBeenCalledWith('school:join', { schoolId });
  });

  it('should update arrivals state on arrivals:updated event', async () => {
    const { result } = renderHook(() =>
      useArrivals(schoolId, initialArrivals, token),
    );

    const arrivalsUpdatedCallback = mockOn.mock.calls.find(
      (call) => call[0] === 'arrivals:updated',
    )?.[1];

    expect(arrivalsUpdatedCallback).toBeDefined();

    const gatewayPayload = {
      schoolId: 'school-123',
      schoolName: 'Escola Teste',
      totalCount: 2,
      arrivals: [
        {
          parentId: 'parent-3',
          distanceMeters: 200,
          etaMinutes: 15,
          lat: -23.55,
          lng: -46.63,
        },
        {
          parentId: 'parent-4',
          distanceMeters: 300,
          etaMinutes: 3,
          lat: -23.56,
          lng: -46.64,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    act(() => {
      arrivalsUpdatedCallback(gatewayPayload);
    });

    await waitFor(() => {
      expect(result.current.arrivals).toHaveLength(2);
      expect(result.current.arrivals[0].parentId).toBe('parent-4'); // 3 min
      expect(result.current.arrivals[0].durationMinutes).toBe(3);
      expect(result.current.arrivals[1].parentId).toBe('parent-3'); // 15 min
      expect(result.current.arrivals[1].durationMinutes).toBe(15);
      expect(result.current.lastUpdatedAt).toBeInstanceOf(Date);
    });
  });

  it('should toggle isConnected on connect/disconnect events', () => {
    const { result } = renderHook(() =>
      useArrivals(schoolId, initialArrivals, token),
    );

    expect(result.current.isConnected).toBe(false);

    const connectCallback = mockOn.mock.calls.find(
      (call) => call[0] === 'connect',
    )?.[1];
    const disconnectCallback = mockOn.mock.calls.find(
      (call) => call[0] === 'disconnect',
    )?.[1];

    act(() => {
      connectCallback();
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      disconnectCallback();
    });
    expect(result.current.isConnected).toBe(false);
  });

  it('should disconnect socket on unmount', () => {
    const { unmount } = renderHook(() =>
      useArrivals(schoolId, initialArrivals, token),
    );

    expect(mockDisconnect).not.toHaveBeenCalled();
    unmount();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('should pass token in socket connection auth', () => {
    renderHook(() => useArrivals(schoolId, initialArrivals, token));

    expect(mockIoFn).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        autoConnect: true,
        auth: { token: 'mock-jwt-token' },
      }),
    );
  });

  it('should connect to /ws namespace', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;
    process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:3001';

    renderHook(() => useArrivals(schoolId, initialArrivals, token));

    expect(mockIoFn).toHaveBeenCalledWith(
      'ws://localhost:3001/ws',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });

  it('should not duplicate /ws if already in URL', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;
    process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:3001/ws';

    renderHook(() => useArrivals(schoolId, initialArrivals, token));

    expect(mockIoFn).toHaveBeenCalledWith(
      'ws://localhost:3001/ws',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });

  it('should use secure WebSocket protocol for production URLs', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;
    process.env.NEXT_PUBLIC_WS_URL = 'ws://api.example.com';

    renderHook(() => useArrivals(schoolId, initialArrivals, token));

    expect(mockIoFn).toHaveBeenCalledWith(
      'wss://api.example.com/ws',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });

  it('should keep ws:// protocol for localhost', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;
    process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:3000';

    renderHook(() => useArrivals(schoolId, initialArrivals, token));

    expect(mockIoFn).toHaveBeenCalledWith(
      'ws://localhost:3000/ws',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });

  it('should initialise with empty arrivals when no initialArrivals provided', () => {
    const { result } = renderHook(() => useArrivals(schoolId, [], token));

    expect(result.current.arrivals).toHaveLength(0);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdatedAt).toBeNull();
  });

  it('should convert https:// to wss:// for production', () => {
    const originalEnv = process.env.NEXT_PUBLIC_WS_URL;
    process.env.NEXT_PUBLIC_WS_URL = 'https://api.example.com';

    renderHook(() => useArrivals(schoolId, initialArrivals, token));

    expect(mockIoFn).toHaveBeenCalledWith(
      'wss://api.example.com/ws',
      expect.any(Object),
    );

    process.env.NEXT_PUBLIC_WS_URL = originalEnv;
  });
});
