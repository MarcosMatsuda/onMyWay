import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../useLogin';
import * as loginModule from '@/lib/actions/login.action';

jest.mock('next/navigation');
jest.mock('@/lib/actions/login.action');

describe('useLogin', () => {
  let mockRouter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('returns initial state with isLoading=false and error=null', () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.login).toBe('function');
  });

  it('sets isLoading=true while loginAction is in flight', async () => {
    const mockLoginAction = loginModule.loginAction as jest.Mock;
    mockLoginAction.mockResolvedValue({ success: true, schoolId: 'school-123' });

    const { result } = renderHook(() => useLogin());

    let loginPromise: Promise<void>;
    act(() => {
      loginPromise = result.current.login('test@example.com', 'password');
    });

    // Should be loading immediately
    expect(result.current.isLoading).toBe(true);

    // Wait for the action to complete
    await act(async () => {
      await loginPromise!;
    });

    // After success, isLoading stays true because of router.push
    expect(result.current.isLoading).toBe(true);
  });

  it('calls router.push with correct dashboard URL on success', async () => {
    const mockLoginAction = loginModule.loginAction as jest.Mock;
    mockLoginAction.mockResolvedValue({ success: true, schoolId: 'school-456' });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/school-456/arrivals');
  });

  it('sets error message on login failure', async () => {
    const mockLoginAction = loginModule.loginAction as jest.Mock;
    const errorMessage = 'Email ou senha inválidos';
    mockLoginAction.mockResolvedValue({ success: false, error: errorMessage });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword');
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('clears previous error when login is called again', async () => {
    const mockLoginAction = loginModule.loginAction as jest.Mock;

    const { result } = renderHook(() => useLogin());

    // First login fails
    mockLoginAction.mockResolvedValue({ success: false, error: 'Error' });
    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword');
    });
    expect(result.current.error).toBe('Error');

    // Second login attempt clears error during submission
    mockLoginAction.mockResolvedValue({ success: true, schoolId: 'school-123' });
    await act(async () => {
      await result.current.login('test@example.com', 'correctpassword');
    });

    expect(result.current.error).toBeNull();
  });

  it('does not set isLoading to false on success (router.push handles navigation)', async () => {
    const mockLoginAction = loginModule.loginAction as jest.Mock;
    mockLoginAction.mockResolvedValue({ success: true, schoolId: 'school-123' });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    // isLoading remains true because router.push redirects the page
    expect(result.current.isLoading).toBe(true);
  });
});
