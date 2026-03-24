import { useCallback, useState } from 'react';
import { ETA } from '@domain/entities';
import { GetArrivalsUseCase } from '@domain/usecases';
import { schoolRepository } from '@data/repositories';
import { useAuth } from './useAuth';

export interface UseArrivals {
  eta: ETA | null;
  isLoading: boolean;
  error: string | null;
  refresh(schoolId: string): Promise<void>;
}

// Create singleton instance of use case outside hook
const getArrivalsUseCase = new GetArrivalsUseCase(schoolRepository);

export const useArrivals = (): UseArrivals => {
  const { parent } = useAuth();
  const [eta, setEta] = useState<ETA | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (schoolId: string): Promise<void> => {
      if (!parent) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const arrivals = await getArrivalsUseCase.execute(schoolId);

        // Find current parent's ETA from the queue
        const parentEta = arrivals.find((arr: ETA) => arr.parentId === parent.id);
        setEta(parentEta || null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch ETA';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [parent],
  );

  return {
    eta,
    isLoading,
    error,
    refresh,
  };
};
