/**
 * @jest-environment node
 */
import { middleware } from '../../middleware';
import { NextRequest, NextResponse } from 'next/server';

// JWT tokens with known payloads (unsigned — decode-only)
// payload: {"sub":"user-123","role":"super_admin"}
const TOKEN_SUPER_ADMIN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInJvbGUiOiJzdXBlcl9hZG1pbiJ9.fake-sig';

// payload: {"sub":"user-456","role":"school_admin","schoolId":"school-456"}
const TOKEN_SCHOOL_ADMIN_WITH_SCHOOL_ID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQ1NiIsInJvbGUiOiJzY2hvb2xfYWRtaW4iLCJzY2hvb2xJZCI6InNjaG9vbC00NTYifQ.fake-sig';

// payload: {"sub":"user-789","role":"school_admin"}
const TOKEN_SCHOOL_ADMIN_WITHOUT_SCHOOL_ID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTc4OSIsInJvbGUiOiJzY2hvb2xfYWRtaW4ifQ.fake-sig';

// payload: {"sub":"parent-123","role":"parent","schoolId":"school-456"}
const TOKEN_PARENT_WITH_SCHOOL_ID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXJlbnQtMTIzIiwicm9sZSI6InBhcmVudCIsInNjaG9vbElkIjoic2Nob29sLTQ1NiJ9.fake-sig';

// payload: {"invalid":"token"}
const MALFORMED_TOKEN = 'not.a.valid.jwt.at.all';

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

    it('allows through when school_admin token is present on /dashboard', () => {
      const req = makeRequest('/dashboard/school-456/arrivals', TOKEN_SCHOOL_ADMIN_WITH_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(200);
    });

    it('allows through when super_admin token is present on /dashboard', () => {
      const req = makeRequest('/dashboard/school-456/arrivals', TOKEN_SUPER_ADMIN);
      const res = middleware(req);

      expect(res.status).toBe(200);
    });

    it('redirects nested /dashboard paths to /login when no token', () => {
      const req = makeRequest('/dashboard/school-abc/stats');
      const res = middleware(req);

      expect(res.headers.get('location')).toContain('/login');
    });
  });

  describe('/admin/* protected routes', () => {
    it('redirects to /login when accessing /admin/schools without token', () => {
      const req = makeRequest('/admin/schools');
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
    });

    it('allows through for super_admin on /admin/schools', () => {
      const req = makeRequest('/admin/schools', TOKEN_SUPER_ADMIN);
      const res = middleware(req);

      expect(res.status).toBe(200);
    });

    it('allows through for super_admin on nested /admin paths', () => {
      const req = makeRequest('/admin/schools/123/edit', TOKEN_SUPER_ADMIN);
      const res = middleware(req);

      expect(res.status).toBe(200);
    });

    it('redirects to /login for school_admin on /admin/schools', () => {
      const req = makeRequest('/admin/schools', TOKEN_SCHOOL_ADMIN_WITH_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
    });

    it('redirects to /login when token is malformed on /admin route', () => {
      const req = makeRequest('/admin/schools', MALFORMED_TOKEN);
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
    });
  });

  describe('/login route', () => {
    it('redirects to /admin/schools for super_admin', () => {
      const req = makeRequest('/login', TOKEN_SUPER_ADMIN);
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/admin/schools');
    });

    it('redirects to /dashboard/{schoolId}/arrivals for school_admin with schoolId', () => {
      const req = makeRequest('/login', TOKEN_SCHOOL_ADMIN_WITH_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dashboard/school-456/arrivals');
    });

    it('redirects to /login for school_admin without schoolId', () => {
      const req = makeRequest('/login', TOKEN_SCHOOL_ADMIN_WITHOUT_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
    });

    it('redirects to /login for parent role', () => {
      const req = makeRequest('/login', TOKEN_PARENT_WITH_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
    });

    it('allows through (no redirect) when no token is present', () => {
      const req = makeRequest('/login');
      const res = middleware(req);

      expect(res.status).toBe(200);
    });

    it('redirects to /login when token is malformed', () => {
      const req = makeRequest('/login', MALFORMED_TOKEN);
      const res = middleware(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login');
    });
  });

  describe('other routes', () => {
    it('passes through unmatched routes regardless of token', () => {
      const req = makeRequest('/some-other-path', TOKEN_SCHOOL_ADMIN_WITH_SCHOOL_ID);
      const res = middleware(req);

      expect(res.status).toBe(200);
    });
  });
});
