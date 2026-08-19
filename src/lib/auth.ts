import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_HOURS, generateSessionToken } from '@/lib/constants';
import { hashIP, getClientIP } from '@/lib/security';
import type { User, DemoSession } from '@prisma/client';

export interface SessionUser {
  id: string;
  name: string | null;
  role: string;
  isDemo: boolean;
}

export async function getOrCreateDemoUser(request: Request): Promise<{ user: User; session: DemoSession }> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Try to find existing valid session
  if (existingToken) {
    const session = await db.demoSession.findUnique({
      where: { token: existingToken },
      include: { user: true },
    });
    if (session && session.expiresAt > new Date()) {
      return { user: session.user, session };
    }
    // Session expired, delete it
    if (session) {
      await db.demoSession.delete({ where: { id: session.id } });
    }
  }

  // Create new demo user
  const ip = getClientIP(request);
  const ipHash = hashIP(ip);
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

  const user = await db.user.create({
    data: {
      name: `Demo User ${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      role: 'DEMO',
      isDemo: true,
      ipHash,
    },
  });

  const session = await db.demoSession.create({
    data: {
      userId: user.id,
      token,
      ipHash,
      userAgent: request.headers.get('user-agent') || undefined,
      expiresAt,
    },
  });

  // Set the cookie
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return { user, session };
}

export async function getCurrentUser(request?: Request): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await db.demoSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
      isDemo: session.user.isDemo,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request?: Request): Promise<SessionUser> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new AuthError('Authentication required');
  }
  return user;
}

export async function requireAdmin(request?: Request): Promise<SessionUser> {
  const user = await requireAuth(request);
  if (user.role !== 'ADMIN') {
    throw new AuthError('Admin access required', 403);
  }
  return user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.demoSession.deleteMany({ where: { token } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}
