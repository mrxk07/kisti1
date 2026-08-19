import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { formatTaka } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [applications, total] = await Promise.all([
      db.application.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.application.count({ where }),
    ]);

    const data = applications.map((app) => ({
      id: app.id,
      userId: app.userId,
      userName: app.user.name,
      userEmail: app.user.email,
      planName: app.plan.name,
      status: app.status,
      principalAmount: app.principalAmount,
      interestAmount: app.interestAmount,
      totalAmount: app.totalAmount,
      principalFormatted: formatTaka(app.principalAmount),
      totalFormatted: formatTaka(app.totalAmount),
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        applications: data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
  }
}
