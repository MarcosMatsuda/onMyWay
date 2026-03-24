import { SecureAuthTokenService } from './auth-token.service';
import { AxiosHttpClient } from './http-client';

const authTokenService = new SecureAuthTokenService();
export const httpClient = new AxiosHttpClient(authTokenService);

export type { HttpClient, RequestConfig } from './http-client';
export { HttpError, AuthenticationError } from './http-client';
export type { AuthTokenService } from './auth-token.service';
export { SecureAuthTokenService } from './auth-token.service';
