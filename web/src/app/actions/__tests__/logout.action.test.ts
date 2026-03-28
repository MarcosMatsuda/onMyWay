import { TOKEN_KEY } from '@/lib/auth';

const mockDelete = jest.fn();
const mockRedirect = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logoutAction } from '../logout.action';

const mockCookies = cookies as unknown as jest.Mock;
const mockRedirectFn = redirect as unknown as jest.Mock;

describe('logoutAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.mockResolvedValue({ delete: mockDelete });
  });

  it('deletes the auth token cookie', async () => {
    await logoutAction();

    expect(mockDelete).toHaveBeenCalledWith(TOKEN_KEY);
  });

  it('redirects to /login after deleting cookie', async () => {
    await logoutAction();

    expect(mockRedirectFn).toHaveBeenCalledWith('/login');
  });

  it('deletes cookie before redirecting', async () => {
    const callOrder: string[] = [];
    mockDelete.mockImplementation(() => callOrder.push('delete'));
    mockRedirectFn.mockImplementation(() => callOrder.push('redirect'));

    await logoutAction();

    expect(callOrder).toEqual(['delete', 'redirect']);
  });
});
