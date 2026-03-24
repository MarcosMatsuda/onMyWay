import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { Parent } from '@domain/entities';

export interface UseAuth {
  isAuthenticated: boolean;
  parent: Parent | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuth = (): UseAuth => {
  const { isAuthenticated, parent, isLoading, error, login, register, logout, initialize } =
    useAuthStore();

  // Initialize auth on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isAuthenticated,
    parent,
    isLoading,
    error,
    login,
    register,
    logout,
    initialize,
  };
};
