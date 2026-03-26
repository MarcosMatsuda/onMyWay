import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { useAuthStore } from '../../store/auth.store';

// Mock SecureAuthTokenService - must come first as other modules depend on it
const mockTokenService = {
  getAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  setRefreshToken: jest.fn(),
  clear: jest.fn(),
};

jest.mock('@infrastructure/http', () => ({
  SecureAuthTokenService: jest.fn(() => mockTokenService),
  axiosClient: {
    setTokenService: jest.fn(),
  },
}));

// Mock authService
jest.mock('@infrastructure/http/auth.service', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

// Mock repositories
jest.mock('@data/repositories', () => ({
  parentRepository: {
    getProfile: jest.fn(),
  },
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations to default
    mockTokenService.getAccessToken.mockResolvedValue(null);
    mockTokenService.setAccessToken.mockResolvedValue(undefined);
    mockTokenService.getRefreshToken.mockResolvedValue(null);
    mockTokenService.setRefreshToken.mockResolvedValue(undefined);
    mockTokenService.clear.mockResolvedValue(undefined);

    useAuthStore.setState({
      isAuthenticated: false,
      parent: null,
      isLoading: false,
      error: null,
    });
  });

  it('should initialize with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.parent).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should login successfully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authService } = require('@infrastructure/http/auth.service');
    const mockParent = {
      id: '1',
      name: 'John',
      email: 'john@example.com',
      phone: '123',
      schoolId: 'school1',
    };

    authService.login.mockResolvedValue({
      accessToken: 'access123',
      refreshToken: 'refresh123',
      parent: mockParent,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('john@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.parent).toEqual(mockParent);
    expect(result.current.error).toBeNull();
  });

  it('should handle login error', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authService } = require('@infrastructure/http/auth.service');

    authService.login.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('john@example.com', 'wrongpassword');
      } catch {
        // Error expected
      }
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should register successfully', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authService } = require('@infrastructure/http/auth.service');
    const mockParent = {
      id: '2',
      name: 'Jane',
      email: 'jane@example.com',
      phone: '456',
      schoolId: 'school2',
    };

    authService.register.mockResolvedValue({
      accessToken: 'access456',
      refreshToken: 'refresh456',
      parent: mockParent,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('Jane', 'jane@example.com', '456', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.parent).toEqual(mockParent);
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => useAuth());

    // Set authenticated state
    await act(async () => {
      useAuthStore.setState({
        isAuthenticated: true,
        parent: {
          id: '1',
          name: 'John',
          email: 'john@example.com',
          phone: '123',
          schoolId: 'school1',
        },
      });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.parent).toBeNull();
  });

  it('should initialize with valid stored token', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { parentRepository } = require('@data/repositories');
    const mockParent = {
      id: '1',
      name: 'John',
      email: 'john@example.com',
      phone: '123',
      schoolId: 'school1',
    };

    mockTokenService.getAccessToken.mockResolvedValue('stored_token');
    parentRepository.getProfile.mockResolvedValue(mockParent);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.initialize();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.parent).toEqual(mockParent);
  });

  it('should initialize with no stored token', async () => {
    mockTokenService.getAccessToken.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth());

    // Wait for initialize effect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.parent).toBeNull();
  });
});
