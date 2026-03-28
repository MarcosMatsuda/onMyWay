import { useState, useCallback } from 'react';
import { CurrentLocation } from '@domain/entities';
import { SendLocationUseCase, StopSharingUseCase } from '@domain/usecases';
import { locationRepository } from '@data/repositories';

export interface UseSendLocation {
  isSending: boolean;
  lastSentAt: number | null;
  error: string | null;
  sendLocation(schoolId: string, location: CurrentLocation): Promise<void>;
  stopSharing(): Promise<void>;
}

export const useSendLocation = (): UseSendLocation => {
  const [isSending, setIsSending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendLocation = useCallback(
    async (schoolId: string, location: CurrentLocation) => {
      if (isSending) return; // Prevent duplicate sends

      setIsSending(true);
      setError(null);

      try {
        // Use the SendLocationUseCase
        const useCase = new SendLocationUseCase(locationRepository);
        await useCase.execute(schoolId, location);

        setLastSentAt(Date.now());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send location';
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [isSending],
  );

  const stopSharing = useCallback(async () => {
    try {
      const useCase = new StopSharingUseCase(locationRepository);
      await useCase.execute();
    } catch (err) {
      // Silent failure - log but don't throw
      console.warn('Failed to stop sharing:', err);
    }
  }, []);

  return {
    isSending,
    lastSentAt,
    error,
    sendLocation,
    stopSharing,
  };
};
