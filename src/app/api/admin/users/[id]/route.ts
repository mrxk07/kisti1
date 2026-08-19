import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { getClientIP } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        balance: true,
        isDemo: true,
        ipHash: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            applications: true,
            transactions: true,
            repayments: true,
            notifications: true,
            supportTickets: true,
            demoSessions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot reset admin accounts' }, { status: 400 });
    }

    // Delete all related data atomically
    await db.$transaction([
      db.notification.deleteMany({ where: { userId: id } }),
      db.supportMessage.deleteMany({ where: { userId: id } }),
      db.supportTicket.deleteMany({ where: { userId: id } }),
      db.auditLog.deleteMany({ where: { userId: id } }),
      db.repayment.deleteMany({ where: { userId: id } }),
      db.transaction.deleteMany({ where: { userId: id } }),
      db.application.deleteMany({ where: { userId: id } }),
      db.verification.deleteMany({ where: { userId: id } }),
      db.demoSession.deleteMany({ where: { userId: id } }),
      db.user.update({
        where: { id },
        data: { balance: 0 },
      }),
    ]);

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'RESET_USER_ACCOUNT',
        details: `Reset account for user ${user.name || user.id}`,
        ipAddress: getClientIP(request),
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'User account has been reset successfully' },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to reset account' }, { status: 500 });
  }
}
