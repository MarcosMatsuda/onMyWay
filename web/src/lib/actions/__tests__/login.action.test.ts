import axios from 'axios';
import { loginAction } from '../login.action';
import { cookies } from 'next/headers';

jest.mock('axios');
jest.mock('next/headers');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCookies = cookies as jest.Mock;

describe('loginAction', () => {
  let mockCookieStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup cookie mock
    mockCookieStore = {
      set: jest.fn(),
    };
    mockedCookies.mockResolvedValue(mockCookieStore);
  });

  it('returns success with schoolId on successful login', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        accessToken: 'jwt-token-123',
        parent: { schoolId: 'school-456' },
      },
    });

    const result = await loginAction('test@example.com', 'password123');

    expect(result).toEqual({ success: true, schoolId: 'school-456' });
  });

  it('sets onmyway_token cookie on successful login', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        accessToken: 'jwt-token-123',
        parent: { schoolId: 'school-456' },
      },
    });

    await loginAction('test@example.com', 'password123');

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'onmyway_token',
      'jwt-token-123',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
        sameSite: 'strict',
      })
    );
  });

  it('posts to correct API endpoint', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        accessToken: 'jwt-token-123',
        parent: { schoolId: 'school-456' },
      },
    });

    await loginAction('test@example.com', 'password123');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      { email: 'test@example.com', password: 'password123' },
      expect.any(Object)
    );
  });

  it('returns error message on 401 response', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { status: 401 },
      isAxiosError: true,
    });
    (mockedAxios as any).isAxiosError = jest.fn(() => true);

    const result = await loginAction('test@example.com', 'wrongpassword');

    expect(result).toEqual({ success: false, error: 'Email ou senha inválidos' });
  });

  it('returns error message on 400 response with single message', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { status: 400, data: { message: 'Invalid request' } },
      isAxiosError: true,
    });
    (mockedAxios as any).isAxiosError = jest.fn(() => true);

    const result = await loginAction('test@example.com', 'password');

    expect(result).toEqual({ success: false, error: 'Invalid request' });
  });

  it('returns error message on 400 response with array of messages', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 400,
        data: { message: ['Error 1', 'Error 2'] },
      },
      isAxiosError: true,
    });
    (mockedAxios as any).isAxiosError = jest.fn(() => true);

    const result = await loginAction('test@example.com', 'password');

    expect(result).toEqual({ success: false, error: 'Error 1, Error 2' });
  });

  it('returns generic error message on 400 response without message', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { status: 400, data: {} },
      isAxiosError: true,
    });
    (mockedAxios as any).isAxiosError = jest.fn(() => true);

    const result = await loginAction('test@example.com', 'password');

    expect(result).toEqual({ success: false, error: 'Email ou senha inválidos' });
  });

  it('returns generic error message on network error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network error'));
    (mockedAxios as any).isAxiosError = jest.fn(() => false);

    const result = await loginAction('test@example.com', 'password');

    expect(result).toEqual({
      success: false,
      error: 'Erro ao fazer login. Tente novamente.',
    });
  });

  it('returns generic error message on server error (5xx)', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { status: 500 },
      isAxiosError: true,
    });
    (mockedAxios as any).isAxiosError = jest.fn(() => true);

    const result = await loginAction('test@example.com', 'password');

    expect(result).toEqual({
      success: false,
      error: 'Erro ao fazer login. Tente novamente.',
    });
  });

  it('passes correct headers and timeout to axios', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        accessToken: 'jwt-token-123',
        parent: { schoolId: 'school-456' },
      },
    });

    await loginAction('test@example.com', 'password123');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  });
});
