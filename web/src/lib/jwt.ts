export interface JWTPayload {
  schoolId?: string;
  [key: string]: any;
}

/**
 * Decode JWT token and extract payload
 * JWT format: header.payload.signature
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    // Add padding if needed
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getSchoolIdFromToken(token: string): string | null {
  const payload = decodeJWT(token);
  if (!payload) {
    return null;
  }
  return payload.schoolId || null;
}
