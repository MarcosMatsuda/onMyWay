import { useState } from 'react';
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

export const useArrivals = (): UseArrivals => {
  const { parent } = useAuth();
  const [eta, setEta] = useState<ETA | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async (schoolId: string) => {
    if (!parent) return;

    setIsLoading(true);
    setError(null);

    try {
      const useCase = new GetArrivalsUseCase(schoolRepository);
      const arrivals = await useCase.execute(schoolId);

      // Find current parent's ETA
      const parentEta = arrivals.find((arr) => arr.parentId === parent.id);
      setEta(parentEta || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ETA';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    eta,
    isLoading,
    error,
    refresh,
  };
};
