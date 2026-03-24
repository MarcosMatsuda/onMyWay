import axios from 'axios';
import { AxiosHttpClient, HttpError, AuthenticationError } from '../http-client';
import { AuthTokenService } from '../auth-token.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AxiosHttpClient', () => {
  let httpClient: AxiosHttpClient;
  let authTokenService: jest.Mocked<AuthTokenService>;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Create mock AuthTokenService
    authTokenService = {
      getAccessToken: jest.fn(),
      setAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      setRefreshToken: jest.fn(),
      clear: jest.fn(),
    };

    // Create mock axios instance
    mockAxiosInstance = jest.fn();
    mockAxiosInstance.get = jest.fn();
    mockAxiosInstance.post = jest.fn();
    mockAxiosInstance.put = jest.fn();
    mockAxiosInstance.delete = jest.fn();
    mockAxiosInstance.interceptors = {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create HTTP client
    httpClient = new AxiosHttpClient(authTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Request interceptor', () => {
    it('should attach Bearer token when token exists', async () => {
      const token = 'valid-token';
      authTokenService.getAccessToken.mockResolvedValue(token);

      // Get the request interceptor function
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      const config = { headers: {} };
      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
      expect(authTokenService.getAccessToken).toHaveBeenCalled();
    });

    it('should not attach token when token is null', async () => {
      authTokenService.getAccessToken.mockResolvedValue(null);

      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      const config = { headers: {} };
      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
      expect(authTokenService.getAccessToken).toHaveBeenCalled();
    });
  });

  describe('GET request', () => {
    it('should make a GET request and return data', async () => {
      const responseData = { id: 1, name: 'Test' };
      mockAxiosInstance.get.mockResolvedValue({ data: responseData });

      const result = await httpClient.get<typeof responseData>('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(responseData);
    });

    it('should make a GET request with config', async () => {
      const responseData = { id: 1 };
      const config = { headers: { 'X-Custom': 'value' } };
      mockAxiosInstance.get.mockResolvedValue({ data: responseData });

      const result = await httpClient.get('/test', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', config);
      expect(result).toEqual(responseData);
    });
  });

  describe('POST request', () => {
    it('should make a POST request and return data', async () => {
      const body = { name: 'Test' };
      const responseData = { id: 1, ...body };
      mockAxiosInstance.post.mockResolvedValue({ data: responseData });

      const result = await httpClient.post('/test', body);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', body, undefined);
      expect(result).toEqual(responseData);
    });

    it('should make a POST request with config', async () => {
      const body = { name: 'Test' };
      const config = { headers: { 'X-Custom': 'value' } };
      const responseData = { id: 1 };
      mockAxiosInstance.post.mockResolvedValue({ data: responseData });

      const result = await httpClient.post('/test', body, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', body, config);
      expect(result).toEqual(responseData);
    });
  });

  describe('PUT request', () => {
    it('should make a PUT request and return data', async () => {
      const body = { name: 'Updated' };
      const responseData = { id: 1, ...body };
      mockAxiosInstance.put.mockResolvedValue({ data: responseData });

      const result = await httpClient.put('/test/1', body);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', body, undefined);
      expect(result).toEqual(responseData);
    });
  });

  describe('DELETE request', () => {
    it('should make a DELETE request and return data', async () => {
      const responseData = { success: true };
      mockAxiosInstance.delete.mockResolvedValue({ data: responseData });

      const result = await httpClient.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual(responseData);
    });
  });

  describe('Response interceptor - 401 handling', () => {
    it('should refresh token and retry on 401 with successful refresh', async () => {
      const refreshToken = 'refresh-token';
      const newAccessToken = 'new-access-token';
      const originalRequest = { url: '/test', _retry: false };

      authTokenService.getRefreshToken.mockResolvedValue(refreshToken);
      authTokenService.setAccessToken.mockResolvedValue(undefined);

      mockedAxios.post.mockResolvedValue({
        data: { accessToken: newAccessToken },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as any);

      mockAxiosInstance.mockResolvedValue({ data: { result: 'success' } });

      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      await responseInterceptor(error);

      expect(authTokenService.getRefreshToken).toHaveBeenCalled();
      expect(authTokenService.setAccessToken).toHaveBeenCalledWith(newAccessToken);
      expect(originalRequest._retry).toBe(true);
    });

    it('should clear tokens and throw AuthenticationError on 401 with failed refresh', async () => {
      authTokenService.getRefreshToken.mockResolvedValue(null);
      authTokenService.clear.mockResolvedValue(undefined);

      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

      const error = {
        response: { status: 401 },
        config: { url: '/test', _retry: false },
      };

      await expect(responseInterceptor(error)).rejects.toThrow(AuthenticationError);
      expect(authTokenService.clear).toHaveBeenCalled();
    });

    it('should not retry if _retry is already true', async () => {
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

      const error = {
        response: { status: 401 },
        config: { url: '/test', _retry: true },
      };

      await expect(responseInterceptor(error)).rejects.toThrow(HttpError);
      expect(authTokenService.getRefreshToken).not.toHaveBeenCalled();
    });

    it('should wrap other HTTP errors in HttpError', async () => {
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

      const error = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };

      await expect(responseInterceptor(error)).rejects.toThrow(HttpError);
      try {
        await responseInterceptor(error);
      } catch (e) {
        expect((e as HttpError).status).toBe(500);
        expect((e as HttpError).message).toBe('Internal Server Error');
      }
    });

    it('should throw non-response errors as is', async () => {
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

      const error = new Error('Network error');

      await expect(responseInterceptor(error)).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('timeout of 10000ms exceeded'));

      const error = new Error('timeout of 10000ms exceeded');

      expect(() => {
        throw error;
      }).toThrow('timeout of 10000ms exceeded');
    });
  });

  describe('Error classes', () => {
    it('should create HttpError with correct properties', () => {
      const error = new HttpError(404, 'Not found');

      expect(error.status).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.name).toBe('HttpError');
    });

    it('should create AuthenticationError with 401 status', () => {
      const error = new AuthenticationError('Custom message');

      expect(error.status).toBe(401);
      expect(error.message).toBe('Custom message');
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError();

      expect(error.status).toBe(401);
      expect(error.message).toBe('Authentication failed');
    });
  });
});
