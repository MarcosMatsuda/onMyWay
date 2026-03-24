import * as SecureStore from 'expo-secure-store';

export interface AuthTokenService {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clear(): Promise<void>;
}

export class SecureAuthTokenService implements AuthTokenService {
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.accessTokenKey);
    } catch {
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(this.accessTokenKey, token);
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.refreshTokenKey);
    } catch {
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(this.refreshTokenKey, token);
  }

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.accessTokenKey);
      await SecureStore.deleteItemAsync(this.refreshTokenKey);
    } catch {
      // silently fail
    }
  }
}
