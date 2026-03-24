import type { HttpClient } from './http-client';

export type { HttpClient, RequestConfig } from './http-client';
export { HttpError, AuthenticationError } from './http-client';
export type { AuthTokenService } from './auth-token.service';

// Mock httpClient for now - will be replaced by actual implementation in feat/issue-95
export const httpClient = {
  get: async <T>(): Promise<T> => null as unknown as T,
  post: async <T>(): Promise<T> => null as unknown as T,
  put: async <T>(): Promise<T> => null as unknown as T,
  delete: async <T>(): Promise<T> => null as unknown as T,
} as HttpClient;
