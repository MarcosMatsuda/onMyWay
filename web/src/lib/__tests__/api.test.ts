import axios, { AxiosInstance } from 'axios';
import * as authModule from '../auth';

jest.mock('axios');
jest.mock('../auth');

// Helper to handle promise rejections in tests
const handleRejection = (promise: any) => {
  return promise.catch(() => {
    // Silently handle rejection to avoid unhandled rejection warnings
  });
};

describe('api', () => {
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;
  let mockedAxios: jest.Mocked<typeof axios>;
  let mockedAuth: jest.Mocked<typeof authModule>;
  let requestInterceptorSuccess: any;
  let requestInterceptorError: any;
  let responseInterceptorSuccess: any;
  let responseInterceptorError: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAuth = authModule as jest.Mocked<typeof authModule>;

    // Create mock instance with interceptors
    mockAxiosInstance = {
      interceptors: {
        request: {
          use: jest.fn((success, error) => {
            requestInterceptorSuccess = success;
            requestInterceptorError = error;
            return 0;
          }),
        },
        response: {
          use: jest.fn((success, error) => {
            responseInterceptorSuccess = success;
            responseInterceptorError = error;
            return 0;
          }),
        },
      },
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Delete cached module and re-require to get fresh import with current mocks
    delete require.cache[require.resolve('../api')];
    require('../api');
  });

  describe('axios instance creation', () => {
    it('creates axios instance with all required config', () => {
      const calls = mockedAxios.create.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const firstCall = calls[0][0];
      expect(firstCall).toMatchObject({
        baseURL: 'http://localhost:3000',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('request interceptor', () => {
    it('attaches Authorization header when token is present', () => {
      mockedAuth.getToken.mockReturnValue('test-token-123');

      const config = { headers: {} } as any;
      const result = requestInterceptorSuccess(config);

      expect(result.headers.Authorization).toBe('Bearer test-token-123');
    });

    it('does not add Authorization header when no token', () => {
      mockedAuth.getToken.mockReturnValue(null);

      const config = { headers: {} } as any;
      const result = requestInterceptorSuccess(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('preserves config properties', () => {
      mockedAuth.getToken.mockReturnValue('token');

      const config = { method: 'POST', url: '/api/test', headers: {}, data: { id: 1 } } as any;
      const result = requestInterceptorSuccess(config);

      expect(result.method).toBe('POST');
      expect(result.url).toBe('/api/test');
      expect(result.data).toEqual({ id: 1 });
    });

    it('rejects error in error handler', () => {
      const testError = new Error('Network error');
      const result = requestInterceptorError(testError);

      return handleRejection(result);
    });
  });

  describe('response interceptor', () => {
    it('returns response on success', () => {
      const response = { status: 200, data: { message: 'ok' } } as any;
      const result = responseInterceptorSuccess(response);

      expect(result).toBe(response);
    });

    it('clears token on 401 response', () => {
      mockedAuth.clearToken.mockClear();

      const error = { response: { status: 401 } } as any;
      const result = responseInterceptorError(error);

      expect(mockedAuth.clearToken).toHaveBeenCalled();
      return handleRejection(result);
    });

    it('does not clear token on non-401 response', () => {
      mockedAuth.clearToken.mockClear();

      const error = { response: { status: 500 } } as any;
      const result = responseInterceptorError(error);

      expect(mockedAuth.clearToken).not.toHaveBeenCalled();
      return handleRejection(result);
    });

    it('rejects error without response', () => {
      const error = new Error('Network error');
      const result = responseInterceptorError(error);

      return handleRejection(result);
    });
  });
});
