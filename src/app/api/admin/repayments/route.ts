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
    const applicationId = searchParams.get('applicationId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (applicationId) where.applicationId = applicationId;

    const [repayments, total] = await Promise.all([
      db.repayment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          application: { include: { plan: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.repayment.count({ where }),
    ]);

    const data = repayments.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      applicationId: r.applicationId,
      planName: r.application.plan?.name,
      installmentNumber: r.installmentNumber,
      dueAmount: r.dueAmount,
      dueAmountFormatted: formatTaka(r.dueAmount),
      paidAmount: r.paidAmount,
      paidAmountFormatted: formatTaka(r.paidAmount),
      status: r.status,
      dueDate: r.dueDate,
      paidAt: r.paidAt,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        repayments: data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch repayments' }, { status: 500 });
  }
}
