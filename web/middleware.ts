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

  // Protected paths
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Public paths: redirect to dashboard if already authenticated
  if (request.nextUrl.pathname === '/login') {
    if (token) {
      const payload = decodeJWT(token);
      const schoolId = payload?.schoolId;
      if (schoolId) {
        return NextResponse.redirect(new URL(`/dashboard/${schoolId}/arrivals`, request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
