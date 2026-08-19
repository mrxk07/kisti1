import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

const PUBLIC_PATHS = ['/', '/api/auth', '/api/demo'];
const ADMIN_PATHS = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    // If user has a valid session, redirect / to /dashboard
    if (pathname === '/') {
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        try {
          const session = await db.demoSession.findUnique({
            where: { token },
            include: { user: true },
          });
          if (session && session.expiresAt > new Date() && session.user.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
          if (session && session.expiresAt > new Date() && session.user.role === 'ADMIN') {
            return NextResponse.redirect(new URL('/admin', request.url));
          }
        } catch {
          // Ignore DB errors in middleware
        }
      }
    }
    return NextResponse.next();
  }

  // Check session for all other paths
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const session = await db.demoSession.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Admin path protection
    if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      if (session.user.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Redirect authenticated non-admin users away from admin
    if (pathname.startsWith('/admin') && session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch {
    // DB error — allow request to continue, server-side auth will handle it
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|api/demo).*)'],
};
