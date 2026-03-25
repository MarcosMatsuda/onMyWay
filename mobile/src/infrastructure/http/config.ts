import Constants from 'expo-constants';

function getApiBaseUrl(): string {
  // In development, use the same host as the Metro bundler (your Mac's IP)
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    const host = debuggerHost?.split(':')[0];
    if (host) {
      return `http://${host}:3000`;
    }
  }
  // Fallback / production
  return 'http://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();
