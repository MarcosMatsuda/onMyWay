'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/lib/actions/login.action';

export function useLogin(): {
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    const result = await loginAction(email, password);

    if (result.success) {
      router.push(`/dashboard/${result.schoolId}/arrivals`);
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
