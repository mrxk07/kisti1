import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { destroySession, AuthError } from '@/lib/auth';
import { adminLoginSchema } from '@/lib/validation';
import { hashPassword, verifyPassword, getClientIP } from '@/lib/security';
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_HOURS, generateSessionToken } from '@/lib/constants';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
 try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const seedEmail = process.env.ADMIN_SEED_EMAIL;
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;

    if (!seedEmail || !seedPassword) {
      return NextResponse.json({ success: false, error: 'Admin login is not configured' }, { status: 400 });
    }

    if (email !== seedEmail || password !== seedPassword) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Find or create admin user
    let admin = await db.user.findUnique({ where: { email: seedEmail } });

    if (!admin) {
      const passwordHash = hashPassword(seedPassword);
      admin = await db.user.create({
        data: {
          email: seedEmail,
          name: 'Admin',
          role: 'ADMIN',
          isDemo: false,
          passwordHash,
        },
      });
    }

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    const cookieStore = await cookies();

    await db.demoSession.create({
      data: {
        userId: admin.id,
        token,
        ipHash: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
        expiresAt,
      },
    });

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'ADMIN_LOGIN',
        ipAddress: getClientIP(request),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isDemo: admin.isDemo,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}

export async function DELETE() {
 try {
    await destroySession();
    return NextResponse.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
