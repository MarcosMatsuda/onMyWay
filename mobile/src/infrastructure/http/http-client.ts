import axios from 'axios';
import { AuthTokenService } from './auth-token.service';

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

export interface HttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, body: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, body: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class AuthenticationError extends HttpError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

// Implementação com Axios
export class AxiosHttpClient implements HttpClient {
  private axiosInstance: any;

  constructor(private authTokenService: AuthTokenService) {
    const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
    });

    // Request interceptor: attach token
    this.axiosInstance.interceptors.request.use(
      async (config: any) => {
        const token = await this.authTokenService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: any) => Promise.reject(error),
    );

    // Response interceptor: handle 401 + refresh
    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        const originalRequest = error.config as any & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Attempt refresh
            const refreshToken = await this.authTokenService.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await axios.post<{ accessToken: string }>(
              `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`,
              {
                refreshToken,
              },
            );

            const { accessToken } = response.data;
            await this.authTokenService.setAccessToken(accessToken);

            // Retry original request
            return this.axiosInstance(originalRequest);
          } catch {
            // Refresh failed
            await this.authTokenService.clear();
            throw new AuthenticationError('Token refresh failed');
          }
        }

        // Other errors
        if (error.response) {
          throw new HttpError(error.response.status, error.response.data?.message || error.message);
        }

        throw error;
      },
    );
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.axiosInstance.get(url, config);
    return response.data as T;
  }

  async post<T>(url: string, body: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.axiosInstance.post(url, body, config);
    return response.data as T;
  }

  async put<T>(url: string, body: unknown, config?: RequestConfig): Promise<T> {
    const response = await this.axiosInstance.put(url, body, config);
    return response.data as T;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete(url, config);
    return response.data as T;
  }
}
