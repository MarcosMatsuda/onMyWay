import { decodeJWT, getSchoolIdFromToken } from '../jwt';

// JWT tokens generated with known payloads for testing (unsigned, decode-only)
// header: {"alg":"HS256","typ":"JWT"}
const TOKEN_WITH_SCHOOL_ID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXJlbnQtMTIzIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwic2Nob29sSWQiOiJzY2hvb2wtNDU2In0.fake-sig';
// payload: {"sub":"parent-123","email":"test@test.com","schoolId":"school-456"}

const TOKEN_WITHOUT_SCHOOL_ID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXJlbnQtMTIzIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.fake-sig';
// payload: {"sub":"parent-123","email":"test@test.com"}

const TOKEN_WITH_NULL_SCHOOL_ID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXJlbnQtMTIzIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwic2Nob29sSWQiOm51bGx9.fake-sig';
// payload: {"sub":"parent-123","email":"test@test.com","schoolId":null}

describe('decodeJWT', () => {
  it('decodes a valid JWT and returns its payload', () => {
    const result = decodeJWT(TOKEN_WITH_SCHOOL_ID);
    expect(result).toEqual({
      sub: 'parent-123',
      email: 'test@test.com',
      schoolId: 'school-456',
    });
  });

  it('returns null for a token with fewer than 3 parts', () => {
    expect(decodeJWT('only.two')).toBeNull();
    expect(decodeJWT('one')).toBeNull();
  });

  it('returns null for a token with more than 3 parts', () => {
    expect(decodeJWT('a.b.c.d')).toBeNull();
  });

  it('returns null for a non-JSON payload', () => {
    // header.not-valid-json.sig
    const invalidPayload = 'eyJhbGciOiJIUzI1NiJ9.bm90LWpzb24.sig';
    expect(decodeJWT(invalidPayload)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(decodeJWT('')).toBeNull();
  });

  it('handles base64 payloads that need padding', () => {
    // The token with schoolId has a payload length that requires padding handling
    const result = decodeJWT(TOKEN_WITH_SCHOOL_ID);
    expect(result).not.toBeNull();
    expect(result!.schoolId).toBe('school-456');
  });

  it('decodes a payload where schoolId is null', () => {
    const result = decodeJWT(TOKEN_WITH_NULL_SCHOOL_ID);
    expect(result).not.toBeNull();
    expect(result!.schoolId).toBeNull();
  });
});

describe('getSchoolIdFromToken', () => {
  it('returns schoolId when present in the JWT payload', () => {
    expect(getSchoolIdFromToken(TOKEN_WITH_SCHOOL_ID)).toBe('school-456');
  });

  it('returns null when JWT payload has no schoolId field', () => {
    expect(getSchoolIdFromToken(TOKEN_WITHOUT_SCHOOL_ID)).toBeNull();
  });

  it('returns null when schoolId is null in the JWT payload', () => {
    expect(getSchoolIdFromToken(TOKEN_WITH_NULL_SCHOOL_ID)).toBeNull();
  });

  it('returns null for a malformed token', () => {
    expect(getSchoolIdFromToken('not.a.valid')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(getSchoolIdFromToken('')).toBeNull();
  });
});
