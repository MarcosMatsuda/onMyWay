import { TOKEN_KEY, getToken, setToken, clearToken, isAuthenticated } from '../auth';

// Mock document.cookie
let mockCookies: { [key: string]: string } = {};

Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
  configurable: true,
});

const createCookieGetter = () => {
  return Object.entries(mockCookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
};

const createCookieSetter = (cookieString: string) => {
  const [nameValue] = cookieString.split(';');
  const [name, value] = nameValue.split('=');
  const trimmedName = name.trim();
  if (value === undefined || value === '' || cookieString.includes('Max-Age=0')) {
    delete mockCookies[trimmedName];
  } else {
    mockCookies[trimmedName] = decodeURIComponent(value.trim());
  }
};

Object.defineProperty(document, 'cookie', {
  get: createCookieGetter,
  set: createCookieSetter,
  configurable: true,
});

describe('auth', () => {
  beforeEach(() => {
    mockCookies = {};
  });

  describe('getToken', () => {
    it('returns null when no token in cookie', () => {
      expect(getToken()).toBeNull();
    });

    it('returns the token when present in cookie', () => {
      const testToken = 'test-jwt-token-123';
      setToken(testToken);
      expect(getToken()).toBe(testToken);
    });

    it('handles encoded tokens', () => {
      const testToken = 'token+with/special=chars';
      setToken(testToken);
      expect(getToken()).toBe(testToken);
    });
  });

  describe('setToken', () => {
    it('stores token in cookie', () => {
      const testToken = 'new-test-token';
      setToken(testToken);
      expect(getToken()).toBe(testToken);
    });

    it('handles special characters in token', () => {
      const testToken = 'token+with/special=chars&more';
      setToken(testToken);
      expect(getToken()).toBe(testToken);
    });
  });

  describe('clearToken', () => {
    it('removes the token from cookie', () => {
      const testToken = 'token-to-remove';
      setToken(testToken);
      expect(getToken()).toBe(testToken);

      clearToken();
      expect(getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when token is present', () => {
      setToken('test-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when no token present', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('returns false after clearing token', () => {
      setToken('test-token');
      clearToken();
      expect(isAuthenticated()).toBe(false);
    });
  });
});
