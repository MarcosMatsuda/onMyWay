import { NextRequest, NextResponse } from 'next/server';

function decodeJWT(token: string) {
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

export function middleware(request: NextRequest) {
  const token = request.cookies.get('onmyway_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Protect /admin/* paths - requires super_admin role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = decodeJWT(token);
    if (payload?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect /dashboard/* paths - requires authentication
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Public paths: redirect to appropriate dashboard based on role if already authenticated
  if (pathname === '/login') {
    if (token) {
      const payload = decodeJWT(token);

      if (payload?.role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin/schools', request.url));
      }

      if (payload?.role === 'school_admin' && payload?.schoolId) {
        return NextResponse.redirect(
          new URL(`/dashboard/${payload.schoolId}/arrivals`, request.url),
        );
      }

      // Fallback for unknown roles
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};
