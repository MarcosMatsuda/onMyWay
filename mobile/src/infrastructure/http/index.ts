export type { HttpClient, RequestConfig } from './http-client';
export { HttpError, AuthenticationError } from './http-client';
export type { AuthTokenService } from './auth-token.service';
export { SecureAuthTokenService } from './secure-auth-token.service';
export { API_BASE_URL } from './config';

import { AxiosHttpClient } from './axios-http-client';

const axiosClient = new AxiosHttpClient();
export const httpClient = axiosClient;
export { axiosClient };
