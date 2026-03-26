export const TOKEN_KEY = 'onmyway_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const name = TOKEN_KEY + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Max-Age=${maxAge}; path=/; Secure; SameSite=Strict`;
}

export function clearToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  document.cookie = `${TOKEN_KEY}=; Max-Age=0; path=/`;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
