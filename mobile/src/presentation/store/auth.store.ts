import { create } from 'zustand';
import { Parent } from '@domain/entities';
import { authService } from '@infrastructure/http/auth.service';
import { SecureAuthTokenService, type AuthTokenService, axiosClient } from '@infrastructure/http';
import { parentRepository } from '@data/repositories';

interface AuthStoreState {
  isAuthenticated: boolean;
  parent: Parent | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
    inviteCode: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setError: (error: string | null) => void;
}

let tokenService: AuthTokenService;

const getTokenService = (): AuthTokenService => {
  if (!tokenService) {
    tokenService = new SecureAuthTokenService();
    axiosClient.setTokenService(tokenService);
  }
  return tokenService;
};

export const useAuthStore = create<AuthStoreState>((set) => {
  return {
    isAuthenticated: false,
    parent: null,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authService.login(email, password);

        // Save tokens
        const tokenSvc = getTokenService();
        await tokenSvc.setAccessToken(response.accessToken);
        await tokenSvc.setRefreshToken(response.refreshToken);

        set({
          isAuthenticated: true,
          parent: response.parent,
          isLoading: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    register: async (
      name: string,
      email: string,
      phone: string,
      password: string,
      inviteCode: string,
    ) => {
      set({ isLoading: true, error: null });
      try {
        const response = await authService.register({
          name,
          email,
          phone,
          password,
          inviteCode,
        });

        // Save tokens
        const tokenSvc = getTokenService();
        await tokenSvc.setAccessToken(response.accessToken);
        await tokenSvc.setRefreshToken(response.refreshToken);

        set({
          isAuthenticated: true,
          parent: response.parent,
          isLoading: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Register failed';
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    logout: async () => {
      set({ isLoading: true, error: null });
      try {
        const tokenSvc = getTokenService();
        const refreshToken = await tokenSvc.getRefreshToken();
        if (refreshToken) {
          await authService.logout(refreshToken);
        }

        await tokenSvc.clear();

        set({
          isAuthenticated: false,
          parent: null,
          isLoading: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Logout failed';
        set({ error: message, isLoading: false });
        throw error;
      }
    },

    initialize: async () => {
      set({ isLoading: true, error: null });
      try {
        const tokenSvc = getTokenService();
        const accessToken = await tokenSvc.getAccessToken();

        if (!accessToken) {
          set({ isAuthenticated: false, parent: null, isLoading: false });
          return;
        }

        // Token exists, fetch parent profile
        const parent = await parentRepository.getProfile();

        set({
          isAuthenticated: true,
          parent,
          isLoading: false,
        });
      } catch {
        // Token invalid or expired, clear it
        try {
          const tokenSvc = getTokenService();
          await tokenSvc.clear();
        } catch {
          // ignore clear errors
        }
        set({
          isAuthenticated: false,
          parent: null,
          isLoading: false,
          error: null,
        });
      }
    },

    setError: (error: string | null) => {
      set({ error });
    },
  };
});
