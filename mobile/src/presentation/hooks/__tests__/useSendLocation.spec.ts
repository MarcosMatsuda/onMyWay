import { renderHook, act } from '@testing-library/react-native';
import { useSendLocation } from '../useSendLocation';

// Mock SendLocationUseCase
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@domain/usecases', () => ({
  SendLocationUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock locationRepository
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@data/repositories', () => ({
  locationRepository: {
    sendLocation: jest.fn(),
  },
}));

describe('useSendLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSendLocation());

    expect(result.current.isSending).toBe(false);
    expect(result.current.lastSentAt).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should send location successfully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SendLocationUseCase } = require('@domain/usecases');
    const { result } = renderHook(() => useSendLocation());

    const mockLocation = {
      lat: -23.5505,
      lng: -46.6333,
      accuracy: 10,
      timestamp: Date.now(),
    };

    await act(async () => {
      await result.current.sendLocation('school1', mockLocation);
    });

    expect(SendLocationUseCase).toHaveBeenCalled();
    expect(result.current.lastSentAt).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle send errors gracefully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SendLocationUseCase } = require('@domain/usecases');

    SendLocationUseCase.mockImplementationOnce(() => ({
      execute: jest.fn().mockRejectedValue(new Error('Network error')),
    }));

    const { result } = renderHook(() => useSendLocation());

    const mockLocation = {
      lat: -23.5505,
      lng: -46.6333,
      accuracy: 10,
      timestamp: Date.now(),
    };

    await act(async () => {
      try {
        await result.current.sendLocation('school1', mockLocation);
      } catch {
        // Error expected
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isSending).toBe(false);
  });

  it('should track lastSentAt timestamp', async () => {
    const { result } = renderHook(() => useSendLocation());

    const mockLocation = {
      lat: -23.5505,
      lng: -46.6333,
      accuracy: 10,
      timestamp: Date.now(),
    };

    const beforeSend = Date.now();

    await act(async () => {
      await result.current.sendLocation('school1', mockLocation);
    });

    const afterSend = Date.now();

    expect(result.current.lastSentAt).toBeGreaterThanOrEqual(beforeSend);
    expect(result.current.lastSentAt).toBeLessThanOrEqual(afterSend);
  });

  it('should prevent duplicate sends while one is in progress', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SendLocationUseCase } = require('@domain/usecases');

    let resolveFirstSend: (() => void) | null = null;
    const firstSendPromise = new Promise<void>((resolve) => {
      resolveFirstSend = resolve;
    });

    const mockExecute = jest.fn().mockImplementationOnce(
      () => firstSendPromise,
    );

    SendLocationUseCase.mockImplementationOnce(() => ({
      execute: mockExecute,
    }));

    const { result } = renderHook(() => useSendLocation());

    const mockLocation = {
      lat: -23.5505,
      lng: -46.6333,
      accuracy: 10,
      timestamp: Date.now(),
    };

    // Start first send (don't await)
    let firstSendResolved = false;
    const send1Promise = result.current
      .sendLocation('school1', mockLocation)
      .then(() => {
        firstSendResolved = true;
      });

    // Give it a moment to start
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Try to send while first is in progress - should return early
    await act(async () => {
      const send2Result = result.current.sendLocation('school1', mockLocation);
      // This should return immediately if check is working
      expect(result.current.isSending).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Only one execute should have been called
    expect(mockExecute).toHaveBeenCalledTimes(1);

    // Complete the first send
    if (resolveFirstSend) {
      resolveFirstSend();
    }

    await act(async () => {
      await send1Promise;
    });
  });
});
