export type { HttpClient, RequestConfig } from './http-client';
export { HttpError, AuthenticationError } from './http-client';
export type { AuthTokenService } from './auth-token.service';

// Mock httpClient for now - will be replaced by actual implementation in feat/issue-95
export const httpClient = {
  get: async () => null,
  post: async () => null,
  put: async () => null,
  delete: async () => null,
} as any;
