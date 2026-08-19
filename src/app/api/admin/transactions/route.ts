import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { formatTaka } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ]);

    const data = transactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      userName: tx.user.name,
      userEmail: tx.user.email,
      type: tx.type,
      amount: tx.amount,
      amountFormatted: formatTaka(tx.amount),
      description: tx.description,
      status: tx.status,
      referenceId: tx.referenceId,
      createdAt: tx.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
