import { Parent } from '@domain/entities';
import { HttpClient } from './http-client';
import { httpClient } from './index';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  parent: Parent;
}

export interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>;
  register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    inviteCode: string;
  }): Promise<AuthResponse>;
  logout(refreshToken: string): Promise<void>;
}

export class HttpAuthService implements AuthService {
  constructor(private http: HttpClient) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response;
  }

  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    inviteCode: string;
  }): Promise<AuthResponse> {
    const response = await this.http.post<AuthResponse>('/auth/register', data);
    return response;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.http.post('/auth/logout', { refreshToken });
  }
}

export const authService = new HttpAuthService(httpClient);
