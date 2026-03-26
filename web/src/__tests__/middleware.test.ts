/**
 * @jest-environment node
 */
import { middleware } from '../../middleware';
import { NextRequest, NextResponse } from 'next/server';

// JWT tokens with known payloads (unsigned — decode-only)
// payload: {"sub":"parent-123","email":"test@test.com","schoolId":"school-456"}
const TOKEN_WITH_SCHOOL_ID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXJlbnQtMTIzIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwic2Nob29sSWQiOiJzY2hvb2wtNDU2In0.fake-sig';

// payload: {"sub":"parent-123","email":"test@test.com"}
const TOKEN_WITHOUT_SCHOOL_ID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXJlbnQtMTIzIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.fake-sig';

function makeRequest(pathname: string, token?: string): NextRequest {
  const url = `http://localhost:3001${pathname}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers['cookie'] = `onmyway_token=${token}`;
  }
  return new NextRequest(url, { headers });
}

describe('middleware', () => {
  describe('protected /dashboard routes', () => {
    it('redirects to /login when no token is present', () => {
      const req = makeRequest('/dashboard/school-456/arrivals');
      const res = middleware(req);

      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
    });

    it('allows through when a token is present on /dashboard', () => {
      const req = makeRequest('/dashboard/school-456/arrivals', TOKEN_WITH_SCHOOL_ID);
      const res = middleware(req);

      // NextResponse.next() returns 200
      expect(res.status).toBe(200);
    });

    it('redirects nested /dashboard paths to /login when no token', () => {
      const req = makeRequest('/dashboard/school-abc/stats');
      const res = middleware(req);

      expect(res.headers.get('location')).toContain('/login');
    });
  });

  describe('/login route', () => {
    it('redirects to /dashboard/{schoolId}/arrivals when token contains schoolId', () => {
      const req = makeRequest('/login', TOKEN_WITH_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dashboard/school-456/arrivals');
    });

    it('redirects to /dashboard fallback when token has no schoolId', () => {
      const req = makeRequest('/login', TOKEN_WITHOUT_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get('location');
      expect(location).toContain('/dashboard');
      expect(location).not.toContain('/dashboard/');
    });

    it('allows through (no redirect) when no token is present', () => {
      const req = makeRequest('/login');
      const res = middleware(req);

      expect(res.status).toBe(200);
    });

    it('redirects to /dashboard fallback when token is malformed', () => {
      const req = makeRequest('/login', 'not.a.valid.jwt.at.all');
      const res = middleware(req);

      // malformed token → decodeJWT returns null → fallback redirect
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dashboard');
    });
  });

  describe('other routes', () => {
    it('passes through unmatched routes regardless of token', () => {
      const req = makeRequest('/some-other-path', TOKEN_WITH_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(200);
    });
  });
});
