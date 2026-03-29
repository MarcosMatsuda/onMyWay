import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as jwtLib from '@/lib/jwt';

jest.mock('next/navigation');
jest.mock('next/headers');
jest.mock('@/lib/jwt');

// Import after mocks are set up
import AdminLayout from '../layout';

describe('AdminLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login when no token is present', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    try {
      await AdminLayout({ children: null });
    } catch {
      // Expected - redirect throws
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /login when role is not super_admin', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'school-admin-token' }),
    });

    const mockDecodeJWT = jwtLib.decodeJWT as jest.Mock;
    mockDecodeJWT.mockReturnValue({ role: 'school_admin' });

    try {
      await AdminLayout({ children: null });
    } catch {
      // Expected - redirect throws
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('allows access when role is super_admin', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'super-admin-token' }),
    });

    const mockDecodeJWT = jwtLib.decodeJWT as jest.Mock;
    mockDecodeJWT.mockReturnValue({ role: 'super_admin' });

    const result = await AdminLayout({ children: <div>Test Content</div> });

    expect(result).toBeDefined();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects to /login when token payload is null', async () => {
    const mockCookies = cookies as jest.Mock;
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'invalid-token' }),
    });

    const mockDecodeJWT = jwtLib.decodeJWT as jest.Mock;
    mockDecodeJWT.mockReturnValue(null);

    try {
      await AdminLayout({ children: null });
    } catch {
      // Expected - redirect throws
    }

    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
