import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { HttpClient, RequestConfig, HttpError, AuthenticationError } from './http-client';
import type { AuthTokenService } from './auth-token.service';
import { API_BASE_URL } from './config';

export class AxiosHttpClient implements HttpClient {
  private client: AxiosInstance;
  private tokenService: AuthTokenService | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.client as any).interceptors.request.use(async (config: any) => {
      if (this.tokenService) {
        const token = await this.tokenService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });
  }

  setTokenService(tokenService: AuthTokenService): void {
    this.tokenService = tokenService;
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, {
        headers: config?.headers,
        params: config?.params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T>(url: string, body: unknown, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, body, {
        headers: config?.headers,
        params: config?.params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T>(url: string, body: unknown, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, body, {
        headers: config?.headers,
        params: config?.params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, {
        headers: config?.headers,
        params: config?.params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): HttpError {
    const axiosErr = error as {
      isAxiosError?: boolean;
      response?: { status: number; data?: { message?: string } };
      code?: string;
      message?: string;
    };

    if (axiosErr.isAxiosError && axiosErr.response) {
      const status = axiosErr.response.status;
      const message = axiosErr.response.data?.message ?? axiosErr.message ?? 'Request failed';

      if (status === 401) {
        return new AuthenticationError(message);
      }
      return new HttpError(status, message);
    }

    if (axiosErr.isAxiosError && axiosErr.code === 'ERR_NETWORK') {
      return new HttpError(0, 'Network error — check if the backend is running');
    }

    return new HttpError(500, error instanceof Error ? error.message : 'Unknown error');
  }
}
