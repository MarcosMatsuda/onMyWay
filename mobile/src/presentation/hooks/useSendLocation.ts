import { useState, useCallback } from 'react';
import { CurrentLocation } from '@domain/entities';
import { SendLocationUseCase } from '@domain/usecases';
import { locationRepository } from '@data/repositories';

export interface UseSendLocation {
  isSending: boolean;
  lastSentAt: number | null;
  error: string | null;
  sendLocation(schoolId: string, location: CurrentLocation): Promise<void>;
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

  return {
    isSending,
    lastSentAt,
    error,
    sendLocation,
  };
};
